import React from "react";
import Wait from "../elements/wait";

import { call } from "../../api/api.js";
import { useParams } from "react-router-dom";
import { convert_status, attack, snapshot } from "../utils.js";
import Styles from "./styles.js";
import MyMachine from "../elements/my-machine.js";

const MAGIC_SYMBOL = "%"

class Snapshots extends React.Component {
    // TODO: Make defence (and attack?) another component

    constructor(props) {
        super(props);
        this.state = {
            username: localStorage.getItem("username"),
            task_id: this.props.params.id,
            task: {
                title: "kek"
            },
            updating: false,

            new_snapshot_enabled: true,
            snapshot: {
                show_label: false,
                label_text: "",
            },

            attacks: {},
            attack_ids: [],
            snapshots: [],
            statuses: {},
            users: {},
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
        if (this.state.updating) {
            return
        }

        this.setState({
            "updating": true
        })

        let snapshotInfo = await this.request("task/snapshot/get-latest-snapshot-status")
        console.log(snapshotInfo)
        if (snapshotInfo !== null) {
            if (snapshotInfo["state"] === null) {
                this.setState({
                    snapshot: {
                        show_label: true,
                        label_text: "🎀 Выключаю машину",
                    },
                    new_snapshot_enabled: false,
                })
            }
            if (snapshotInfo["state"] === "creating") {
                this.setState({
                    snapshot: {
                        show_label: true,
                        label_text: "💾 Создаю образ",
                    },
                    new_snapshot_enabled: false,
                })
            }
            if (snapshotInfo["state"] === "checking") {
                this.setState({
                    snapshot: {
                        show_label: true,
                        label_text: "🤔 Образ проверяется",
                    },
                    new_snapshot_enabled: false,
                })
            }
            if (snapshotInfo["state"] === "active") {
                this.setState({
                    snapshot: {
                        show_label: false,
                        label_text: "🚀 Образ активен",
                    },
                    new_snapshot_enabled: true,
                })
            }
        } else {
            this.setState({
                snapshot: {
                    show_label: false,
                    label_text: "",
                }
            })
        }

        await this.update_table()
        this.setState({
            "updating": false
        })
    }


    async update_table() {
        let data = await this.request("task/snapshot/get-snapshot-states")

        let snaps = data["snapshots"]
        let snapshots = []
        let attacks = {}
        let statuses = {}
        let attack_ids = []
        snaps.forEach(data => {
            let snap = data[0]
            snap = new snapshot(snap["id"], snap["user_id"], snap["name"], snap["state"], new Date(snap["created_at"]), data[1])

            if (snap.state === "creating" || snap.state === null || snap.state === undefined) {
                return
            }

            snapshots.push(
                snap
            )

            data[2].forEach(data => {
                let att = data[0]
                let at = new attack(att["id"], att["user_id"], att["name"], att["state"], new Date(att["created_at"]), null)
                attacks[at.id] = at;

                statuses[snap["id"] + MAGIC_SYMBOL + at.id] = [data[1], data[2]]
                attack_ids.push(at.id)
            });
        });

        attack_ids = [...new Set(attack_ids)]
        attack_ids.sort().reverse()

        snapshots.sort((a, b) => b.id - a.id)

        this.setState({
            attacks: attacks,
            attack_ids: attack_ids,
            snapshots: snapshots,
            statuses: statuses,
            users: data["usernames"],
        })

        console.log("state", this.state)
    }


    async create_new_snapshot() {
        if (this.state.new_snapshot_enabled) {
            this.setState({
                new_snapshot_enabled: false
            })
            await this.request("task/snapshot/create", { "name": document.getElementById("snapshot-name").value })
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
                    <h1 className="text-5xl p-4 bg-gray-200 rounded flex justify-end flex-col" onClick={() => { window.location.href = "/tasks" }} >Снапшоты</h1>

                    <div className="flex-grow" />
                    <div className="flex flex-col">
                        <div className="flex-grow" />
                        <h1 className="text-2xl text-gray-600 align-bottom">@{this.state.username}</h1>
                    </div>
                </div>

                <div id="tabs" className="pt-4 pb-4">
                    <nav className="flex gap-4">
                        <a className="p-4 rounded-xl  bg-gray-300" href={"/scoreboard/" + (this.state.task_id)}>Рейтинг</a>
                        <a className="p-4 rounded-xl bg-gray-300" href={"/attacks/" + (this.state.task_id)}>Атаки</a>
                        <a className="p-4 rounded-xl bg-gray-800 text-white" href={"/snapshots/" + (this.state.task_id)}>Снапшоты</a>
                    </nav>
                </div>
                <div className="pb-4">
                    <h2 className="text-3xl mb-4 font-bold">Ваша машина</h2>
                    <MyMachine hide_checks={true} />
                </div>
                <div className="flex flex-col w-1/3 min-w-80">
                    <label class="block font-semibold mb-2" for="name">
                        Имя снапшота (будет видно всем)
                    </label>
                    <input id="snapshot-name" name="name" className="h-full border-2 p-2 rounded-md bg-gray-100 appearance-none" placeholder="имя имя" />
                    <button
                        className={"text-white font-bold appearance-none rounded-md p-3 mb-3 mt-3 " + (this.state.new_snapshot_enabled ? "bg-indigo-400 hover:scale-105 duration-200" : "bg-gray-300")}
                        onClick={this.create_new_snapshot.bind(this)}>
                        Отправить новую версию машины
                    </button>

                    {this.state.snapshot.show_label &&
                        <div className="text-2xl font-semibold pt-1">
                            <Wait text={this.state.snapshot.label_text} />
                        </div>
                    }

                    <div className="bg-red-200 rounded-md p-4 text-xl mt-4">
                        <p>! Рекомендуется запускать команду `sync` перед созданием новой версии машины, чтобы кеши дисков точно пролились. Я пока не разобрался как решить эту проблему со своей стороны.</p>
                        <p>В целом, рекомендуется перезапустить машину перед отправкой в систему и убедиться в её работоспособности</p>

                    </div>
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
                            {this.state.snapshots.map(snap => (
                                <tr>
                                    <td className="long text-2xl text-right"><span className="pr-5">#{snap.id}</span></td>
                                    <td className="long"><span className="pr-3 inline-block">{snap.created_at.toLocaleString('ru-RU')}</span></td>
                                    <td className="long whitespace-nowrap">
                                        <span className="pr-3">{snap.name}</span><br />
                                        {snap.state === "active" &&
                                            <div className=" inline-block p-3 border-2 border-green-400 text-xs rounded-md mt-1 mr-2 whitespace-nowrap">Активен</div>
                                        }
                                    </td>
                                    <td className="long2 whitespace-nowrap">
                                        <div className="h-full flex p-1">
                                            <div className=" pr-4 pl-4 border-2 rounded-md flex flex-col justify-center score">
                                                <div className="align-middle text-center">
                                                    {snap.state === "checking" &&
                                                        <span className=""><Wait text="Проверяется" /><br /></span>
                                                    }
                                                    <span className="">🛡 {snap.score[0]}/{snap.score[1]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {this.state.attack_ids.map(attack_id => {
                                        let st = this.state.statuses[snap.id + MAGIC_SYMBOL + attack_id]
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
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

export default (props) => (
    <Snapshots
        {...props}
        params={useParams()}
    />)
// export default withRouter Task;
