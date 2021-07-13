from random import randint
import os
from secrets import token_hex
from functools import wraps
from pathlib import Path

from flask import Flask
from flask import render_template, request, redirect, send_file, jsonify
from flask import session

import api.db as db
from api.misc import with_redis

import tasks.tasks as tasks

app = Flask(__name__)

app.secret_key = os.urandom(32)


@with_redis
def with_auth(r, func):
	@wraps(func)
	def with_auth_(*args, **kwargs):
		data = request.get_json(force=True)

		if "token" not in data:
			return jsonify({ "error": "bad auth"})

		uid = r.get(data["token"]).decode()

		if uid is None or uid.split(":")[0] != "uid":
			return jsonify({ "error": "bad auth"})

		uid = int(uid.split(":")[1])

		return func(uid, *args, **kwargs)

	return with_auth_


def fancy_on_error(func):
	@wraps(func)
	def fancy_on_error_(*args, **kwargs):
		try:
			return func(*args, **kwargs)
		except Exception as e:
			raise e
			return {"error": "хуй"}

	return fancy_on_error_



@app.route("/register", methods=["POST"])
def _register():
	data = request.get_json(force=True)

	res = db.register(data)

	if res == True:
		return jsonify({
				"status": "ok"
			})
	else:
		return jsonify({
				"status": "failed"
			})


@app.route("/login", methods=["POST"])
@with_redis
def _login(r):
	data = request.get_json(force=True)

	res = db.login(data)

	if res is not None:
		token = token_hex()
		r.set(token, f"uid:{res}")
		print(token)
		return jsonify({
				"status": "ok",
				"token": token
			})
	else:
		return jsonify({
				"status": "failed"
			})


@app.route("/tasks", methods=["POST"])
@with_auth
@with_redis
def _tasks(r, uid):
	data = request.get_json(force=True)

	tasks = db.get_tasks(uid)

	return jsonify({
			"tasks": tasks
		})


@app.route('/task', methods=['POST'])
@with_auth
def _gettask(uid):
	global state

	post = request.get_json(force=True)

	task = db.get_task(post['task_id'])
	if task is not None:
		return jsonify({
				"error": 0,
				"exploit_example": "http://2.com/",
				"service_demo": task["demo_url"],
				"title": task["title"],
				"download_url": task["download_url"],

				"exploit_code": state["exploit_code"],
			})
	else:
		return jsonify({"error": 404})


@app.route('/task/exploit/upload', methods=['POST'])
@fancy_on_error
@with_auth
@with_redis
def _upload_exploit(r, uid):
	global state
	"""
		Expecting {
			auth,
			"task_id": id,
			"code": "fewafm\nfeafmeaw\n"
		}

		Does:
		start a job in Celery
	"""
	data = request.get_json(force=True)

	assert "code" in data
	assert db.get_task(data["task_id"]) is not None
	code = data["code"]
	# task_id = data["task_id"]

	exploit_path = Path(f"../data/exploits/{data['task_id']}/{token_hex()}.py")

	exploit_path.parent.mkdir(exist_ok=True)

	open(exploit_path, 'w').write(code)

	print(exploit_path)
	db.upload_exploit(uid, data["task_id"], str(exploit_path))

	print("delaying task")
	task = tasks.check_exploit.delay(data["task_id"], str(exploit_path))

	r.set(f"exploit/uid:{uid}/task_id:{data['task_id']}", task.id)

	return jsonify({
			"error": 0
		})


@app.route('/task/status', methods=['POST'])
@with_auth
@with_redis
@fancy_on_error
def _exploit_status(r, uid):
	data = request.get_json(force=True)

	task_id = data['task_id']

	tid = r.get(f"exploit/uid:{uid}/task_id:{task_id}")
	if tid is not None:
		task = tasks.check_exploit.AsyncResult(tid)
	else:
		task = None

	if task and task.state == "SUCCESS":
		res = task.result
		return jsonify({
				"error": 0,
				# "exploit_id": 123,
				"status": "checked",
				"result": ("OK" if res else "FAIL"),

				"flag": state["flag"]
			})

	elif task and task.state == "STARTED":
		return jsonify({
				"error": 0,
				# "exploit_id": 123,
				"status": "in progress"
			})
	else:
		return jsonify({
				"error": 0,
				"exploit_id": -1,
				"status": "none"
			})

