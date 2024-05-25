import React from "react";
import Wait from "./elements/wait";

import { call } from "../api/api.js";

class TaskDemo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            task_id: props.task_id,
            status: "fail",
            label: ""
        }
    }

    async update() {
        let resp = await call("task", { task_id: this.state.task_id }, localStorage.getItem('token'))

        let demo = resp.service_demo
        console.log(resp.service_demo)

        if (demo.state === 'ok') {
            this.setState({
                status: "ok",
                label: demo.url
            })
            return
        }
        if (demo.state === 'fail') {
            this.setState({
                status: "fail",
                label: ""
            })
            return
        }

        this.setState({
            status: "fail",
            label: ""
        })
    }

    componentDidMount() {
        this.update()
        setInterval(this.update.bind(this), 10000)
    }

    render() {
        return (
            <div className="p-3 rounded-xl
            bg-light-primaryContainer text-light-onPrimaryContainer
            dark:bg-dark-primaryContainer dark:text-dark-onPrimaryContainer">
                <div className="p-1 flex flex-row gap-2">

                    {this.state.status === "ok" &&
                        <div class="mt-0.5 w-4 h-4 bg-green-500 rounded-full self-center aspect-square"></div>
                    }
                    {this.state.status === "fail" &&
                        <div class="mt-0.5 w-4 h-4 bg-red-500 rounded-full self-center aspect-square"></div>
                    }

                    {this.state.status === "ok" &&
                        <a className="self-center text-blue-600 dark:text-blue-300" href={this.state.label}>{this.state.label}</a>
                    }
                    {this.state.status === "fail" &&
                        <Wait text="Демка скоро поднимется" />
                    }
                </div>
            </div>
        )
    }
}

export { TaskDemo }
