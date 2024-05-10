import React from "react";
import Wait from "../elements/wait";

import { call } from "../../api/api.js";
import { useParams } from "react-router-dom";
import Styles from "./styles.js";

class Table extends React.Component {
    // TODO: Make defence (and attack?) another component

    constructor(props) {
        super(props);
        this.state = {
            username: localStorage.getItem("username"),
            task_id: this.props.params.id,
            task: {
                title: "kek"
            }
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


    async send_exploit() {
        if (!this.state.exploit_testing) {
            this.setState({
                exploit_testing: true
            })

        }
    }

    render() {
        return (
            <div>
                <Styles />
                <div className="mb-9 flex gap-4">
                    <div className="text-5xl p-4 bg-gray-200 rounded duration-200 hover:scale-110" onClick={() => { window.location.href = "/tasks" }}>
                        {/* <div className=" aspect-square w-14 text-center flex justify-center flex-col">  {"←"} </div> */}
                        Таски
                    </div>
                    <div className="text-5xl pt-4 pb-4">/</div>
                    <h1 className="text-5xl p-4 bg-gray-200 rounded flex justify-end flex-col" onClick={() => { window.location.href = "/tasks" }} >{this.state.title}</h1>
                    
                    <div className="text-5xl pt-4 pb-4">/</div>
                    <h1 className="text-5xl p-4 bg-gray-200 rounded flex justify-end flex-col" onClick={() => { window.location.href = "/tasks" }} >Рейтинг</h1>

                    <div className="flex-grow" />
                    <div className="flex flex-col">
                        <div className="flex-grow" />
                        <h1 className="text-2xl text-gray-600 align-bottom">@{this.state.username}</h1>
                    </div>
                </div>
                <div id="tabs" className="pt-4">
                    <nav className="flex gap-4">
                        <a className="p-4 rounded-xl  bg-gray-800 text-white" href={"/scoreboard/" + (this.state.task_id)}>Рейтинг</a>
                        <a className="p-4 rounded-xl bg-gray-300" href={"/attacks/" + (this.state.task_id)}>Атаки</a>
                        <a className="p-4 rounded-xl bg-gray-300" href={"/snapshots/" + (this.state.task_id)}>Снапшоты</a>
                    </nav>
                </div>
                <div className="">
                    <table className="table-auto overflow-auto">
                        <thead>
                            <tr>
                                <th className="text-left align-bottom text-xl" style={{ transform: "rotate(0)" }}> <div className="pb-4">№</div> </th>
                                <th className="text-left align-bottom text-xl" style={{ transform: "rotate(0)" }}> <div className="pb-4">Игрок</div> </th>
                                <th className="text-left align-bottom text-xl" style={{ transform: "rotate(0)" }}> <div className="pb-4">Счет</div> </th>
                                <th className="rotate"><div><span>Attack #100 <span className="p-1.5 bg-gray-200 rounded-lg">@kochan</span></span></div></th>
                                <th className="rotate"><div><span>Attack #2</span></div></th>
                                <th className="rotate"><div><span>Attack #1</span></div></th>
                                <th className="rotate"><div><span>Attack #2</span></div></th>
                                <th className="rotate"><div><span>Attack #1</span></div></th>
                                <th className="rotate"><div><span>Attack #2</span></div></th>
                                <th className="rotate"><div><span>Attack #1</span></div></th>
                                <th className="rotate"><div><span>Attack #2</span></div></th>
                                <th className="rotate"><div><span>Attack #1</span></div></th>
                                <th className="rotate"><div><span>Attack #2</span></div></th>
                                <th className="rotate"><div><span>Attack #1</span></div></th>
                                <th className="rotate"><div><span>Attack #2</span></div></th>
                                <th className="rotate"><div><span>Attack #1</span></div></th>
                                <th className="rotate"><div><span>Attack #2</span></div></th>
                                <th className="rotate"><div><span>Attack #1</span></div></th>
                                <th className="rotate"><div><span>Attack #2</span></div></th>
                                <th className="rotate"><div><span>Attack #1</span></div></th>
                                <th className="rotate"><div><span>Attack #2</span></div></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="long text-2xl text-right align-top"><span className="pr-5">#1</span></td>
                                <td className="long text-xl">
                                    <span className="pr-5">@kochan</span><br/>
                                    <button className="p-3 border-2 border-green-400 text-xs rounded-md mt-3 inline mr-2 whitespace-nowrap">
                                        <div class="mt-0.5 w-2 h-2 bg-green-500 rounded-full self-center aspect-square inline-block mr-1"></div>
                                        http://10.111.3.3:7000/ 495c
                                    </button>
                                </td>
                                <td className="long whitespace-nowrap">
                                    <div className=" pr-4 pl-4 border-2 rounded-md flex flex-col justify-center p-2">
                                        <div className="align-middle text-center">
                                            <span className="">⚔️ 100/200</span><br />
                                            <span className="">🛡 50/300</span><br />
                                            <span className="">{'= 500'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square bg-white border-2 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                        Своя машина
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square bg-red-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                        Не взлом
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square stripes bg-white rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm">
                                        <Wait text="Запускаю машину" />
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square bg-green-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                        Взлом
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square bg-red-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                        Не взлом
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square stripes bg-white rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm">
                                        <Wait text="Запускаю машину" />
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square bg-yellow-300 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                        DoS
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square bg-red-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                        Не взлом
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square stripes bg-white rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm">
                                        <Wait text="Запускаю машину" />
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square bg-green-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                        Взлом
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square bg-red-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                        Не взлом
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square stripes bg-white rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm">
                                        <Wait text="Запускаю машину" />
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square bg-green-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                        Взлом
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square bg-red-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                        Не взлом
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square stripes bg-white rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm">
                                        <Wait text="Запускаю машину" />
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square bg-green-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                        Взлом
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square bg-red-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                        Не взлом
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square stripes bg-white rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm">
                                        <Wait text="Запускаю машину" />
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="long text-2xl text-right align-top"><span className="pr-5">#2</span></td>
                                <td className="long text-xl">
                                    <span className="pr-5">@mochalkinblues</span><br/>
                                    <button className="p-3 border-2 text-xs rounded-md mt-3 inline">Запустить его машину</button>    
                                </td>
                                <td className="long whitespace-nowrap">
                                    <div className=" pr-4 pl-4 border-2 rounded-md flex flex-col justify-center p-2">
                                        <div className="align-middle text-center">
                                            <span className="">⚔️ 100/200</span><br />
                                            <span className="">🛡 50/300</span><br />
                                            <span className="">{'= 500'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="aspect-square bg-green-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                        Взлом
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="long text-2xl text-right align-top"><span className="pr-5">#3</span></td>
                                <td className="long text-xl">
                                    <span className="pr-5">@debil online</span>
                                    <button className="p-3 border-2 text-xs rounded-md mt-3 inline">Запустить его машину</button>    
                                </td>
                                <td className="long whitespace-nowrap">
                                    <div className=" pr-4 pl-4 border-2 rounded-md flex flex-col justify-center p-2">
                                        <div className="align-middle text-center">
                                            <span className="">⚔️ 100/200</span><br />
                                            <span className="">🛡 50/300</span><br />
                                            <span className="">{'= 500'}</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

export default (props) => (
    <Table
        {...props}
        params={useParams()}
    />)
// export default withRouter Task;
