import React from 'react';
import ReactDOM from 'react-dom';
import "./index.css"
import reportWebVitals from './reportWebVitals';

import {
    BrowserRouter as Router,
    Route,
    Routes
} from "react-router-dom";

import Login from './pages/login';
import Task from "./pages/task";
import TaskList from "./pages/tasklist";
import Table from "./pages/scoreboard/table";
import Attacks from './pages/scoreboard/attacks';
import Snapshots from './pages/scoreboard/snapshots';
import ThemeSwitch from './pages/elements/theme-switcher.tsx';
import Competition from './pages/scoreboard/competition.js';

ReactDOM.render(
    <React.StrictMode>
        <div className="App flex justify-center p-1 lg:p-20 md:p-16 sm:p-6  bg-light-surfaceContainer dark:bg-dark-surfaceContainer text-light-onSurface dark:text-dark-onSurface">
            <div className="giga-container rounded px-1 py-1 sm:px-8 sm:pt-6 sm:pb-8 w-full 2xl:w-3/5 xl:w-3/4 lg:w-3/4 md:w-5/6 sm:w-full">
                <Router>
                    <Routes>
                        <Route path="/task/:id" element=<Task />   >
                        </Route>

                        <Route path="/scoreboard/:id" element=<Table />   >
                        </Route>

                        <Route path="/attacks/:id" element=<Attacks />   >
                        </Route>

                        <Route path="/snapshots/:id" element=<Snapshots />   >
                        </Route>

                        <Route exact path="/tasks" element=<TaskList />   >
                        </Route>

                        <Route path="/competition/:id" element=<Competition />   >
                        </Route>

                        <Route exact path="/" element=<Login />  >
                        </Route>

                        <Route exact path="/users">
                            {/*<Users />*/}
                        </Route>
                    </Routes>
                </Router>

            </div>
            <div className='fixed top-0 right-0 p-4'>

                <ThemeSwitch />
            </div>

    </div>

    </React.StrictMode>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
