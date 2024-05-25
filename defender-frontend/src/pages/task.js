import React from "react";
import Wait from "./elements/wait";

import { call } from "../api/api.js";
import { useParams } from "react-router-dom";
import { TaskDemo } from "./task_demo.js";
import { convert_status } from "./utils.js";
import MyMachine from "./elements/my-machine.js";
import Breadcrumbs, { Breadcrumb } from "./elements/breadcrumbs.js";

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
            // defence: {
            //     display: {
            //         buttons: {
            //             create_enabled: false,
            //             start_enabled: false,
            //             stop_enabled: false,
            //             remove_enabled: false,
            //         },
            //         messagebox: false,
            //         check_button: false,
            //     },

            //     messagebox_text: "test\ntest2\ntest3"
            // },
            // machine_progress: {
            //     in_progress: false,
            //     process_label: ""
            // },
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

    render() {
        return (
            <div>
                <Breadcrumbs username={this.state.username}>
                    <Breadcrumb href="/tasks">
                        Таски
                        {/* <div className=" aspect-square w-14 text-center flex justify-center flex-col">  {"←"} </div> */}
                    </Breadcrumb>
                    <Breadcrumb href="/tasks">
                        <span>{this.state.title}</span>
                    </Breadcrumb>
                </Breadcrumbs>

                {/* <div className="mb-4">
                    <p className="block text-2xl font-semibold mb-2">
                        Задача с RuCTF 2034
                    </p>
                </div> */}


                <div className="p-6 rounded-xl shadow-md
                bg-light-surface text-light-onSurface
                dark:bg-dark-surface dark:text-dark-onSurface
                    ">
                    <h1 className="block text-3xl font-semibold mb-8">
                        Атакуйте
                    </h1>
                    {/* bg-light-primaryContainer text-light-onPrimaryContainer
                    dark:bg-dark-primaryContainer dark:text-dark-onPrimaryContainer */}
                    <div className="my-4 py-2 rounded-xl
                    ">
                        <p className="block text-2xl font-semibold mb-2">
                            1. Скачайте сервис
                            <a href={this.state.download_url}
                                // style={{ background: "#d4578e" }}
                                className="hover:scale-105 duration-500 ml-3 font-bold inline-block
                             text-xl rounded-md py-2 px-3 leading-tight
                            bg-light-primary text-light-onPrimary
                            dark:bg-dark-primary dark:text-dark-onPrimary
                            ">
                                Скачать
                            </a>
                        </p>
                        <p className="block text-xl font-semibold mb-4">
                            Прочитайте код и найдите уязимость, которая позволит узнать флаги
                        </p>
                    </div>
                    {/* bg-light-primaryContainer text-light-onPrimaryContainer
                    dark:bg-dark-primaryContainer dark:text-dark-onPrimaryContainer */}
                    <div className="
                    my-4 py-2 rounded-xl
                    ">
                        <p className="block text-2xl font-semibold mb-2">
                            2. Напишите эксплойт
                        </p>
                        <p className="block text-xl font-semibold mb-4">
                            Первым аргументом (в sys.argv) он принимает адрес машины с сервисом, и должен вывести все найденные флаги в stdout. <a href={this.state.exploit_example} className="text-blue-600 dark:text-blue-300 font-bold">пример</a>
                        </p>
                        <p className="block text-xl font-semibold mb-4 flex flex-row gap-4">
                            <div className="self-center">Демка сервиса доступна здесь:</div>
                            <TaskDemo task_id={this.state.task_id} />
                        </p>
                        <p className="block text-xl font-semibold mb-2">
                            Python, Requests предустановлены:
                        </p>
                        <textarea id="exploit_code" className="
                            p-4 w-full code text-md my-4 rounded-xl duration-75
                            bg-light-surfaceVariant text-light-onSurfaceVariant
                            dark:bg-dark-surfaceVariant dark:text-dark-onSurfaceVariant
                        " rows="10">

                        </textarea>
                        <button onClick={this.send_exploit.bind(this)} className={"duration-500 text-light-onPrimary dark:text-dark-onPrimary font-bold appearance-none rounded-md p-3 mb-2 " + (this.state.exploit_testing ? "bg-gray-300" : "bg-light-primary dark:bg-dark-primary hover:scale-105")}>
                            Отправить
                        </button>

                        {this.state.exploit.status != null && this.state.exploit.status !== "checked" &&
                            <div className="text-2xl font-semibold pt-1">
                                <Wait text={convert_status(this.state.exploit.status)} />
                            </div>
                        }

                        {this.state.exploit.status === "checked" &&
                            <div className={"text-5xl font-bold pt-1 " + (this.state.exploit.result ? "text-green-500" : "text-red-500")}>
                                {this.state.exploit.result ? "✓" : "⨯"}
                            </div>
                        }
                    </div>
                </div>


                <div className="p-6 my-4 rounded-xl shadow-md
                bg-light-surface text-light-onSurface
                dark:bg-dark-surface dark:text-dark-onSurface">
                    <p className="block text-3xl font-semibold mb-8">
                        Защититесь
                    </p>

                    <p className="block text-xl font-semibold mb-4">
                        После успешного эксплойта, вы сможете запустить виртуалку с сервисом и исправить на ней уязвимости
                    </p>
                    {this.state.defence_unlocked &&
                        <div>
                            <MyMachine />
                        </div>
                    }


                </div>

                <div className="p-6 my-4 rounded-xl shadow-md
                bg-light-surface text-light-onSurface
                dark:bg-dark-surface dark:text-dark-onSurface">
                    {/* <p className="block text-3xl font-semibold mb-8">
                        
                    </p> */}
                    <p className="block text-xl font-semibold mb-4">
                        После успешной защиты, вы получите флаг и сможете перейти к рейтинговой игре
                    </p>
                    <p className="block text-xl font-semibold mb-4">
                        Ваш флаг: {this.state.flag}
                    </p>
                </div>

                {this.state.passed_to_rating &&
                    <a href={"/scoreboard/" + this.state.task_id} 
                    className="duration-500 w-full p-4 h-32 shadow-md
                    bg-light-primaryContainer text-light-onPrimaryContainer hover:bg-light-primaryFixedDim
                    dark:bg-dark-primaryContainer dark:text-dark-onPrimaryContainer dark:hover:bg-dark-onPrimary
                    text-center align-middle flex justify-center flex-col
                    rounded-xl appearance-none font-bold">
                        Перейти в рейтинговую игру
                    </a>
                }
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
