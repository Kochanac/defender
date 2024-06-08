
function convert_status(status) {
    if (status === "pre starting") {
        return "В очереди"
    }
    if (status === "starting") {
        return "Создаю машину"
    }
    if (status === "waiting for machine") {
        return "Запускаю сервис"
    }
    if (status === "sending flags") {
        return "Отправляю флаги"
    }
    if (status === "running") {
        return "Тестирую"
    }
    if (status === "to delete machine") {
        return "Удаляю машину"
    }
}

class snapshot {
    constructor(id, user_id, name, state, created_at, score) {
        this.id = id
        this.user_id = user_id
        this.name = name
        this.state = state
        this.created_at = created_at
        this.score = score
    }
}

class attack {
    constructor(id, user_id, name, state, created_at, score) {
        this.id = id
        this.user_id = user_id
        this.name = name
        this.state = state
        this.created_at = created_at
        this.score = score
    }
}

export { convert_status, snapshot, attack }