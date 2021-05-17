import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';

import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";

import Login from './pages/login';
import Task from "./pages/task";
import TaskList from "./pages/tasklist";

export const HOST = "/api/"

ReactDOM.render(
  <React.StrictMode>
      <div className="App flex justify-center p-20">
          <div className="w-1/2 rounded px-8 pt-6 pb-8">
              <Router>
                  <Switch>
                      <Route path="/task/:id">
                          <Task />
                      </Route>
                      <Route exact path="/tasks">
                          <TaskList />
                      </Route>
                      <Route exact path="/">
                          <Login />
                      </Route>
                      <Route exact path="/users">
                          {/*<Users />*/}
                      </Route>
                  </Switch>
              </Router>
          </div>
      </div>

  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
