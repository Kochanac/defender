import React from "react";
import Wait from "../elements/wait";

import { call } from "../../api/api.js";
import { useParams } from "react-router-dom";
import Styles from "./styles.js";
import { attack, convert_status, snapshot } from "../utils.js";

const MAGIC_SYMBOL = "%"


class Table extends React.Component {
    // TODO: Make defence (and attack?) another component

    constructor(props) {
        super(props);
        this.state = {
            username: localStorage.getItem("username"),
            updating: false,

            task_id: this.props.params.id,
            task: {
                title: "kek"
            },

            attacks: {},
            attack_ids: [],
            statuses: {},
            users: {},
            user_ids: [],
            scores: {},
            places: {},

            demo: {},
        }
    }

    componentDidMount() {
        this.prepare_task()
    }

    async request(url, data = {}) {
        data.task_id = this.state.task_id
        let resp = await call(url, data, localStorage.getItem("token"));

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

        this.update_task()
        setInterval(this.update_task.bind(this), 4000)
    }

    async update_task() {
        if (this.state.updating) {
            return
        }
        this.setState({
            "updating": true
        })

        await this.update_table()
        await this.update_demo()
        this.setState({
            "updating": false
        })
    }

    async update_demo() {
        let data = await this.request("task/rating-demo/status")

        if (data["error"] === 404) {
            this.setState({
                demo: {},
            })
            return
        }

        this.setState({
            demo: data
        })
    }



    async start_demo(event) {
        if (this.state.demo.target_id != null) {
            return
        }
        event.target.className += " bg-gray-300"
        await this.request("task/rating-demo/create", { "target_id": event.target.id })
    }

    async rm_demo(event) {
        event.target.className += " scale-0"
        await this.request("task/rating-demo/delete")
    }


    async update_table() {
        let data = await this.request("task/scoreboard")

        let attacks = {}
        let statuses = {}
        let attack_ids = []
        let scores = {}
        let user_ids = []
        data["users"].forEach(data => {
            let user_id = data[0]
            scores[user_id] = data[1] // attack_score, defence_score, result

            user_ids.push(
                user_id
            )

            data[2].forEach(data => {
                let att = data[0]
                let at = new attack(att["id"], att["user_id"], att["name"], att["state"], new Date(att["created_at"]), null)
                attacks[at.id] = at;

                statuses[user_id + MAGIC_SYMBOL + at.id] = [data[1], data[2]]
                attack_ids.push(at.id)
            });
        });

        attack_ids = [...new Set(attack_ids)]
        attack_ids.sort().reverse()

        let places = {}
        user_ids.sort((a, b) => scores[b][2] - scores[a][2])
        for (let i = 0; i < user_ids.length; i++) {
            let user_id = user_ids[i]
            places[user_id] = i + 1;
        }

        this.setState({
            attacks: attacks,
            attack_ids: attack_ids,
            statuses: statuses,
            users: data["usernames"],
            user_ids: user_ids,
            scores: scores,
            places: places,
        })

        console.log("state", this.state)
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
                                {this.state.attack_ids.map(attack_id => (
                                    <th className="rotate">
                                        <div>
                                            <span>Attack #{this.state.attacks[attack_id].id} ({this.state.attacks[attack_id].name})
                                                <span className="p-1.5 bg-gray-200 rounded-lg ml-0.5">@{this.state.users[this.state.attacks[attack_id].user_id] || "??"}</span>
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.user_ids.map(user_id => (
                                <tr>
                                    <td className="long text-2xl text-right align-top"><span className="pr-5">#{this.state.places[user_id]}</span></td>
                                    <td className="long text-xl">
                                        <span className="pr-5">@{this.state.users[user_id] || "??"}</span><br />


                                        {this.state.demo.target_id !== user_id &&
                                            <span
                                                id={user_id}
                                                onClick={this.start_demo.bind(this)}
                                                className={"p-3 border-2 text-xs rounded-md mt-3 inline-block " + (this.state.demo.target_id != null ? "deactivated" : "")} >
                                                Запустить его машину
                                            </span>
                                        }


                                        {this.state.demo.target_id === user_id &&
                                            <div className="border-2 rounded-md mt-3 mr-2 align-middle flex justify-center ">
                                                <div className="flex flex-col justify-center align-middle">
                                                    <a
                                                        href={this.state.demo.url}
                                                        className="p-2 pl-3 border-black text-xs whitespace-nowrap font-mono flex mt-0.5">

                                                        <div class={"-mt-0.5 w-2 h-2 rounded-full self-center aspect-square inline-block mr-1 " + (this.state.demo.state === "on" ? "bg-green-500" : "bg-red-500")}></div>

                                                        {this.state.demo.state === "starting" && <Wait text="Запускается" />}

                                                        {this.state.demo.url} {this.state.demo.time_left}c

                                                    </a>
                                                </div>
                                                <button onClick={this.rm_demo.bind(this)} className="bg-red-600 ml-1 rounded-md w-8 h-8 text-white m-2">🗑</button>
                                            </div>
                                        }
                                    </td>
                                    <td className="long whitespace-nowrap">
                                        <div className="ml-2 mr-2 pr-4 pl-4 border-2 rounded-md flex flex-col justify-center p-2">
                                            <div className="align-middle text-center">
                                                <span className="">⚔️ {this.state.scores[user_id][0][0]}/{this.state.scores[user_id][0][1]}</span><br />
                                                <span className="">🛡 {this.state.scores[user_id][1][0]}/{this.state.scores[user_id][1][1]}</span><br />
                                                <span className="">{'= ' + this.state.scores[user_id][2].toFixed(3)}</span>
                                            </div>
                                        </div>
                                    </td>

                                    {this.state.attack_ids.map(attack_id => {
                                        if (this.state.attacks[attack_id].user_id === user_id) {
                                            return <td>
                                                <div className="aspect-square bg-white border-2 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                                    Своя машина
                                                </div>
                                            </td>
                                        }

                                        let st = this.state.statuses[user_id + MAGIC_SYMBOL + attack_id]
                                        if (st === null || st === undefined) {
                                            return <td></td>
                                        }

                                        let status = st[0]
                                        let result = st[1]

                                        if (result === "OK") {
                                            return <td>
                                                <div className="aspect-square bg-green-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                                    Взлом
                                                </div>
                                            </td>
                                        }
                                        if (result === "NO FLAGS") {
                                            return <td>
                                                <div className="aspect-square bg-red-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                                                    Не взлом
                                                </div>
                                            </td>
                                        }

                                        return (<td>
                                            <div className="aspect-square stripes bg-white rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm">
                                                <Wait text={convert_status(status)} />
                                            </div>
                                        </td>)
                                    })}

                                </tr>

                            ))}

                            {/* 
                            <tr>
                                <td className="long text-2xl text-right align-top"><span className="pr-5">#1</span></td>
                                <td className="long text-xl">
                                    <span className="pr-5">@kochan</span><br />
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
                                    <span className="pr-5">@mochalkinblues</span><br />
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
                            </tr> */}
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
