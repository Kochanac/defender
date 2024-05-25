import React from "react";
import Wait from "../elements/wait";

import { call } from "../../api/api.js";
import { useParams } from "react-router-dom";
import Styles from "./styles.js";
import { attack, convert_status, snapshot } from "../utils.js";
import Breadcrumbs, { Breadcrumb } from "../elements/breadcrumbs.js";

const MAGIC_SYMBOL = "%"


class Attacks extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: localStorage.getItem("username"),
            task_id: this.props.params.id,
            task: {
                title: "kek"
            },

            attacks: [],
            snap_ids: [],
            snapshots: {},
            latest_statuses: {},
            active_results: {},
            users: {},
            updating: false,
        }
    }

    componentDidMount() {
        this.prepare_task()
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
        if (this.state.updating) {
            return
        }
        this.setState({
            "updating": true
        })

        await this.update_table()
        this.setState({
            "updating": false
        })
    }

    async update_table() {

        let data = await this.request("task/attack/get-attack-states")

        // let snaps = 
        let snapshots = {}
        let attacks = []
        let latest_statuses = {}
        let active_results = {}
        let snap_ids = []
        data["attacks"].forEach(data => {
            let att = data[0]
            att = new attack(att["id"], att["user_id"], att["name"], att["state"], new Date(att["created_at"]), data[1])

            if (att.state === null || att.state === undefined) {
                return
            }

            attacks.push(
                att
            )

            data[2].forEach(data => {
                let snap = data[0]
                snap = new snapshot(snap["id"], snap["user_id"], snap["name"], snap["state"], new Date(snap["created_at"]))
                snapshots[snap.user_id] = snap;

                latest_statuses[att.id + MAGIC_SYMBOL + snap.user_id] = [data[1], data[2]]
                if (snap.state === "active") {
                    active_results[att.id + MAGIC_SYMBOL + snap.user_id] = data[2]
                }

                snap_ids.push(snap.user_id)
            });
        });

        snap_ids = [...new Set(snap_ids)]
        snap_ids.sort().reverse()

        attacks.sort((a, b) => b.id - a.id)

        this.setState({
            attacks: attacks,
            snap_ids: snap_ids,
            snapshots: snapshots,
            latest_statuses: latest_statuses,
            active_results: active_results,
            users: data["usernames"],
            exploit_testing: false
        })

        console.log("state", this.state)
    }


    async send_exploit() {
        if (!this.state.exploit_testing) {
            this.setState({
                exploit_testing: true
            })

            let exp_code = document.getElementById("exploit_code").value

            let name = document.getElementById("name").value

            await this.request("task/attack/create", { "name": name, "exploit_text": exp_code })
        }
    }

    async deactivate_exploit(event) {
        event.target.className += " hidden"
        console.log(event)
        console.log(event.target.id)
        await this.request("task/attack/deactivate", { "attack_id": event.target.id })
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
                    <Breadcrumb href={"/task/"+this.state.task_id}>
                        <span>{this.state.title}</span>
                    </Breadcrumb>
                    <Breadcrumb href="#">
                        <span>Атаки</span>
                    </Breadcrumb>
                </Breadcrumbs>




                <div id="tabs" className="pt-4">
                    <nav className="flex gap-4">
                        <a className="p-4 rounded-xl  bg-light-secondaryContainer dark:bg-dark-secondaryContainer" href={"/scoreboard/" + (this.state.task_id)}>Рейтинг</a>
                        <a className="p-4 rounded-xl 
                        bg-light-primary text-light-onPrimary dark:bg-dark-primary dark:text-dark-onPrimary
                        " href={"/attacks/" + (this.state.task_id)}>Атаки</a>
                        <a className="p-4 rounded-xl bg-light-secondaryContainer dark:bg-dark-secondaryContainer" href={"/snapshots/" + (this.state.task_id)}>Снапшоты</a>
                    </nav>
                </div>

                <div className="flex flex-col w-1/3 min-w-80 pt-4">
                    <p className="block text-xl font-semibold mb-4">
                        Напишите эксплойт, который будет запущен против снапшотов дргуих участников
                    </p>
                    <p className="block text-xl font-semibold mb-4">
                        Первым аргументом (в sys.argv) он принимает адрес машины с сервисом, и должен вывести все найденные флаги в stdout. <a href={this.state.exploit_example} className="text-blue-900 font-bold">пример</a>
                    </p>
                    <p className="block text-xl font-semibold mb-2">
                        Python, Requests предустановлены:
                    </p>
                    <textarea id="exploit_code" className="p-3 w-full font-mono text-lg bg-gray-100 mb-2" rows="10" />

                    <label class="block font-semibold mb-2" for="name">
                        Имя атаки (будет видно всем)
                    </label>
                    <input id="name" name="name" className="h-full border-2 p-2 rounded-md bg-gray-100 appearance-none mb-2" placeholder="самая сильная атака" />

                    <button onClick={this.send_exploit.bind(this)} className={"text-white font-bold appearance-none rounded-md p-3 mb-2 " + (this.state.exploit_testing ? "bg-gray-300" : "bg-pink-600")}>
                        Отправить
                    </button>
                </div>

                <div className="pt-6">
                    <table className="table-auto overflow-auto">
                        <thead>
                            <tr>
                                <th className="text-left align-bottom text-xl" style={{ transform: "rotate(0)" }}> <div className="pb-4">№</div> </th>

                                <th className="text-left align-bottom text-xl" style={{ transform: "rotate(0)" }}> <div className="pb-4">Время</div> </th>
                                {/* Можно рандомно генерить */}
                                <th className="text-left align-bottom text-xl" style={{ transform: "rotate(0)" }}> <div className="pb-4">Имя</div> </th>

                                <th className="text-left align-bottom text-xl" style={{ transform: "rotate(0)" }}> <div className="pb-4">Результат</div> </th>

                                {this.state.snap_ids.map(user_id => (
                                    <th className="rotate">
                                        <div>
                                            <span>#{this.state.snapshots[user_id].id} ({this.state.snapshots[user_id].name})
                                                <span className="p-1.5 bg-gray-200 rounded-lg ml-0.5">@{this.state.users[this.state.snapshots[user_id].user_id] || "??"}</span>
                                            </span>
                                        </div>
                                    </th>
                                ))}

                            </tr>
                        </thead>
                        <tbody>
                            {this.state.attacks.map((attack) => (
                                <tr className={attack.state === "dead" ? "deactivated" : ""}>
                                    <td className="long text-2xl text-right"><span className="pr-5">#{attack.id}</span></td>
                                    <td className="long"><span className="pr-3">{attack.created_at.toLocaleString('ru-RU')}</span></td>
                                    <td className="long whitespace-nowrap">
                                        <span className="pr-3">{attack.name}</span><br />
                                        {attack.state === "dead" &&
                                            <button className="p-3 bg-black text-white text-xs rounded-md mt-3 inline mr-2 whitespace-nowrap">
                                                Деактивирован
                                            </button>
                                        }
                                        {attack.state !== "dead" &&
                                            <button
                                                id={attack.id}
                                                onClick={this.deactivate_exploit.bind(this)}
                                                className="p-3 border-2 border-black text-xs rounded-md mt-3 inline mr-2 whitespace-nowrap hover:scale-105 duration-200">
                                                Деактивировать
                                            </button>
                                        }
                                    </td>
                                    <td className="long2 whitespace-nowrap">
                                        <div className="h-full flex p-1">
                                            <div className=" pr-4 pl-4 border-2 rounded-md flex flex-col justify-center score">
                                                <div className="align-middle text-center">
                                                    {/* <span className=""><Wait text="Проверяется" /></span><br /> */}
                                                    <span className="">⚔️ {attack.score[0]}/{attack.score[1]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {this.state.snap_ids.map((user_id) => {
                                        let st = this.state.latest_statuses[attack.id + MAGIC_SYMBOL + user_id]
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
                                        
                                        let bg = "bg-white"
                                        let act_res = this.state.active_results[attack.id + MAGIC_SYMBOL + user_id]
                                        
                                        if (act_res === "OK") {
                                            bg = "bg-green-400"
                                        }
                                        if (act_res === "NO FLAGS") {
                                            bg = "bg-red-400"
                                        }

                                        return (<td>
                                            <div className={"aspect-square stripes rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm " + bg}>
                                                <Wait text={convert_status(status)} />
                                            </div>
                                        </td>)

                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

export default (props) => (
    <Attacks
        {...props}
        params={useParams()}
    />)
// export default withRouter Task;
