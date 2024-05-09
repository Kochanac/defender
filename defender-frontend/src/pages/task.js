import React from "react";
import Wait from "./elements/wait";

import { call } from "../api/api.js";
import { useParams } from "react-router-dom";
import { TaskDemo } from "./task_demo.js";

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
            task_id: this.props.params.id,

            exploit: {
                status: "none",
                result: false
            },
            exploit_testing: false,

            defence_unlocked: false,
            defence: {
                display: {
                    buttons: {
                        create_enabled: false,
                        start_enabled: false,
                        stop_enabled: false,
                        remove_enabled: false,
                    },
                    messagebox: false,
                    check_button: false,
                },

                messagebox_text: "test\ntest2\ntest3"
            },
            machine_progress: {
                in_progress: false,
                process_label: ""
            },
            defence_testing: false,

            checks: [
            ],

            flag: "???",
            passed_to_rating: false
        }
    }

    componentDidMount() {
        this.prepare_task()
    }

    check_colors = {
        "green": "bg-green-200",
        "red": "bg-red-200"
    }

    async request(url, data = {}) {
        data.task_id = this.state.task_id
        // data.token = localStorage.getItem("token")

        let resp = await call(url, data, localStorage.getItem("token"));


        // if (resp["error"] !== 0) {
        //     console.log("lox", resp)
        //     this.setState({
        //         username: "#$&%*!",
        //         title: "Error " + resp["error"],

        //         exploit_testing: false,
        //         defence_starting: false,
        //         defence_testing: false
        //     })
        // }

        return resp
    }

    async prepare_task() {
        let data = await this.request("task")

        this.setState({
            exploit_example: data["exploit_example"],
            service_demo: data["service_demo"],
            download_url: data["download_url"],
            title: data["title"],
        })

        document.getElementById("exploit_code").value = data["exploit_code"]

        this.update_task()
        setInterval(this.update_task.bind(this), 4000)
    }

    async update_task() {
        let data = await this.request("task/state")

        this.setState({
            exploit: {
                status: data["exploit_status"],
                result: (data["exploit_result"] && data["exploit_result"] === "OK")
            },
        })

        if (data["exploit_status"] === "checked") {
            this.setState({
                exploit_testing: false
            }
            )
        }

        if (data["exploit_status"] === "in progress") {
            this.setState({
                exploit_testing: true
            })
        }

        if (data.flag) {
            this.setState({
                flag: data.flag,
                passed_to_rating: true
            })
        }


        this.setState({
            defence_unlocked: data.defence_unlocked
        })


        if (this.state.defence_unlocked) {
            this.update_defence_state()
        }
    }

    async update_defence_state() {
        var data = await this.request("task/defence/box/status")
        console.log("kek", data)

        if (data.error === 404) {
            this.setState({
                machine_progress: {
                    in_progress: false,
                },
                defence: {
                    display: {
                        buttons: {
                            create_enabled: true,
                            start_enabled: false,
                            stop_enabled: false,
                            remove_enabled: false,
                        },
                        messagebox: false,
                        check_button: false,
                    },
                    messagebox_text: "",
                }
            })
            return
        }


        if (data.status === "starting") {
            this.setState({
                defence: {
                    display: {
                        buttons: {
                        }
                    }
                },
                machine_progress: {
                    in_progress: true,
                    process_label: "Запускаю"
                }
            })
            return
        }

        if (data.status === "removing") {
            this.setState({
                machine_progress: {
                    in_progress: true,
                    process_label: "Удаляю"
                }
            })
            return
        }

        if (data.status === "turning_off") {
            this.setState({
                machine_progress: {
                    in_progress: true,
                    process_label: "Выключаю"
                }
            })
            return
        }

        if (data.status === "off") {
            this.setState({
                machine_progress: {
                    in_progress: false,
                    process_label: ""
                }
            })


            this.setState({
                defence: {
                    display: {
                        buttons: {
                            create_enabled: false,
                            start_enabled: true,
                            stop_enabled: false,
                            remove_enabled: true,
                        },
                        messagebox: true,
                        check_button: false,
                    },
                    messagebox_text: ""
                },

            })
        }

        if (data.status === "on") {
            this.setState({
                machine_progress: {
                    in_progress: false,
                    process_label: ""
                }
            })

            this.setState({
                defence: {
                    display: {
                        buttons: {
                            create_enabled: false,
                            start_enabled: false,
                            stop_enabled: true,
                            remove_enabled: true,
                        },
                        messagebox: true,
                        check_button: true,
                    },
                    messagebox_text: data.message
                },

            })

            if (this.state.defence_testing) {
                data = await this.request("task/defence/test/checks")

                if (data.status === "in progress") {
                    this.setState({
                        defence_testing: true
                    })
                }

                if (data.status === "checked") {
                    this.setState({
                        defence_testing: false
                    })
                }
                console.log("asd", data)
                if (data.results != null) {
                    this.setState({
                        checks: data.results.results
                    })
                }
            }
        }
    }

    async send_exploit() {
        if (!this.state.exploit_testing) {
            this.setState({
                exploit_testing: true
            })

            let exp_code = document.getElementById("exploit_code").value

            let data = await this.request("task/exploit/upload", { exploit_text: exp_code })
        }
    }

    async create_box() {
        if (this.state.defence.display.buttons.create_enabled) {
            this.setState({
                defence: {
                    display: {
                        buttons: {
                            create_enabled: false
                        }
                    }
                }
            })
            await this.request("task/defence/box/create")
        }
    }

    async start_box() {
        if (this.state.defence.display.buttons.start_enabled) {
            this.setState({
                defence: {
                    display: {
                        buttons: {
                            start_enabled: false
                        }
                    }
                }
            })
            await this.request("task/defence/box/start")
        }
    }

    async stop_box() {
        if (this.state.defence.display.buttons.stop_enabled) {
            this.setState({
                defence: {
                    display: {
                        buttons: {
                            stop_enabled: false
                        }
                    }
                }
            })
            await this.request("task/defence/box/stop")
        }
    }

    async remove_box() {
        if (this.state.defence.display.buttons.remove_enabled) {
            this.setState({
                defence: {
                    display: {
                        buttons: {
                            remove_enabled: false
                        }
                    }
                }
            })
            await this.request("task/defence/box/remove")
        }
    }

    async defence_test() {
        if (this.state.defence.display.check_button) {
            this.setState({
                defence_testing: true
            })

            await this.request("task/defence/test/start")
        }
    }

    render() {
        return (
            <div>
                <div className="mb-9 flex gap-4">
                    <div className="text-5xl p-4 bg-gray-200 rounded" onClick={() => { window.location.href = "/tasks" }}> <div className=" aspect-square w-14 text-center flex justify-center flex-col">  {"←"} </div></div>
                    <h1 className="text-5xl p-4  rounded flex justify-end flex-col" onClick={() => { window.location.href = "/tasks" }} >{this.state.title}</h1>
                    <div className="flex-grow" />
                    <div className="flex flex-col">
                        <div className="flex-grow" />
                        <h1 className="text-2xl text-gray-600 align-bottom">@{this.state.username}</h1>
                    </div>
                </div>

                {/* <div className="mb-4">
                    <p className="block text-3xl font-semibold mb-2">
                        0. Дисклеймер
                    </p>
                    <p className="block text-xl font-semibold mb-2">
                        Пункт 2 пока что не работает. Просто прокликайте кнопку в пункте 2 и запускайте себе виртуалку, ваша цель: защититься от атак системы.
                    </p>
                </div> */}
                <div className="mb-4">
                    <p className="block text-3xl font-semibold mb-2">
                        1. Скачайте сервис
                        <a href={this.state.download_url}
                            style={{ background: "#d4578e" }}
                            className="hover:scale-105 duration-500 ml-3 font-bold inline-block
                                text-white text-xl rounded-md py-2 px-3 leading-tight">
                            Скачать
                        </a>
                    </p>
                    <p className="block text-xl font-semibold mb-4">
                        Прочитайте код и найдите уязимость, которая позволит узнать флаги
                    </p>
                </div>
                <div className="mb-4">
                    <p className="block text-3xl font-semibold mb-2">
                        2. Напишите эксплойт
                    </p>
                    <p className="block text-xl font-semibold mb-4">
                        Первым аргументом (в sys.argv) он принимает адрес машины с сервисом, и должен вывести все найденные флаги в stdout. <a href={this.state.exploit_example} className="text-blue-900 font-bold">пример</a>
                    </p>
                    <p className="block text-xl font-semibold mb-4 flex flex-row gap-4">
                        <div className="self-center">Демка сервиса доступна здесь:</div>
                        <TaskDemo task_id={this.state.task_id} />
                    </p>
                    <p className="block text-xl font-semibold mb-2">
                        Python, Requests предустановлены:
                    </p>
                    <textarea id="exploit_code" className="p-3 w-full font-mono text-lg bg-gray-100 mb-2" rows="10">

                    </textarea>
                    <button onClick={this.send_exploit.bind(this)} className={"duration-500 text-white font-bold appearance-none rounded-md p-3 mb-2 " + (this.state.exploit_testing ? "bg-gray-300" : "bg-blue-500 hover:scale-105")}>
                        Отправить
                    </button>

                    {this.state.exploit.status === "starting" &&
                        <div className="text-2xl font-semibold pt-1">
                            <Wait text="Создаю машину" />
                        </div>
                    }
                    {this.state.exploit.status === "waiting for machine" &&
                        <div className="text-2xl font-semibold pt-1">
                            <Wait text="Запускаю сервис" />
                        </div>
                    }
                    {this.state.exploit.status === "sending flags" &&
                        <div className="text-2xl font-semibold pt-1">
                            <Wait text="Отправляю флаги" />
                        </div>
                    }
                    {this.state.exploit.status === "running" &&
                        <div className="text-2xl font-semibold pt-1">
                            <Wait text="Тестирую" />
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
                        После успешного эксплойта, вы сможете запустить виртуалку с сервисом и исправить на ней уязвимости
                    </p>
                    {this.state.defence_unlocked &&
                        <div>
                            <button onClick={this.create_box.bind(this)} className={"duration-500 text-white font-bold appearance-none rounded-md p-3 mb-3 mr-2 " + (this.state.defence.display.buttons.create_enabled ? "bg-red-500 hover:scale-105" : "bg-gray-300")}>
                                Создать виртуалку
                            </button>
                            <button onClick={this.start_box.bind(this)}
                                className={"duration-500 text-white font-bold appearance-none rounded-md p-3 mb-3 mr-2 " + (this.state.defence.display.buttons.start_enabled ? "bg-green-400 hover:scale-105" : "bg-gray-300")}>
                                Включить
                            </button>
                            <button onClick={this.stop_box.bind(this)}
                                className={"duration-500 text-white font-bold appearance-none rounded-md p-3 mb-3 mr-2 " + (this.state.defence.display.buttons.stop_enabled ? "bg-red-400 hover:scale-105" : "bg-gray-300")}>
                                Выключить
                            </button>
                            <button onClick={this.remove_box.bind(this)}
                                className={"duration-500 text-white font-bold appearance-none rounded-md p-3 mb-3 " + (this.state.defence.display.buttons.remove_enabled ? "bg-black hover:scale-105" : "bg-gray-300")}>
                                Удалить виртуалку
                            </button>


                            {this.state.machine_progress.in_progress &&
                                <div className="text-2xl mb-2 font-semibold">
                                    <Wait text={this.state.machine_progress.process_label} />
                                </div>
                            }

                            {this.state.defence.display.messagebox &&
                                <p className="block text-xl font-mono mb-2">
                                    {this.state.defence.messagebox_text.split("\n").map(line => (
                                        <span>{line}<br /></span>
                                    ))}
                                </p>
                            }
                            <p className="block text-xl font-semibold mb-2">
                                Пофиксите и нажмите на эту кнопку
                            </p>
                            <button onClick={this.defence_test.bind(this)} className={"duration-500 text-white font-bold appearance-none rounded-md p-3 mb-3 " + (this.state.defence.display.check_button ? "bg-blue-500 hover:scale-105" : "bg-gray-300")}>
                                Протестировать
                            </button>

                            {this.state.defence_testing &&
                                <div className="text-2xl mb-2 font-semibold">
                                    <Wait text="Проверяем" />
                                </div>}

                            {this.state.checks != null &&
                                <div id="checks" className="flex justify-start flex-wrap">
                                    {this.state.checks.map(check => (
                                        <h3 className={"p-3 rounded-md mr-2 mb-2 " + (check.passed ? this.check_colors["green"] : this.check_colors["red"])}>{check.comment}</h3>
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
                <div className="mb-4">
                    <p className="block text-3xl font-semibold mb-6">
                        5. Учавствуйте в рейтинговой игре против других участников
                    </p>

                    {this.state.passed_to_rating &&
                        <a href={"/scoreboard/" + this.state.task_id} className="duration-500 w-full p-4 bg-purple-500 text-white rounded-md appearance-none font-bold inline-block text-center hover:scale-105">
                            Перейти в рейтинговую игру
                        </a>
                    }
                </div>

            </div>
        );
    }
}

export default (props) => (
    <Task
        {...props}
        params={useParams()}
    />)
// export default withRouter Task;
