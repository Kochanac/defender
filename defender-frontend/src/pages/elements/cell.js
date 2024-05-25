import React from 'react'
import { convert_status } from '../utils';
import Wait from './wait';


export function Cell(props) {
    let result = props.result;
    let status = props.status;
    let prev_res = props.prev_res;

    if (result === "OK") {
        return <td>
            <div className="aspect-square bg-green-400 dark:bg-dark-primary dark:text-dark-onPrimary rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                Взлом
            </div>
        </td>
    }
    if (result === "NO FLAGS") {
        return <td>
            <div className="aspect-square bg-light-error text-light-onError dark:bg-dark-errorContainer dark:text-dark-onErrorContainer rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                Не взлом
            </div>
        </td>
    }
    if (result === "MACHINE START TIMEOUT") {
        return <td>
            <div className="aspect-square bg-yellow text-light-onError dark:bg-dark-errorContainer dark:text-dark-onErrorContainer rounded-2xl text-center align-middle flex justify-center flex-col m-1">
                Таймаут запуска сервиса
            </div>
        </td>
    }

    let wait_classes = "aspect-square stripes  rounded-2xl text-center align-middle flex justify-center flex-col m-1 text-sm dark:text-black "

    if (prev_res == null) {
        wait_classes += "bg-white"
    }
    if (prev_res != null) {
        if (prev_res === "OK") {
            wait_classes += " bg-green-400  dark:bg-dark-primary dark:bg-dark-errorContainer dark:text-dark-onErrorContainer"
        }
        if (prev_res === "NO FLAGS") {
            wait_classes += " bg-light-error text-light-onError dark:bg-dark-errorContainer dark:text-white"
        }
    }

    return (<td>
        <div className={wait_classes}>
            <Wait text={convert_status(status)} />
        </div>
    </td>)
}
