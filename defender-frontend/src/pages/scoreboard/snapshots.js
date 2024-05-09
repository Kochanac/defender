import React from "react";
import Wait from "../elements/wait";

import { call } from "../../api/api.js";
import { useParams } from "react-router-dom";
import Styles from "./styles.js";
import Machine from "./components/machine.js";

class Snapshots extends React.Component {
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
                <h1 className="text-5xl pb-6">Снапшоты</h1>
                <div id="tabs" className="pt-4 pb-4">
                    <nav className="flex gap-4">
                        <a className="p-4 rounded-xl  bg-gray-300" href={"/scoreboard/" + (this.state.task_id)}>Рейтинг</a>
                        <a className="p-4 rounded-xl bg-gray-300" href={"/attacks/" + (this.state.task_id)}>Атаки</a>
                        <a className="p-4 rounded-xl bg-gray-800 text-white" href={"/snapshots/" + (this.state.task_id)}>Снапшоты</a>
                    </nav>
                </div>
                <div className="pb-4">
                    <h2 className="text-3xl">Ваша машина</h2>
                    <Machine />
                </div>
                <div className="flex flex-col w-1/3 min-w-80">
                    <label class="block font-semibold mb-2" for="name">
                        Имя снапшота (будет видно всем)
                    </label>
                    <input name="name" className="h-full border-2 p-2 rounded-md bg-gray-100 appearance-none" placeholder="обветренный лох" />
                    <button
                        className={"text-white font-bold appearance-none rounded-md p-3 mb-3 mt-3 " + (true ? "bg-indigo-400" : "bg-gray-300")}>
                        Отправить новую версию машины
                    </button>
                    <div className="text-2xl font-semibold pt-1">
                        <Wait text="Выключаю машину" />
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
                                <td className="long text-2xl text-right"><span className="pr-5">#10</span></td>
                                <td className="long"><span className="pr-3">2024, 5 May, 13:37</span></td>
                                <td className="long whitespace-nowrap">
                                    <span className="pr-3">обкуренный слон</span>
                                </td>
                                <td className="long2 whitespace-nowrap">
                                    <div className="h-full flex p-1">
                                        <div className=" pr-4 pl-4 border-2 rounded-md flex flex-col justify-center score">
                                            <div className="align-middle text-center">
                                                <span className=""><Wait text="Проверяется" /></span><br />
                                                <span className="">🛡 50/300</span>
                                            </div>
                                        </div>
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
                                    <div className="aspect-square stripes bg-blue-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm">
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
                                    <div className="aspect-square stripes bg-blue-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm">
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
                                    <div className="aspect-square stripes bg-blue-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm">
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
                                    <div className="aspect-square stripes bg-blue-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm">
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
                                    <div className="aspect-square stripes bg-blue-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm">
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
                                    <div className="aspect-square stripes bg-blue-400 rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm">
                                        <Wait text="Запускаю машину" />
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="long text-2xl text-right"><span className="pr-5">#9</span></td>
                                <td className="long"><span className="pr-3">2024, 5 May, 2:28</span></td>
                                <td className="long whitespace-nowrap">
                                    <span className="pr-3">лось и смычок и лось и смычок и лось и смычок</span>
                                </td>
                                <td className="long2 whitespace-nowrap">
                                    <div className="h-full flex p-1">
                                        <div className=" pr-4 pl-4 border-2 rounded-md flex flex-col justify-center score">
                                            <div className="align-middle text-center">
                                                <span className="">🛡 50/300</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="long text-2xl text-right"><span className="pr-5">#3</span></td>
                                <td className="long text-xl"><span className="pr-5">@debil online</span></td>
                                <td className="long whitespace-nowrap">
                                    <div className="pr-3 pl-3 align-middle">
                                        <span className="">⚔️ 100/200</span><br />
                                        <span className="">🛡 50/300</span><br />
                                        <span className="">{'= 500'}</span>
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
    <Snapshots
        {...props}
        params={useParams()}
    />)
// export default withRouter Task;
