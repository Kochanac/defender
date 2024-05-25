import React from "react";
import Wait from "../elements/wait";

import { call } from "../../api/api.js";
import { useParams } from "react-router-dom";
import Styles from "./styles.js";
import { attack, convert_status, snapshot } from "../utils.js";
import Breadcrumbs, { Breadcrumb } from "../elements/breadcrumbs.js";
import { Navbar, NavbarEntry } from "../elements/navbar.js";
import { Cell } from "../elements/cell.js";

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
        event.target.className += " border-2 border-black dark:border-white"
        await this.request("task/rating-demo/create", { "target_id": event.target.id })
    }

    async rm_demo(event) {
        event.target.className += " bg-white dark:bg-black"
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
                <Breadcrumbs username={this.state.username}>
                    <Breadcrumb href="/tasks">
                        Таски
                        {/* <div className=" aspect-square w-14 text-center flex justify-center flex-col">  {"←"} </div> */}
                    </Breadcrumb>
                    <Breadcrumb href={"/task/" + this.state.task_id}>
                        <span>{this.state.title}</span>
                    </Breadcrumb>
                    <Breadcrumb href="#">
                        <span>Рейтинг</span>
                    </Breadcrumb>
                </Breadcrumbs>

                <Navbar>
                    <NavbarEntry href={"/scoreboard/" + (this.state.task_id)} active={true} icon={<span class="material-symbols-outlined">group</span>}>
                        Рейтинг
                    </NavbarEntry>
                    <NavbarEntry href={"/attacks/" + (this.state.task_id)} active={false} icon={<span class="material-symbols-outlined">swords</span>}>
                        Атаки
                    </NavbarEntry>
                    <NavbarEntry href={"/snapshots/" + (this.state.task_id)} active={false} icon={<span class="material-symbols-outlined">shield</span>}>
                        Снапшоты
                    </NavbarEntry>
                </Navbar>


                <div className="
                p-4 rounded-xl shadow-md z-20
                bg-light-surface text-light-onSurface
                dark:bg-dark-surface dark:text-dark-onSurface
                w-full 2xl:w-3/5 xl:w-3/4 lg:w-3/4 md:w-5/6 sm:w-full

                flex flex-col

                mb-20
                ">
                    <h2 className="text-3xl mb-4 font-bold">Рейтинговая таблица</h2>

                    <p className="text-xl pb-1">Чтобы подняться на верх рейтинговой таблицы:</p>
                    <ul className="list-disc pl-6">
                        <li className="text-xl pb-1">Добавляйте снапшоты своей машины, чтобы защититься от атак других участников</li>
                        <li className="text-xl pb-1">Взламывайте защиты других участников и создавайте атаки на новые уязвимости</li>
                    </ul>

                </div>

                <div className="w-full">
                    <table className="table-auto">
                        <thead>
                            <tr>
                                <th className="text-left align-bottom text-xl" style={{ transform: "rotate(0)" }}> <div className="pb-4">№</div> </th>
                                <th className="text-left align-bottom text-xl" style={{ transform: "rotate(0)" }}> <div className="pb-4">Игрок</div> </th>
                                <th className="text-left align-bottom text-xl" style={{ transform: "rotate(0)" }}> <div className="pb-4">Счет</div> </th>
                                {this.state.attack_ids.map(attack_id => (
                                    <th className="rotate z-0">
                                        <div>
                                            <span>Attack #{this.state.attacks[attack_id].id} ({this.state.attacks[attack_id].name})
                                                <span className="p-1.5  rounded-lg ml-0.5 -z-10
                                                                                    bg-light-secondaryContainer text-light-onSecondaryContainer
                                                                                    dark:bg-dark-secondaryContainer dark:text-dark-onSecondaryContainer
                                                                                    
                                                                                    ">@{this.state.users[this.state.attacks[attack_id].user_id] || "??"}</span>
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.user_ids.map(user_id => (
                                <tr>
                                    <td className="long text-2xl text-right align-top py-4"><span className="pr-5">#{this.state.places[user_id]}</span></td>
                                    <td className="long text-xl">
                                        <div className="px-4 py-2 min-w-60">
                                            <div className="p-2 rounded-xl
                                        bg-light-surface text-light-onSurface
                                        dark:bg-dark-surface dark:text-dark-onSurface
                                        flex flex-col text-right justify-center
                                        ">

                                                <span className="pr-5">@{this.state.users[user_id] || "??"}</span><br />


                                                <div className={"text-xs rounded-md mt-2 inline-block text-center bg-light-secondaryContainer text-light-onSecondaryContainer  dark:bg-dark-secondaryContainer dark:text-dark-onSecondaryContainer "
                                                    + (this.state.demo.target_id != null && this.state.demo.target_id !== user_id ? "deactivated" : "hover:bg-light-secondaryFixedDim dark:hover:bg-dark-surfaceVariant")}>
                                                    {this.state.demo.target_id !== user_id &&
                                                        <div
                                                            id={user_id}
                                                            onClick={this.start_demo.bind(this)}
                                                            className="p-2 w-full h-full"
                                                        >
                                                            Запустить его машину
                                                        </div>
                                                    }
                                                    {this.state.demo.target_id === user_id &&
                                                        <div className="h-full w-full rounded-md align-middle flex justify-center ">
                                                            <div className="flex flex-col justify-center align-middle">
                                                                <a
                                                                    href={this.state.demo.url}
                                                                    className="p-2 pl-3 border-black text-xs whitespace-nowrap font-mono flex mt-0.5">

                                                                    <div class={"-mt-0.5 w-2 h-2 rounded-full self-center aspect-square inline-block mr-1 " + (this.state.demo.state === "on" ? "bg-green-500" : "bg-red-500")}></div>

                                                                    {this.state.demo.state === "starting" && <Wait text="Запускается" />}

                                                                    {this.state.demo.url} {this.state.demo.time_left}c

                                                                </a>
                                                            </div>
                                                            <button onClick={this.rm_demo.bind(this)} className="bg-red-600 ml-1 rounded-md w-8 h-8 text-white m-2 text-center align-middle flex justify-center flex-col">
                                                                <span class="material-symbols-outlined scale-75">
                                                                    delete
                                                                </span>
                                                            </button>
                                                        </div>
                                                    }
                                                </div>



                                            </div>
                                        </div>
                                    </td>
                                    <td className="long whitespace-nowrap">
                                        {/* <div className="ml-2 mr-2 pr-4 pl-4 border-2 rounded-md flex flex-col justify-center p-2">
                                            <div className="align-middle text-center">
                                                <span className="">⚔️ {this.state.scores[user_id][0][0]}/{this.state.scores[user_id][0][1]}</span><br />
                                                <span className="">🛡 {this.state.scores[user_id][1][0]}/{this.state.scores[user_id][1][1]}</span><br />
                                                <span className="">{'= ' + this.state.scores[user_id][2].toFixed(3)}</span>
                                            </div>
                                        </div> */}


                                        <div className="h-full flex px-2 py-2">
                                            <div className="px-4 py-2
                                            shadow-md
                                            bg-light-surfaceVariant text-light-onSurfaceVariant
                                            dark:bg-dark-surfaceVariant dark:text-dark-onSurfaceVariant
                                            rounded-md flex flex-col justify-center score">
                                                <div className="align-middle text-center h-full flex flex-col justify-center">
                                                    <span className="">
                                                        <div className="flex flex-row gap-1 justify-center">
                                                            <div className="text-center align-middle flex justify-center flex-col">
                                                                <span class="material-symbols-outlined">swords</span>
                                                            </div>
                                                            <span>
                                                                {this.state.scores[user_id][0][0]}/{this.state.scores[user_id][0][1]}
                                                            </span>
                                                        </div>
                                                    </span>

                                                    <span className="">
                                                        <div className="flex flex-row gap-1 justify-center">
                                                            <div className="text-center align-middle flex justify-center flex-col">
                                                                <span class="material-symbols-outlined">shield</span>
                                                            </div>
                                                            <span>
                                                                {this.state.scores[user_id][1][0]}/{this.state.scores[user_id][1][1]}
                                                            </span>
                                                        </div>
                                                    </span>

                                                    <span className="">{'= ' + this.state.scores[user_id][2].toFixed(3)}</span>
                                                </div>
                                            </div>
                                        </div>

                                    </td>

                                    {this.state.attack_ids.map(attack_id => {
                                        if (this.state.attacks[attack_id].user_id === user_id) {
                                            return <td>
                                                <div className="aspect-square 
                                                bg-light-surface text-light-onSurface
                                                dark:bg-dark-surfaceVariant dark:text-dark-onSurfaceVariant
                                                rounded-2xl text-center align-middle flex justify-center flex-col m-1">
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

                                        return <Cell status={status} result={result} />
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
