from api.misc import with_connection



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
		SELECT tasks.id,
			   title,
			   exploits.id != 0,
			   defences.id != 0
			FROM tasks
			LEFT JOIN exploits ON exploits.task_id = tasks.id AND exploits.user_id=%(user_id)s AND works != -1
			LEFT JOIN defences ON defences.task_id = tasks.id AND defences.user_id=%(user_id)s
			ORDER BY tasks.id
	   """, {"user_id": uid})

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

	cur.execute("SELECT title, download_url, demo_url, checker_path, qemu_qcow2_path, tcp_ports_needed, flag from tasks WHERE id = %s", [id])

	task = cur.fetchall()

	if len(task) != 1:
		return None
	else:
		task = task[0]
		return {
			"title": task[0],
			"download_url": task[1],
			"demo_url": task[2],
			"checker_path": task[3],
			"qemu_qcow2_path": task[4],
			"ports": task[5],
			"flag": task[6]
		}

@with_connection
def upload_exploit(conn, uid, task_id, exploit_path):
	cur = conn.cursor()

	cur.execute("INSERT INTO exploits (user_id, task_id, path) VALUES (%s, %s, %s)", [uid, task_id, exploit_path])

	return True


@with_connection
def get_recent_exploit(conn, uid, task_id):
	cur = conn.cursor()

	cur.execute("SELECT path FROM exploits \
				 WHERE user_id=%(uid)s and task_id=%(task_id)s and id = \
					(SELECT MAX(id) FROM exploits WHERE user_id=%(uid)s and task_id=%(task_id)s)", 
					{"uid": uid, "task_id": task_id})

	exploit_path = cur.fetchone()

	if exploit_path is None:
		return None
	else:
		return exploit_path[0]


@with_connection
def evaluate_exploit(conn, exploit_path, result: bool):
	cur = conn.cursor()

	assert type(result) is bool

	result = 1 if result else 0

	cur.execute("UPDATE exploits SET works=%(result)s WHERE path=%(path)s", 
		{"result": result, "path": exploit_path})


@with_connection
def is_exploited(conn, uid, task_id):
	cur = conn.cursor()

	cur.execute("SELECT id FROM exploits WHERE user_id = %s AND task_id = %s AND works = 1",
		[uid, task_id])

	if cur.fetchone():
		return True
	else:
		return False


@with_connection
def mark_solved(conn, uid, task_id):
	cur = conn.cursor()

	cur.execute("INSERT INTO defences (user_id, task_id) VALUES (%s, %s)", [int(uid), int(task_id)])


@with_connection
def get_task_progress(conn, uid, task_id):
	cur = conn.cursor()

	cur.execute("""
		SELECT exploits.id != 0,
			   defences.id != 0
			FROM tasks
			LEFT JOIN exploits ON exploits.task_id = tasks.id AND exploits.user_id=%(user_id)s AND works != -1
			LEFT JOIN defences ON defences.task_id = tasks.id AND defences.user_id=%(user_id)s
			WHERE tasks.id = %(task_id)s
		 """, {"user_id": uid, "task_id": task_id})

	task = cur.fetchone()

	return {"exploited": bool(task[0]), "defended": bool(task[1])}

