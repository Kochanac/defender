from api.misc import with_connection
import api.model.task as m_task


@with_connection
def register(conn, username: str, password: str) -> bool:
	cur = conn.cursor()

	cur.execute("SELECT * FROM users WHERE username = %s", [username])

	if len(cur.fetchall()) != 0:
		return False

	cur.execute("INSERT INTO users (username, password) VALUES (%s, %s)", [username,  password])

	return True


@with_connection
def login(conn, username, password) -> int | None:
	cur = conn.cursor()

	cur.execute("SELECT id FROM users WHERE username = %s and password = %s", [username, password])

	res = cur.fetchall()
	if len(res) == 1:
		return res[0][0]
	else:
		return None


@with_connection
def get_tasks(conn, uid) -> list[m_task.UserTask]:

	cur = conn.cursor()

	cur.execute("""
		SELECT tasks.id, tasks.title, count(exploit_id) > 0, count(defences.id) > 0
			FROM tasks
			LEFT JOIN first_exploits ON first_exploits.task_id = tasks.id AND first_exploits.user_id=%(user_id)s
			LEFT JOIN exploit_runs ON exploit_runs.exploit_id=first_exploits.id AND exploit_runs.result = 'OK'
			LEFT JOIN defences ON defences.task_id = tasks.id AND defences.user_id=%(user_id)s
			GROUP BY tasks.id, tasks.title
	   """, {"user_id": uid})

	tasks = cur.fetchall()
	print(tasks)

	def task_convert(t) -> m_task.UserTask:
		return m_task.UserTask(
				id=t[0],
				title=t[1],
				is_exploited=t[2] == True,
				is_defended=t[3] == True
		)

	return list(map(task_convert, tasks))


@with_connection
def get_task_info(conn, id) -> m_task.TaskInfo | None:
	cur = conn.cursor()

	cur.execute("SELECT title, download_url, demo_url, checker_path, qemu_qcow2_path, flag from tasks WHERE id = %s", [id])

	t = cur.fetchall()

	if len(t) != 1:
		return None
	else:
		t = t[0]
		ti = m_task.TaskInfo(
			id=id,
			title=t[0],
			download_url=t[1],
			service_demo=t[2],
			checker_path=t[3],
			image_path=t[4],
			exploit_example="kek",
			flag=t[5]
		)
		return ti


# дальше старое =======================================================================================================8

@with_connection
def _upload_exploit(conn, uid, task_id, exploit_path):
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
def mark_solved(conn, uid, task_id):
	cur = conn.cursor()

	cur.execute("INSERT INTO defences (user_id, task_id) VALUES (%s, %s)", [int(uid), int(task_id)])


@with_connection
def get_task_progress(conn, uid, task_id) -> m_task.UserTask | None:
	cur = conn.cursor()

	cur.execute("""
		SELECT tasks.title, count(exploit_id) > 0, count(defences.id) > 0
			FROM tasks
			LEFT JOIN first_exploits ON first_exploits.task_id = tasks.id AND first_exploits.user_id=%(user_id)s
			LEFT JOIN exploit_runs ON exploit_runs.exploit_id=first_exploits.id AND exploit_runs.result = 'OK'
			LEFT JOIN defences ON defences.task_id = tasks.id AND defences.user_id=%(user_id)s
			WHERE tasks.id = %(task_id)s
			GROUP BY tasks.id, tasks.title
		 """, {"user_id": uid, "task_id": task_id})

	task = cur.fetchone()
	if task is None:
		return None

	return m_task.UserTask(id=task_id, title=str(task[0]), is_exploited=task[1], is_defended=task[2])

	#return {"exploited": bool(task[0]), "defended": bool(task[1])}

