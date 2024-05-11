import React from 'react'
import Wait from './wait';
import { call } from '../../api/api';
import { useParams } from "react-router-dom";


class MyMachine extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            task_id: this.props.params.id,
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

            hide_checks: this.props.hide_checks,
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
        this.update_task()
        setInterval(this.update_task.bind(this), 4000)
    }

    async update_task() {
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
            <div className="mb-4">
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

                {!this.state.hide_checks &&
                    <div>
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
        )
    }
}

export default (props) => (
    <MyMachine
        {...props}
        params={useParams()}
    />)
// export default withRouter Task;
