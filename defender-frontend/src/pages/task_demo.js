import React from "react";
import Wait from "./elements/wait";

import { call } from "../api/api.js";

class TaskDemo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            task_id: props.task_id,
            status: "fail",
            label: "",

            refresh_button_add_classes: "",
            refresh_button_enabled: true,
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

    async kill() {
        call("task/kill-demo", { task_id: this.state.task_id }, localStorage.getItem('token'))
        this.setState({
            refresh_button_add_classes: " animate-spin",
            refresh_button_enabled: false
        })
        // let btn = document.getElementById("refresh-button")
        // btn.classList += " animate-spin"
    }

    componentDidMount() {
        this.update()
        setInterval(this.update.bind(this), 10000)
    }

    render() {
        return (
            <div className="p-3 rounded-xl flex flex-row gap-2
            bg-light-primaryContainer text-light-onPrimaryContainer
            dark:bg-dark-primaryContainer dark:text-dark-onPrimaryContainer">
                <div className="p-1 flex flex-row gap-2 mb-0.5">

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
                <div className="align-middle flex justify-center flex-col">
                    <button
                        id="refresh-button"
                        onClick={this.kill.bind(this)}
                        className={
                            `text-center align-middle flex justify-center flex-col p-1 rounded-xl aspect-square w-10 cursor-pointer
                        bg-light-primary text-light-onPrimary
                        dark:bg-dark-primary dark:text-dark-onPrimary
                        ` + (this.state.refresh_button_enabled ? "hover:bg-light-secondary dark:hover:bg-dark-secondary" : "deactivated-small pointer-events-none")
                        }>
                        {/* <span className={"w-full h-full text-center align-middle flex justify-center flex-col " + this.state.refresh_button_add_classes}> */}
                            <span class="material-symbols-outlined">
                                refresh
                            </span>
                        {/* </span> */}
                    </button>
                </div>
            </div>
        )
    }
}

export { TaskDemo }
