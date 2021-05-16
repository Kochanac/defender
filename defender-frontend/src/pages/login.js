
import { HOST } from "../index.js"

async function RegUser() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    let data = await fetch(HOST + "register", {
        method: "POST",
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    data = await data.json()
    console.log(data);
    if (data["status"] === "ok")
        document.getElementById("title").innerText = "Registered."
    else
        document.getElementById("title").innerText = "Registration failed"
}

async function LogUser() {
    let username = document.getElementById("username").value
    let password = document.getElementById("password").value

    let data = await fetch(HOST + "login", {
        method: "POST",
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    data = await data.json();
    if (data["status"] === "ok") {
        localStorage.setItem("username", username)
        localStorage.setItem("token", data["token"])
        window.location.href = "/tasks"
    } else
        document.getElementById("title").innerText = "Login failed"
}

function Login() {
    return (
                <form class="">
                    <div class="mb-9">
                        <h1 id="title" class="text-5xl">
                            Defence 0.1
                        </h1>
                    </div>
                    <div class="mb-4">
                        <label class="block font-semibold mb-2" for="title">
                            Юзернейм
                        </label>
                        <input
                            class="bg-gray-100 appearance-none rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="username"
                            type="text"
                            placeholder=""
                        />
                    </div>
                    <div class="mb-4">
                        <label
                            class="block font-semibold mb-2"
                            for="username"
                        >
                            Пароль
                        </label>
                        <input
                            class="bg-gray-100 appearance-none rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="password"
                            type="password"
                            placeholder=""
                        />
                    </div>
                    <div class="flex items-start justify-start">
                        <button onClick={RegUser}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            type="button">
                            Зарегистрироваться
                        </button>
                        <button onClick={LogUser}
                            className="ml-2 bg-gray-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            type="button">
                            Залогиниться
                        </button>
                    </div>
                </form>
    );
}

export default Login;
