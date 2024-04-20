import hashlib
from api.misc import with_connection
import api.model.task as m_task


def cryptohash(x: str) -> str:
	return hashlib.sha256(x.encode()).hexdigest()

@with_connection
def register(conn, username: str, password: str) -> bool:
	cur = conn.cursor()

	cur.execute("SELECT * FROM users WHERE username = %s", [username])

	if len(cur.fetchall()) != 0:
		return False

	cur.execute("INSERT INTO users (username, password) VALUES (%s, %s)", [username,  cryptohash(password)])

	return True


@with_connection
def login(conn, username, password) -> int | None:
	cur = conn.cursor()

	cur.execute("SELECT id FROM users WHERE username = %s and password = %s", [username, cryptohash(password)])

	res = cur.fetchall()
	if len(res) == 1:
		return res[0][0]
	else:
		return None


@with_connection
def get_tasks(conn, uid) -> list[m_task.UserTask]:

	cur = conn.cursor()

	cur.execute("""
		SELECT tasks.id, tasks.title, count(er.exploit_id) > 0, count(cr.id) > 0
			FROM tasks

			LEFT JOIN first_exploits as fe ON fe.task_id = tasks.id AND fe.user_id=%(user_id)s
			LEFT JOIN exploit_runs as er ON er.exploit_id=fe.id AND er.result = 'OK'

			LEFT JOIN first_checker_run fcr ON fcr.task_id = tasks.id AND fcr.user_id=%(user_id)s
			LEFT JOIN checker_run as cr ON fcr.run_id = cr.id AND cr.ok

			GROUP BY tasks.id, tasks.title
	   """, {"user_id": uid})

	tasks = cur.fetchall()

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

	cur.execute("SELECT title, download_url, demo_url, qemu_qcow2_path, flag from tasks WHERE id = %s", [id])

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
			image_path=t[3],
			exploit_example="kek",
			flag=t[4]
		)
		return ti



@with_connection
def get_task_progress(conn, uid, task_id) -> m_task.UserTask | None:
	cur = conn.cursor()

	cur.execute("""
		SELECT tasks.title, count(er.exploit_id) > 0, count(cr.id) > 0
			FROM tasks

			LEFT JOIN first_exploits as fe ON fe.task_id = tasks.id AND fe.user_id=%(user_id)s
			LEFT JOIN exploit_runs as er ON er.exploit_id=fe.id AND er.result = 'OK'

			LEFT JOIN first_checker_run fcr ON fcr.task_id = tasks.id AND fcr.user_id=%(user_id)s
			LEFT JOIN checker_run as cr ON fcr.run_id = cr.id AND cr.ok

			WHERE tasks.id = %(task_id)s
			GROUP BY tasks.id, tasks.title
		 """, {"user_id": uid, "task_id": task_id})

	task = cur.fetchone()
	if task is None:
		return None

	return m_task.UserTask(id=task_id, title=str(task[0]), is_exploited=task[1], is_defended=task[2])


