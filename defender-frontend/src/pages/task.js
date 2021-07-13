import React from "react";
import Wait from "./elements/wait";

import { withRouter } from "react-router-dom"; // Я не умею программировать

import { HOST } from "../index.js";

class Task extends React.Component {
    // TODO: Make defence (and attack?) another component

    constructor(props) {
        super(props);

        this.state = {
            username: localStorage.getItem("username"),
            exploit_example: "/404",
            service_demo: "/404",
            download_url: "/404",
            title: "{title}",
            task_id: parseInt(props.match.params.id),

            exploit: {
                status: "none",
                result: false
            },
            exploit_testing: false,

            defence: {
                display: {
                    buttons: {
                        start_disabled: false,
                        stop_visible: false
                    },
                    messagebox: false,
                    check_button: false,
                    check_results: false
                },

                messagebox_text: "test\ntest2\ntest3"
            },
            defence_starting: false,
            defence_testing: false,

            checks: [
            ],

            flag: "???"
        }
    }

    componentDidMount() {
        this.prepare_task()
    }

    check_colors = {
        "green": "bg-green-200",
        "red": "bg-red-200"
    }

    async request(url, data={}) {
        data.task_id = this.state.task_id
        data.token = localStorage.getItem("token")

        let resp = await fetch(HOST + url, {
            method: "POST",
            body: JSON.stringify(data)
        })

        let resp_data = await resp.json();
        if (resp_data["error"] !== 0) {
            console.log("lox")
            this.setState({
                username: "#$&%*!",
                title: "Error " + resp_data["error"],

                exploit_testing: false,
                defence_starting: false,
                defence_testing: false
            })
        }

        return resp_data
    }

    async prepare_task() {
        let data = await this.request("task")

        if (data["error"] !== 0)
            return

        this.setState({
            exploit_example: data["exploit_example"],
            service_demo: data["service_demo"],
            download_url: data["download_url"],
            title: data["title"],
        })

        document.getElementById("exploit_code").value = data["exploit_code"]

        setInterval(this.update_task.bind(this), 4000)
    }

    async update_task() {
        let data = await this.request("task/status")

        this.setState({
            exploit: {
                status: data["status"],
                result: (data["result"] && data["result"] === "OK")
            },
        })

        if (data["status"] === "checked") {
            this.setState({
                    exploit_testing: false
                }
            )
        }

        if (data["status"] === "in progress") {
            this.setState({
                exploit_testing: true
            })
        }

        if (data.flag) {
            this.setState({
                flag: data.flag
            })
        }

        if (this.state.exploit.result) {
            data = await this.request("task/defence/box/status")

            if (data.status === "on") {
                this.setState({
                    defence: {
                        display: {
                            buttons: {
                                start_disabled: true,
                                stop_visible: true
                            },
                            messagebox: true,
                            check_button: true,
                            check_results: true
                        },
                        messagebox_text: data.message
                    },
                    defence_starting: false
                })
            } else {
                this.setState({
                    defence: {
                        display: {
                            buttons: {
                                start_disabled: false,
                                stop_visible: false
                            },
                            messagebox: false,
                            check_button: false,
                            check_results: false
                        },
                        messagebox_text: "No message"
                    }
                })
            }
        }

        if (this.state.defence_testing) {
            data = await this.request("task/defence/test/checks")

            if (data.checks)
                this.setState({
                    checks: data.checks
                })
            else
                this.setState({
                    defence_testing: false
                })

        }
    }

    async send_exploit() {
        if (!this.state.exploit_testing) {
            this.setState({
                exploit_testing: true
            })

            let exp_code = document.getElementById("exploit_code").value

            let data = await this.request("task/exploit/upload", {code: exp_code})
        }
    }

    async start_box() {
        if (!this.state.defence.display.buttons.start_disabled) {
            this.setState({
                defence_starting: true,
                checks: []
            })
            let data = await this.request("task/defence/box/start")

            await this.update_task(); // ?
        }
    }

    async stop_box() {
        if (this.state.defence.display.buttons.stop_visible) {
            let data = await this.request("task/defence/box/stop")

            await this.update_task(); // ?
        }
    }

    async defence_test() {
        if (this.state.defence.display.buttons.start_disabled && !this.state.defence_testing) {
            this.setState({
                defence_testing: true
            })

            await this.request("task/defence/test/start")
        }
    }