@app.route("/task/defence/box/status", methods=['POST'])
@with_auth
@with_redis
@fancy_on_error
def box_status(r, uid):
	data = request.get_json(force=True)

	box_id = r.get(f"box/uid:{uid}")

	if box_id is None:
		box = {"status": "off"}

	elif box_id.decode() == "starting": # ?
		box = {"status": "starting"}

	else:
		box_id = box_id.decode()
		box = {
			"task": r.get(f"box:{box_id}/task_id").decode(),
			"status": r.get(f"box:{box_id}/status").decode(),
			"message": r.get(f"box:{box_id}/message").decode()
		}
		
		if data["task_id"] != int(box["task"]):
			box = {"status": "off"}


	if box["status"] == "on":
		return jsonify({
				"status": "on",
				"message": box["message"],
				"error": 0
			})
	elif box["status"] == "starting":
		return jsonify({
				"status": "starting",
				"error": 0
			})
	else:
		return jsonify({
				"status": "off",
				"error": 0
			})



@app.route("/task/defence/box/start", methods=["POST"])
@with_auth
@with_redis
@fancy_on_error
def start_box(r, uid):
	data = request.get_json(force=True)

	task_id = data["task_id"]

	box_status = r.get(f"box/uid:{uid}")
	print(box_status)

	if box_status == "starting":
		return jsonify({"error": 1, "message": "box is starting"})
	
	elif box_status == None:
		tasks.box_start.delay(uid, task_id)
	
	else:
		box_id = r.get(f"box/uid:{uid}").decode()
		(tasks.box_stop.si(box_id) | tasks.box_start.si(uid, task_id)).delay()

	return jsonify({"error": 0})



@app.route("/task/defence/box/stop", methods=["POST"])
@with_auth
@with_redis
@fancy_on_error
def stop_box(r, uid):
	data = request.get_json(force=True)

	box_id = r.get(f"box/uid:{uid}")

	if box_id in [b"off", b"starting", None]:
		return jsonify({"error": 1, "message": "box in not on"})

	box_id = box_id.decode()

	if int(r.get(f"box:{box_id}/task_id")) != data["task_id"]:
		return jsonify({"error": 2, "message": "box of another task is on"})

	tasks.box_stop(box_id)

	return jsonify({"error": 0})


##  |           |
##  |           |
## \/ old shit \/


# @app.route('/task/update', methods=['POST'])
# def updtask():
# 	post = request.get_json(force=True)

# 	if post['task_id'] == 5:
# 		return jsonify({
# 				"error": 0,
# 				"done": {}
# 			})




message = """
Данные для входа:
ssh root@defence.imbadat.tech -p 60010
Пароль: fKmUoDcgU
curl http://defence.imbadat.tech:68010/
"""

state = {
	"flag": None,

	"exploit": None,

	"box": "Not started",
	"tests": -1,
	"checks": [
		{
			"color": "green",
			"text": "Check: OK"
		},
		{
			"color": "green",
			"text": "Vuln check 1: PASS"
		},
		{
			"color": "green",
			"text": "Vuln check 2: PASS"
		},
		{
			"color": "red",
			"text": "Vuln check 3: FAIL"
		},
	],

	"exploit_code": "Code goes here"
}






@app.route("/task/defence/test/start", methods=["POST"])
def test_start():
	global state

	state["tests"] = 0

	return jsonify({"error": 0})


@app.route("/task/defence/test/checks", methods=["POST"])
def test_checks():
	global state

	if state["tests"] != -1:
		state["tests"] += 1

	if state["tests"] == len(state["checks"]) + 1:
		state["tests"] = -1
		state["flag"] = "Flag{faewfew}"
		return jsonify({"error":0})

	return jsonify({
			"error": 0,
			"checks": state["checks"][:max(0, state["tests"])]
		})

