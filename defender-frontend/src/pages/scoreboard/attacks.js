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
                    <Breadcrumb href={"/task/" + this.state.task_id}>
                        <span>{this.state.title}</span>
                    </Breadcrumb>
                    <Breadcrumb href="#">
                        <span>Рейтинг</span>
                    </Breadcrumb>
                </Breadcrumbs>


                <Navbar>
                    <NavbarEntry href={"/scoreboard/" + (this.state.task_id)} active={false} icon={<span class="material-symbols-outlined">group</span>}>
                        Рейтинг
                    </NavbarEntry>
                    <NavbarEntry href={"/attacks/" + (this.state.task_id)} active={true} icon={<span class="material-symbols-outlined">swords</span>}>
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
                ">
                    <p className="block text-xl font-semibold mb-4">
                        Напишите эксплойт, который будет запущен против снапшотов дргуих участников
                    </p>
                    <p className="block text-xl font-semibold mb-4">
                        Первым аргументом (в sys.argv) он принимает адрес машины с сервисом, и должен вывести все найденные флаги в stdout. <a href={this.state.exploit_example} className="text-blue-900 font-bold">пример</a>
                    </p>
                    <p className="block text-xl font-semibold mb-2">
                        Python, Requests предустановлены:
                    </p>
                    <textarea id="exploit_code" className="
                            p-4 w-full code text-md my-4 rounded-xl duration-75
                            bg-light-surfaceVariant text-light-onSurfaceVariant
                            dark:bg-dark-surfaceVariant dark:text-dark-onSurfaceVariant
                        " rows="10">

                    </textarea>

                    <label class="block font-semibold mb-2" for="name">
                        Имя атаки (будет видно всем)
                    </label>
                    <input id="name" name="name" className="h-full p-2 rounded-md
                    bg-light-surfaceVariant text-light-onSurfaceVariant
                    dark:bg-dark-surfaceVariant dark:text-dark-onSurfaceVariant
                    appearance-none mb-2" placeholder="самая сильная атака" />

                    <button onClick={this.send_exploit.bind(this)} className={"text-white font-bold appearance-none rounded-md p-3 mb-2 " +
                        (this.state.exploit_testing ?
                            "bg-gray-300"
                            : "bg-light-primary dark:bg-dark-primary text-light-onPrimary dark:text-dark-onPrimary hover:scale-105 duration-200")}>
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
                                                <span className="p-1.5  rounded-lg ml-0.5
                                                                                                                bg-light-secondaryContainer text-light-onSecondaryContainer
                                                                                                                dark:bg-dark-secondaryContainer dark:text-dark-onSecondaryContainer
                                                ">@{this.state.users[this.state.snapshots[user_id].user_id] || "??"}</span>
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
                                        let act_res = this.state.active_results[attack.id + MAGIC_SYMBOL + user_id]

                                        return <Cell status={status} result={result} prev_res={act_res}/>
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