    render() {
        return (
            <div>
                <div className="mb-9 flex">
                    <h1 className="text-5xl p-4 bg-gray-200 rounded">{this.state.title}</h1>
                    <div className="flex-grow"/>
                    <div className="flex flex-col">
                        <div className="flex-grow"/>
                        <h1 className="text-2xl text-gray-600 align-bottom">@{this.state.username}</h1>
                    </div>
                </div>

                <div className="mb-4">
                    <p className="block text-3xl font-semibold mb-2">
                        1. Скачайте сервис
                        <a href = {this.state.download_url}
                            style={{background: "#d4578e"}}
                            className="transform scale-105 duration-100 ml-3 font-bold
                                text-white text-xl rounded-md py-2 px-3 leading-tight">
                            Скачать
                        </a>
                    </p>
                </div>
                <div className="mb-4">
                    <p className="block text-3xl font-semibold mb-2">
                        2. Напишите эксплойт
                    </p>
                    <p className="block text-xl font-semibold mb-2">
                        Первым аргументом (в sys.argv) он принимает ссылку на сервис, и должен вывести все найденные флаги в stdout. <a href={this.state.exploit_example} className="text-blue-900 font-bold">пример</a>
                    </p>
                    <p className="block text-xl font-semibold mb-2">
                        Демка сервиса (с флагами) доступна <a href={this.state.service_demo} className="text-blue-900 font-bold">здесь</a>
                    </p>
                    <p className="block text-xl font-semibold mb-2">
                        Python, Requests предустановлены:
                    </p>
                    <textarea id="exploit_code" className="p-3 w-full font-mono text-lg bg-gray-100 mb-2" rows="10">

                    </textarea>
                    <button onClick={this.send_exploit.bind(this)} className={"text-white font-bold appearance-none rounded-md p-3 mb-2 " + (this.state.exploit_testing ? "bg-gray-300" : "bg-blue-500")}>
                        Отправить
                    </button>

                    {this.state.exploit.status === "in progress" &&
                        <div className="text-2xl font-semibold pt-1">
                            <Wait text="Тестирую"/>
                        </div>
                    }

                    {this.state.exploit.status === "checked" &&
                        <div className={"text-5xl font-bold pt-1 " + (this.state.exploit.result ? "text-green-500" : "text-red-500")}>
                            {this.state.exploit.result ? "✓" : "⨯"}
                        </div>
                    }
                </div>
                <div className="mb-4">
                    <p className="block text-3xl font-semibold mb-2">
                        3. Защитите сервис
                    </p>

                    <p className="block text-xl font-semibold mb-2">
                        После успешного эксплойта вы сможете запустить виртуалку с сервисом и исправить на ней уязвимости
                    </p>
                    {this.state.exploit.result &&
                        <div>
                            <button onClick={this.start_box.bind(this)} className={"text-white font-bold appearance-none rounded-md p-3 mb-3 mr-2 " + (this.state.defence.display.buttons.start_disabled ? "bg-gray-300" : "bg-red-500")}>
                                Запустить виртуалку
                            </button>
                            <button onClick={this.stop_box.bind(this)}
                                className={"text-white font-bold appearance-none rounded-md p-3 mb-3 " + (this.state.defence.display.buttons.stop_visible ? "bg-red-400" : "bg-gray-300")}>
                                Удалить виртуалку
                            </button>
                            {this.state.defence_starting &&
                            <div className="text-2xl mb-2 font-semibold">
                                <Wait text="Запускаю"/>
                            </div>
                            }
                            {this.state.defence.display.messagebox &&
                                <p className="block text-xl font-mono mb-2">
                                    { this.state.defence.messagebox_text.split("\n").map(line => (
                                        <span>{line}<br/></span>
                                    )) }
                                </p>
                            }
                            <p className="block text-xl font-semibold mb-2">
                                Пофиксите и нажмите на эту кнопку
                            </p>
                            <button onClick={this.defence_test.bind(this)} className={"text-white font-bold appearance-none rounded-md p-3 mb-3 " + (this.state.defence.display.buttons.start_disabled && !this.state.defence_testing ? "bg-blue-500" : "bg-gray-300")}>
                                Протестировать
                            </button>

                            {this.state.defence.display.check_results &&
                                <div id="checks" className="flex justify-start flex-wrap">
                                    {this.state.checks.map(check => (
                                        <h3 className={"p-3 rounded-md mr-2 mb-2 " + (this.check_colors[check.color])}>{check.text}</h3>
                                    ))}
                                </div>
                            }
                        </div>
                    }
                </div>
                <div className="mb-4">
                    <p className="block text-3xl font-semibold mb-2">
                        4. {this.state.flag}
                    </p>
                </div>
            </div>
        );
    }
}

export default withRouter(Task);
