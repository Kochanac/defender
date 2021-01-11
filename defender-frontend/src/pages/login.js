

function Login() {
    return (
        <div className="App" class="flex justify-center p-20">
            <div class="w-1/2">
                <form class="rounded px-8 pt-6 pb-8">
                    <div class="mb-9">
                        <h1 class="text-5xl">
                            Defence 0.1
                        </h1>
                    </div>
                    <div class="mb-4">
                        <label class="block font-semibold mb-2" for="title">
                            Юзернейм
                        </label>
                        <input
                            class="bg-gray-100 appearance-none rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="title"
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
                            id="title"
                            type="password"
                            placeholder=""
                        />
                    </div>
                    <div class="flex items-start justify-start">
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            type="button">
                            Зарегистрироваться
                        </button>
                        <button
                            className="ml-2 bg-gray-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            type="button">
                            Залогиниться
                        </button>
                    </div>
                </form>
            </div>



        </div>
    );
}

export default Login;
