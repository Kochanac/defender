import React from "react";

import { call, get } from "../api/api.js";

class TaskList extends React.Component {
    componentDidMount() {
        this.load_tasks()
    }

    async load_tasks() {
        let data = await call("tasks", {}, localStorage.getItem("token"))

        console.log(data)

        this.setState({tasks: data})
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
                <div className="mb-9 flex">
                    <h1 className="text-5xl">Таски</h1>
                    <div className="flex-grow"/>
                    <div className="flex flex-col">
                        <div className="flex-grow"/>
                        <h1 className="text-2xl text-gray-600 align-bottom">@{this.state["username"]}</h1>
                    </div>
                </div>
                <div id="tasks" className="flex flex-col gap-4">
                    {this.state.tasks.map(task => (
                        <Task title={task.title} attack={task.is_exploited} defence={task.is_defended} id={task.id} key={task.id}/>
                    ))}
                </div>
            </div>
        );
    }
}

function Task(props) {
        return (
            <div onClick={() => {window.location.href = "/task/" + props.id}}
                className="bg-gray-100 gap-y-2 hover:scale-105 cursor-pointer transform ease-in-out duration-100 rounded-2xl p-4 pl-6 pr-6 flex flex-wrap text-2xl">
                <h3 className="flex-none font-semibold">
                    {props.title}
                </h3>
                
                {/* <div className="flex flex-col pl-3"> */}
                   {/* <div className="flex-grow"> </div> */}
                   {/* <div className="flex-grow-0 rounded-full h-3 w-3 bg-red-500"> </div> */}
                   {/* <div className="flex-grow"> </div> */}
                {/* </div> */}

                <div className="flex-grow"/>
                <div className="flex flex-col">
                    <div className="flex-grow"> </div>

                    <div className="flex text-xl" style={{"fontSize": "0.97rem", "lineHeight": "0.97rem"}}>
                        <div className={(props.attack ? "bg-green-200 border-green-200" : "bg-white") + " p-2 rounded border border-opacity-10 border-black p-1 mr-5"} >⚔️</div>
                        <div className={(props.defence ? "bg-green-200 border-green-200" : "bg-white") + " p-2 rounded border border-opacity-10 border-black p-1"} >🛡</div>
                    </div>

                    <div className="flex-grow"> </div>
                </div>
            </div>
        )
}


export default TaskList
