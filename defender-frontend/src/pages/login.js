import React from "react";
import { call } from "../api/api"

async function RegUser() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    let data = await call("register", {
        username: username,
        password: password
    }
    )

    console.log(data);
    if (data["status"] === "ok") {
        document.getElementById("modal-text").innerText = "Успешная регистрация"
    } else {
        document.getElementById("modal-text").innerText = "Ошибка при регистрации"
    }
    document.getElementById("modal").showModal()
}

async function LogUser() {
    let username = document.getElementById("username").value
    let password = document.getElementById("password").value

    let data = await call("login", {
        username: username,
        password: password
    }
    )

    if (data["status"] === "ok") {
        localStorage.setItem("username", username)
        localStorage.setItem("token", data["token"])
        window.location.href = "/tasks"
    } else {
        document.getElementById("modal-text").innerText = "Некорректные данные входа"
        document.getElementById("modal").showModal()
    }
}

async function HideModal() {
    // todo hide modal
    document.getElementById("modal").close();
}

function Login() {
    return (
        <div class="">
            <div class="mb-9">
                <h1 id="title" class="text-5xl">
                    Defender 0.3
                </h1>
            </div>
            <dialog id="modal" className="rounded-xl shadow-md">
                <div className="p-10
                bg-light-primaryContainer text-light-primary
                dark:bg-dark-primaryContainer dark:text-dark-primary
                flex flex-col gap-8
                ">
                    <p id="modal-text">Ошибка</p>
                    <button
                        onClick={HideModal}
                        className="w-full rounded-xl shadow-md
                        bg-light-secondaryContainer text-light-onSecondaryContainer hover:bg-light-secondaryFixedDim
                        dark:bg-dark-secondaryContainer dark:text-dark-onSecondaryContainer dark:hover:bg-dark-surfaceVariant
                        py-6
                    " >OK</button>
                </div>
            </dialog>
            <div class="mb-6">
                <label class="block font-semibold mb-2" for="title">
                    Юзернейм
                </label>
                <input
                    class="
                    bg-light-primaryContainer text-light-primary
                    dark:bg-dark-primaryContainer dark:text-dark-primary
                    appearance-none rounded-xl w-full py-4 px-3  leading-tight focus:outline-none focus:shadow-outline"
                    id="username"
                    type="text"
                    placeholder=""
                    onKeyUp={(e) => {
                        if (e.key === 'Enter') {
                            LogUser()
                        }
                    }}
                />
            </div>
            <div class="mb-6">
                <label
                    class="block font-semibold mb-2"
                    for="username"
                >
                    Пароль
                </label>
                <input
                    class="
                    bg-light-primaryContainer text-light-primary
                    dark:bg-dark-primaryContainer dark:text-dark-primary
                    appearance-none rounded-xl w-full py-4 px-3 leading-tight focus:outline-none focus:shadow-outline"
                    id="password"
                    type="password"
                    placeholder=""
                    onKeyUp={(e) => {
                        if (e.key === 'Enter') {
                            LogUser()
                        }
                    }}
                />
            </div>
            <div class="flex mt-10">
                <button onClick={RegUser}
                    className="w-full
                    bg-light-secondaryContainer text-light-onSecondaryContainer hover:bg-light-secondaryFixedDim
                    dark:bg-dark-secondaryContainer dark:text-dark-onSecondaryContainer dark:hover:bg-dark-surfaceVariant
                    font-bold py-6 px-4 rounded-xl focus:outline-none focus:shadow-outline"
                    type="button">
                    Зарегистрироваться
                </button>
                <button onClick={LogUser}
                    className="ml-2 w-full
                    bg-light-primaryContainer text-light-onPrimaryContainer hover:bg-light-primaryFixedDim
                    dark:bg-dark-primaryContainer dark:text-dark-onPrimaryContainer dark:hover:bg-dark-surfaceVariant
                    font-bold py-6 px-4 rounded-xl focus:outline-none focus:shadow-outline"
                    type="button">
                    Войти
                </button>
            </div>
        </div>
    );
}

export default Login;
