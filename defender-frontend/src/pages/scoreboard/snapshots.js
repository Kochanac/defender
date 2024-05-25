import React from "react";
import Wait from "../elements/wait";

import { call } from "../../api/api.js";
import { useParams } from "react-router-dom";
import { convert_status, attack, snapshot } from "../utils.js";
import Styles from "./styles.js";
import MyMachine from "../elements/my-machine.js";
import Breadcrumbs, { Breadcrumb } from "../elements/breadcrumbs.js";
import { Navbar, NavbarEntry } from "../elements/navbar.js";
import { Cell } from "../elements/cell.js";

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
                    <NavbarEntry href={"/attacks/" + (this.state.task_id)} active={false} icon={<span class="material-symbols-outlined">swords</span>}>
                        Атаки
                    </NavbarEntry>
                    <NavbarEntry href={"/snapshots/" + (this.state.task_id)} active={true} icon={<span class="material-symbols-outlined">shield</span>}>
                        Снапшоты
                    </NavbarEntry>
                </Navbar>


                <div className="
                p-4 rounded-xl shadow-md z-20
                bg-light-surface text-light-onSurface
                dark:bg-dark-surface dark:text-dark-onSurface
                w-full 2xl:w-3/5 xl:w-3/4 lg:w-3/4 md:w-5/6 sm:w-full
                ">
                    <div className="pb-4 z-10">
                        <h2 className="text-3xl mb-4 font-bold">Ваша машина</h2>
                        <MyMachine 
                        // hide_checks={true} 
                        />
                    </div>
                    <div className="flex flex-col">
                        <label class="block font-semibold mb-2" for="name">
                            Имя снапшота (будет видно всем)
                        </label>
                        <input id="snapshot-name" name="name" className="h-full p-2 rounded-md 
                        bg-light-surfaceVariant text-light-onSurfaceVariant
                        dark:bg-dark-surfaceVariant dark:text-dark-onSurfaceVariant
                        appearance-none" placeholder="имя имя" />
                        <button
                            className={"text-white font-bold appearance-none rounded-md p-3 py-6 mb-3 mt-3 " + 
                            (this.state.new_snapshot_enabled ? 
                                "bg-light-primary dark:bg-dark-primary text-light-onPrimary dark:text-dark-onPrimary hover:scale-105 duration-200" 
                                : "bg-gray-300")}
                            onClick={this.create_new_snapshot.bind(this)}>
                            Отправить новую версию машины
                        </button>

                        {this.state.snapshot.show_label &&
                            <div className="text-2xl font-semibold pt-1">
                                <Wait text={this.state.snapshot.label_text} />
                            </div>
                        }

                        <div className="bg-light-errorContainer text-light-onErrorContainer dark:bg-dark-errorContainer dark:text-dark-onErrorContainer rounded-md p-4 text-xl mt-4 z-20">
                            <p>! Рекомендуется запускать команду `sync` перед созданием новой версии машины, чтобы кеши дисков точно пролились. Я пока не разобрался как решить эту проблему со своей стороны.</p>
                            <p>В целом, рекомендуется перезапустить машину перед отправкой в систему и убедиться в её работоспособности</p>

                        </div>
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
                                                <span className="p-1.5  rounded-lg ml-0.5
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
                            {this.state.snapshots.map(snap => (
                                <tr>
                                    <td className="long text-2xl text-right"><span className="pr-5">#{snap.id}</span></td>
                                    <td className="long">
                                        <div className="p-1 h-full">
                                            <div className="h-full p-2 rounded-xl
                                        bg-light-surface text-light-onSurface
                                        dark:bg-dark-surface dark:text-dark-onSurface
                                        flex flex-col text-right justify-center
                                        ">
                                                <span className="inline-block">{snap.created_at.toLocaleString('ru-RU')}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="long whitespace-nowrap">
                                        <div className="p-1 h-full min-w-80">
                                            <div className="h-full px-4 py-2 rounded-xl
                                        bg-light-surface text-light-onSurface
                                        dark:bg-dark-surface dark:text-dark-onSurface
                                        flex flex-col text-right justify-center
                                        gap-2
                                        ">
                                                <span className="">{snap.name}</span>

                                                {snap.state === "active" &&
                                                    <div className="text-center inline-block p-1.5 my-2  
                                                        bg-light-secondaryContainer text-light-onSecondaryContainer
                                                        dark:bg-dark-secondaryContainer dark:text-dark-onSecondaryContainer
                                                    text-xs rounded-md whitespace-nowrap">Активен</div>
                                                }
                                            </div>
                                        </div>


                                    </td>
                                    <td className="long2 whitespace-nowrap">
                                        <div className="h-full flex p-1">
                                            <div className=" pr-4 pl-4 
                                            shadow-md
                                            bg-light-surfaceVariant text-light-onSurfaceVariant
                                            dark:bg-dark-surfaceVariant dark:text-dark-onSurfaceVariant
                                            rounded-md flex flex-col justify-center score">
                                                <div className="align-middle text-center">
                                                    {snap.state === "checking" &&
                                                        <span className=""><Wait text="Проверяется" /><br /></span>
                                                    }
                                                    <span className="">
                                                        <div className="flex flex-row gap-1 justify-center">
                                                            <div className="text-center align-middle flex justify-center flex-col">
                                                                <span class="material-symbols-outlined">shield</span>
                                                            </div>
                                                            <span>
                                                                {snap.score[0]}/{snap.score[1]}
                                                            </span>
                                                        </div>
                                                    </span>
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

                                        return <Cell status={status} result={result} />
                                    })}

                                </tr>

                            ))}
                        </tbody>
                    </table>
                </div>
            </div >
        );
    }
}

export default (props) => (
    <Snapshots
        {...props}
        params={useParams()}
    />)
// export default withRouter Task;
