from misc import with_connection



@with_connection
def register(conn, data):
    username = data["username"]
    password = data["password"]

    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE username = %s", [username])

    if len(cur.fetchall()) != 0:
        return False

    cur.execute("INSERT INTO users (username, password) VALUES (%s, %s)", [username,  password])

    return True


@with_connection
def login(conn, data):
    username = data["username"]
    password = data["password"]

    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE username = %s and password = %s", [username, password])

    res = cur.fetchall()
    if len(res) == 1:
        return res[0][0]
    else:
        return None


@with_connection
def get_tasks(conn, uid):

    cur = conn.cursor()

    cur.execute("""
        SELECT tasks.id, title, exploit, defence FROM tasks
        LEFT JOIN solves ON solves.user_id = %s and solves.task_id = tasks.id
        """, [uid])

    tasks = cur.fetchall()

    def task_convert(task):
        return {
            "id": task[0],
            "title": task[1],
            "exploit": task[2],
            "defence": task[3]
        }

    return list(map(task_convert, tasks))


@with_connection
def get_task(conn, id):
    cur = conn.cursor()

    cur.execute("SELECT title, download_url, demo_url from tasks WHERE id = %s", [id])

    task = cur.fetchall()

    if len(task) != 1:
        return None
    else:
        task = task[0]
        return {
            "title": task[0],
            "download_url": task[1],
            "demo_url": task[2]
        }
