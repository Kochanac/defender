from api.misc import with_connection
import api.models.task as task
import api.models.exploit as exploit


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
def get_tasks(conn, uid) -> list[task.UserTask]:

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

	def task_convert(t) -> task.UserTask:
		return task.UserTask(
				id=t[0],
				title=t[1],
				is_exploited=t[2] == True,
				is_defended=t[3] == True
		)

	return list(map(task_convert, tasks))


@with_connection
def get_task_info(conn, id) -> task.TaskInfo | None:
	cur = conn.cursor()

	cur.execute("SELECT title, download_url, demo_url, checker_path, qemu_qcow2_path, flag from tasks WHERE id = %s", [id])

	t = cur.fetchall()

	if len(t) != 1:
		return None
	else:
		t = t[0]
		ti = task.TaskInfo(
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

@with_connection
def upload_exploit(conn, user_id: int, task_id: int, exploit_path: str) -> int:
	cur = conn.cursor()

	cur.execute("INSERT INTO exploits (user_id, task_id, path) VALUES (%s, %s, %s) RETURNING (id)", [user_id, task_id, exploit_path])

	exploit_id = cur.fetchone()[0]
	return exploit_id

@with_connection
def get_exploit(conn, exploit_id: int) -> exploit.Exploit:
	cur = conn.cursor()

	cur.execute("SELECT user_id, task_id, path FROM exploits WHERE id=%s", [exploit_id,])
	user_id, task_id, path = cur.fetchone()

	return exploit.Exploit(
		exploit_id=exploit_id,
		user_id=user_id,
		task_id=task_id,
		exploit_path=path
	)


@with_connection
def run_first_exploit(conn, exploit_id: int, target_image: str) -> int:
	expl = get_exploit(exploit_id)

	cur = conn.cursor()

	run_id = _run_exploit(cur, exploit_id, target_image)

	cur.execute("INSERT INTO first_exploits (user_id, task_id, run_id) VALUES (%s, %s, %s)", [expl.user_id, expl.task_id, run_id])

	return int(run_id)


def _run_exploit(cur, exploit_id: int, target_image: str) -> int:
	cur.execute("INSERT INTO exploit_runs (exploit_id, target_image) VALUES (%s, %s) RETURNING (run_id)", [exploit_id, target_image])

	run_id = cur.fetchone()[0]
	return int(run_id)

@with_connection
def get_exploit_run(conn, exploit_run_id: int) -> exploit.ExploitRun | None:
	cur = conn.cursor()
	assert isinstance(exploit_run_id, int)

	print(exploit_run_id)

	cur.execute("SELECT exploit_id, target_image, result FROM exploit_runs WHERE run_id=%s", [exploit_run_id,])
	e = cur.fetchone()
	if e is None:
		return None
	exploit_id, target_image, result = tuple(e)
	
	print(exploit_id)

	res = None
	if result == "OK":
		res = exploit.ExploitResult.ok
	elif result is not None:
		res = exploit.ExploitResult.failed

	return exploit.ExploitRun(
		run_id=exploit_run_id,
		exploit_id=int(exploit_id),
		target_image=target_image,
		result=res
	)


@with_connection
def set_exploit_run_result(conn, exploit_run_id: int, result: exploit.ExploitResult):
	cur = conn.cursor()

	cur.execute("UPDATE exploit_runs set result=%s WHERE run_id=%s", [result.value, exploit_run_id])

@with_connection
def get_first_exploit_run(conn, user_id: int, task_id: int) -> int:
	cur = conn.cursor()
	cur.execute("SELECT run_id FROM first_exploits WHERE user_id=%s AND task_id=%s ORDER BY created_at DESC LIMIT 1", [user_id, task_id])
	run_id = cur.fetchone()[0]
	return int(run_id)

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
def get_task_progress(conn, uid, task_id) -> task.UserTask:
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

	return task.UserTask(id=task_id, title=str(task[0]), is_exploited=task[1], is_defended=task[2])

	#return {"exploited": bool(task[0]), "defended": bool(task[1])}

