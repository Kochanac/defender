import React from "react";

import { call, get } from "../api/api.js";
import Breadcrumbs, { Breadcrumb } from "./elements/breadcrumbs.js";

class TaskList extends React.Component {
    componentDidMount() {
        this.load_tasks()
    }

    async load_tasks() {
        let data = await call("tasks", {}, localStorage.getItem("token"))

        console.log(data)

        this.setState({ tasks: data })
    }

    constructor(props) {
        super(props);
        this.state = {
            username: localStorage.getItem("username"),
            tasks: []
        }
    }

    render() {
        return (
            <div>
                <Breadcrumbs username={this.state.username}>
                    <Breadcrumb href = "/tasks">
                        Таски
                        {/* <div className=" aspect-square w-14 text-center flex justify-center flex-col">  {"←"} </div> */}
                    </Breadcrumb>
                </Breadcrumbs>
                {/* <div className="mb-9 flex">
                    <h1 className="text-5xl">Таски</h1>
                    <div className="flex-grow" />
                    <div className="flex flex-col">
                        <div className="flex-grow" />
                        <h1 className="text-2xl text-light-onSurfaceVariant dark:text-dark-onSurfaceVariant align-bottom">@{this.state["username"]}</h1>
                    </div>
                </div> */}
                <div id="tasks" className="flex flex-col gap-4">
                    {this.state.tasks.map(task => (
                        <Task title={task.title} attack={task.is_exploited} defence={task.is_defended} id={task.id} key={task.id} />
                    ))}
                </div>
            </div>
        );
    }
}

function Task(props) {
    return (
        <div className="flex gap-6 w-full">
            <div onClick={() => { window.location.href = "/task/" + props.id }}
                className="flex-grow gap-y-2 hover:scale-105 cursor-pointer transform ease-in-out duration-100 rounded-2xl p-4 pl-6  flex flex-wrap
                text-lg md:text-2xl
                bg-light-primaryContainer text-light-onPrimaryContainer dark:bg-dark-primaryContainer dark:text-dark-onPrimaryContainer
                ">
                {/* bg-light-surfaceContainerHigh dark:bg-dark-surfaceContainerHigh */}
                <h3 className="flex-none font-semibold p-2">
                    {props.title}
                </h3>

                {/* <div className="flex flex-col pl-3">
                   <div className="flex-grow"> </div>
                   <div className="flex-grow-0 rounded-full h-3 w-3 bg-red-500"> </div>
                   <div className="flex-grow"> </div>
                </div> */}

                <div className="flex-grow" />
                <div className="flex flex-col">
                    <div className="flex-grow"> </div>

                    <div className="flex">
                        <div className={(props.attack ? "bg-green-300 border-green-200" : "bg-white") + " p-2 rounded-xl border border-opacity-10 border-black mr-5 text-black w-12 aspect-square text-center align-middle flex justify-center flex-col"} >
                            <span class="material-symbols-outlined">
                                swords
                            </span>
                        </div>
                        <div className={(props.defence ? "bg-green-300 border-green-200" : "bg-white") + " p-2 rounded-xl border border-opacity-10 border-black text-black w-12 aspect-square text-center align-middle flex justify-center flex-col"} >
                            <span class="material-symbols-outlined">
                                shield
                            </span>
                        </div>
                    </div>

                    <div className="flex-grow"> </div>
                </div>
            </div>
            {props.attack && props.defence &&
                <div className="gap-y-2 hover:scale-110 cursor-pointer transform ease-in-out duration-100 rounded-2xl p-4 pl-6 pr-6 flex flex-wrap 
                text-lg md:text-2xl
            bg-light-primaryContainer text-light-onPrimaryContainer dark:bg-dark-primaryContainer dark:text-dark-onPrimaryContainer
            " onClick={() => { window.location.href = "/scoreboard/" + props.id }}>
                    <h3 className="flex-none font-semibold p-2">
                        Рейтинг
                    </h3>
                </div>
            }
        </div>
    )
}


export default TaskList
