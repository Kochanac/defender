import React from "react";

import { call, get } from "../api/api.js";
import Breadcrumbs, { Breadcrumb } from "./elements/breadcrumbs.js";
// import { LineProgressBar } from '@frogress/line'

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
            tasks: [],
            competitions: [
                {
                    "id": 1,
                    "title": "Летняя школа 2024",
                    "img": "/hydrangea_blue_bush.jpg",
                    "time_start": "",
                    "time_end": ""
                }
            ]
        }
    }

    render() {
        return (
            <div>
                <Breadcrumbs username={this.state.username}>
                    <Breadcrumb href="/tasks">
                        Таски
                    </Breadcrumb>
                </Breadcrumbs>
                <div id="tasks" className="grid grid-cols-1 grid-flow-row gap-4">
                    {/* {this.state.competitions.map(comp => (
                        <Competition title={comp.title} id={comp.id} key={comp.id} image={comp.img} start={comp.time_start} end={comp.time_end} />
                    ))} */}
                    {this.state.tasks.map(task => (
                        <Task title={task.title} attack={task.is_exploited} defence={task.is_defended} id={task.id} key={task.id} defence_skip={task.defence_skip} />
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
                className="flex-grow gap-y-2 hover:scale-105 cursor-pointer transform ease-in-out duration-100 rounded-2xl shadow-md p-4 pl-6  flex flex-wrap
                text-lg md:text-2xl
                bg-light-primaryContainer text-light-onPrimaryContainer dark:bg-dark-primaryContainer dark:text-dark-onPrimaryContainer
                ">
                
                <h3 className="flex-none font-semibold p-2 text-center align-middle flex justify-center flex-col">
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
                        <div className={(props.attack ? "bg-green-300 border-green-200" : "bg-white") + " p-2 rounded-xl shadow-md border border-opacity-10 border-black text-black w-12 aspect-square text-center align-middle flex justify-center flex-col"} >
                            <span class="material-symbols-outlined">
                                swords
                            </span>
                        </div>

                        {!props.defence_skip &&
                        <div className="mr-5"></div>
                        }
                        {!props.defence_skip &&
                        <div className={(props.defence ? "bg-green-300 border-green-200" : "bg-white") + " p-2 rounded-xl shadow-md border border-opacity-10 border-black text-black w-12 aspect-square text-center align-middle flex justify-center flex-col"} >
                            <span class="material-symbols-outlined">
                                shield
                            </span>
                        </div>
                        }
                    </div>

                    <div className="flex-grow"> </div>
                </div>
            </div>
            {props.attack && props.defence &&
                <div className="gap-y-2 hover:scale-110 cursor-pointer transform ease-in-out duration-100 rounded-2xl shadow-md p-4 pl-6 pr-6 flex flex-wrap 
                text-lg md:text-2xl
            bg-light-primaryContainer text-light-onPrimaryContainer dark:bg-dark-primaryContainer dark:text-dark-onPrimaryContainer
            " onClick={() => { window.location.href = "/scoreboard/" + props.id }}>
                    <h3 className="flex-none font-semibold p-2 hidden md:block">
                        Рейтинг
                    </h3>
                    <h3 className="flex-none font-semibold p-2 md:hidden aspect-square text-center align-middle flex justify-center flex-col">
                        <span class="material-symbols-outlined">
                            group
                        </span>
                    </h3>
                </div>
            }
        </div>
    )
}


function Competition(props) {
    return (
        <div className="flex gap-6 w-full min-h-48">
            <div onClick={() => { window.location.href = "/competition/" + props.id }}
                className="flex-grow gap-y-2 cursor-pointer transform ease-in-out duration-100 rounded-2xl shadow-md p-4 pl-6  flex flex-wrap
                text-lg md:text-2xl
                bg-dark-tertiaryContainer text-dark-onTertiaryContainer
                "
                // dark:bg-dark-tertiaryContainer dark:text-dark-onTertiaryContainer
                // bg-light-tertiaryContainer text-light-onTertiaryContainer 
                style={{
                    background: "url(" + props.image + ")",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    backgroundPosition: "center center"
                }}
                >

                <div className="flex flex-col p-2">
                    {/* <h3 className="font-semibold p-2 rounded-md bg-light-tertiaryContainer text-light-onTertiaryContainer dark:bg-dark-tertiaryContainer dark:text-dark-onTertiaryContainer">
                        Соревнование
                    </h3>
                    <div className="flex-grow" />
                    <h3 className="font-normal p-2 rounded-md bg-light-tertiaryContainer text-light-onTertiaryContainer dark:bg-dark-tertiaryContainer dark:text-dark-onTertiaryContainer">
                        {props.title}
                    </h3> */}

                    <h3 className="font-semibold">
                        Соревнование
                    </h3>
                    <div className="flex-grow" />
                    <h3 className="font-normal">
                        {props.title}
                    </h3>
                </div>
                <div className="flex-grow" />
                <div className="flex flex-col">
                    <div className="flex-grow" />
                    <h3 className="font-normal p-2 rounded-md bg-dark-tertiaryContainer text-dark-onTertiaryContainer">
                        28 Июня 13:37 -&gt; 29 июня 19:30
                    </h3>
                </div>

                
                {/* <LineProgressBar
                percent={35}
                /> */}
            </div>
        </div>
    )
}

function TertiaryCell(props) {

}


export default TaskList
