import React from "react";
import Wait from "../../elements/wait";

import { call } from "../../../api/api.js";
import { useParams } from "react-router-dom";

class MachineControl extends React.Component {
    // TODO: Make defence (and attack?) another component

    constructor(props) {
        super(props);
        this.state = {
            username: localStorage.getItem("username"),
            task_id: this.props.params.id,
            task: {
                title: "kek"
            },
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
            machine_progress: {
                in_progress: false,
                process_label: ""
            },

            messagebox_text: "test\ntest2\ntest3"
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

        // document.getElementById("exploit_code").value = data["exploit_code"]

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


    }


    async create_box() {
        if (this.state.display.buttons.create_enabled) {
            this.setState({
                display: {
                    buttons: {
                        create_enabled: false
                    }
                }
            })
            await this.request("task/defence/box/create")
        }
    }

    async start_box() {
        if (this.state.display.buttons.start_enabled) {
            this.setState({
                display: {
                    buttons: {
                        start_enabled: false
                    }
                }
            })
            await this.request("task/defence/box/start")
        }
    }

    async stop_box() {
        if (this.state.display.buttons.stop_enabled) {
            this.setState({
                display: {
                    buttons: {
                        stop_enabled: false
                    }
                }
            })
            await this.request("task/defence/box/stop")
        }
    }

    async remove_box() {
        if (this.state.display.buttons.remove_enabled) {
            this.setState({
                display: {
                    buttons: {
                        remove_enabled: false
                    }
                }
            })
            await this.request("task/defence/box/remove")
        }
    }

    render() {
        return (
            <div className="pt-4">
                <div className="mb-4">
                    <div>
                        <button onClick={this.create_box.bind(this)} className={"text-white font-bold appearance-none rounded-md p-3 mb-3 mr-2 " + (this.state.display.buttons.create_enabled ? "bg-red-500" : "bg-gray-300")}>
                            Создать виртуалку
                        </button>
                        <button onClick={this.start_box.bind(this)}
                            className={"text-white font-bold appearance-none rounded-md p-3 mb-3 mr-2 " + (this.state.display.buttons.start_enabled ? "bg-green-400" : "bg-gray-300")}>
                            Включить
                        </button>
                        <button onClick={this.stop_box.bind(this)}
                            className={"text-white font-bold appearance-none rounded-md p-3 mb-3 mr-2 " + (this.state.display.buttons.stop_enabled ? "bg-red-400" : "bg-gray-300")}>
                            Выключить
                        </button>
                        <button onClick={this.remove_box.bind(this)}
                            className={"text-white font-bold appearance-none rounded-md p-3 mb-3 " + (this.state.display.buttons.remove_enabled ? "bg-black" : "bg-gray-300")}>
                            Удалить виртуалку
                        </button>


                        {this.state.machine_progress.in_progress &&
                            <div className="text-2xl mb-2 font-semibold">
                                <Wait text={this.state.machine_progress.process_label} />
                            </div>
                        }

                        {this.state.display.messagebox &&
                            <p className="block text-xl font-mono mb-2">
                                {this.state.messagebox_text.split("\n").map(line => (
                                    <span>{line}<br /></span>
                                ))}
                            </p>
                        }
                        {/* <p className="block text-xl font-semibold mb-2">
                            Пофиксите и нажмите на эту кнопку
                        </p>
                        <button onClick={this.defence_test.bind(this)} className={"text-white font-bold appearance-none rounded-md p-3 mb-3 " + (this.state.display.check_button ? "bg-blue-500" : "bg-gray-300")}>
                            Протестировать
                        </button>

                        {this.state._testing &&
                            <div className="text-2xl mb-2 font-semibold">
                                <Wait text="Проверяем" />
                            </div>}

                        {this.state.checks != null &&
                            <div id="checks" className="flex justify-start flex-wrap">
                                {this.state.checks.map(check => (
                                    <h3 className={"p-3 rounded-md mr-2 mb-2 " + (check.passed ? this.check_colors["green"] : this.check_colors["red"])}>{check.comment}</h3>
                                ))}
                            </div>
                        } */}
                    </div>
                </div>
            </div>
        );
    }
}

export default (props) => (
    <MachineControl
        {...props}
        params={useParams()}
    />)
// export default withRouter Task;
