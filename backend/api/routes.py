from random import randint
import os
from secrets import token_hex
from functools import wraps
from pathlib import Path

# from flask import Flask
# from flask import render_template, request, redirect, send_file, 
# from flask import session

from fastapi import FastAPI, Request, Body

import api.db as db
from api.misc import with_redis
from api.auth_middleware import TokenAuthMiddleware

import tasks.tasks as tasks

app = FastAPI()

app.add_middleware(TokenAuthMiddleware[0], backend=TokenAuthMiddleware[1])


# app = Flask(__name__)

# app.secret_key = os.urandom(32)


@app.get("/")
def read_root(request: Request):
	if request.user.is_authenticated:
		return {"uid": request.user}
	else:
		return {"Hello": "World"}


@app.post("/register")
def _register(username: str = Body(...), password: str = Body(...)):
	data = {
		"username": username,
		"password": password
	}

	res = db.register(data)

	if res == True:
		return {
				"status": "ok"
			}
	else:
		return {
				"status": "failed"
			}


@app.post("/login")
@with_redis
def _login(r, username: str = Body(...), password: str = Body(...)):
	data = {
		"username": username,
		"password": password
	}

	res = db.login(data)

	if res is not None:
		token = token_hex()
		r.set(token, f"uid:{res}")
		print(token)
		return {
				"status": "ok",
				"token": token
			}
	else:
		return {
				"status": "failed"
			}

# import inspect
# print(inspect.signature(_login))


# @app.route("/tasks", methods=["POST"])
# @with_auth
# @with_redis
# def _tasks(r, uid):
# 	data = request.get_json(force=True)

# 	tasks = db.get_tasks(uid)

# 	return ({
# 			"tasks": tasks
# 		})


# @app.route('/task', methods=['POST'])
# @with_auth
# def _gettask(uid):
# 	global state

# 	post = request.get_json(force=True)

# 	task = db.get_task(post['task_id'])
# 	if task is not None:
# 		return ({
# 				"error": 0,
# 				"exploit_example": "http://2.com/",
# 				"service_demo": task["demo_url"],
# 				"title": task["title"],
# 				"download_url": task["download_url"],

# 				"exploit_code": state["exploit_code"],
# 			})
# 	else:
# 		return ({"error": 404})


# @app.route('/task/exploit/upload', methods=['POST'])
# @fancy_on_error
# @with_auth
# @with_redis
# def _upload_exploit(r, uid):
# 	"""
# 		Expecting {
# 			auth,
# 			"task_id": id,
# 			"code": "fewafm\nfeafmeaw\n"
# 		}

# 		Does:
# 		start a job in Celery
# 	"""
# 	data = request.get_json(force=True)

# 	assert "code" in data
# 	assert db.get_task(data["task_id"]) is not None
# 	code = data["code"]
# 	# task_id = data["task_id"]

# 	exploit_path = Path(f"../data/exploits/{data['task_id']}/{token_hex()}.py")

# 	exploit_path.parent.mkdir(exist_ok=True)

# 	open(exploit_path, 'w').write(code)

# 	print(exploit_path)
# 	db.upload_exploit(uid, data["task_id"], str(exploit_path))

# 	print("delaying task")
# 	task = tasks.check_exploit.delay(data["task_id"], str(exploit_path))

# 	r.set(f"exploit/uid:{uid}/task_id:{data['task_id']}", task.id)

# 	return ({
# 			"error": 0
# 		})


# @app.route('/task/status', methods=['POST'])
# @with_auth
# @with_redis
# @fancy_on_error
# def _exploit_status(r, uid):
# 	data = request.get_json(force=True)

# 	task_id = data['task_id']

# 	tid = r.get(f"exploit/uid:{uid}/task_id:{task_id}")
# 	if tid is not None:
# 		task = tasks.check_exploit.AsyncResult(tid)
# 	else:
# 		task = None

# 	if task and task.state == "SUCCESS":
# 		res = task.result
# 		return ({
# 				"error": 0,
# 				"status": "checked",
# 				"result": ("OK" if res else "FAIL"),

# 				# "flag": state["flag"]
# 			})

# 	elif task and task.state == "STARTED":
# 		return ({
# 				"error": 0,
# 				# "exploit_id": 123,
# 				"status": "in progress"
# 			})
# 	else:
# 		return ({
# 				"error": 0,
# 				"exploit_id": -1,
# 				"status": "none"
# 			})

# @app.route("/task/defence/box/status", methods=['POST'])
# @with_auth
# @with_redis
# @fancy_on_error
# def _box_status(r, uid):
# 	data = request.get_json(force=True)

# 	box_id = r.get(f"box/uid:{uid}")

# 	if box_id is None:
# 		box = {"status": "off"}

# 	elif box_id.decode() == "starting": # ?
# 		box = {"status": "starting"}

# 	else:
# 		box_id = box_id.decode()
# 		box = {
# 			"task": r.get(f"box:{box_id}/task_id").decode(),
# 			"status": r.get(f"box:{box_id}/status").decode(),
# 			"message": r.get(f"box:{box_id}/message").decode()
# 		}
		
# 		if data["task_id"] != int(box["task"]):
# 			box = {"status": "off"}


# 	if box["status"] == "on":
# 		return ({
# 				"status": "on",
# 				"message": box["message"],
# 				"error": 0
# 			})
# 	elif box["status"] == "starting":
# 		return ({
# 				"status": "starting",
# 				"error": 0
# 			})
# 	else:
# 		return ({
# 				"status": "off",
# 				"error": 0
# 			})



# @app.route("/task/defence/box/start", methods=["POST"])
# @with_auth
# @with_redis
# @fancy_on_error
# def _start_box(r, uid):
# 	data = request.get_json(force=True)

# 	task_id = data["task_id"]

# 	if not db.is_exploited(uid, task_id):
# 		return ({"error": 403, "message": "exploit first"})

# 	box_status = r.get(f"box/uid:{uid}")
# 	print(box_status)

# 	if box_status == "starting":
# 		return ({"error": 1, "message": "box is starting"})
	
# 	elif box_status == None:
# 		tasks.box_start.delay(uid, task_id)
	
# 	else:
# 		box_id = r.get(f"box/uid:{uid}").decode()
# 		(tasks.box_stop.si(box_id) | tasks.box_start.si(uid, task_id)).delay()

# 	return ({"error": 0})



# @app.route("/task/defence/box/stop", methods=["POST"])
# @with_auth
# @with_redis
# @fancy_on_error
# def _stop_box(r, uid):
# 	data = request.get_json(force=True)

# 	box_id = r.get(f"box/uid:{uid}")

# 	if box_id in [b"off", b"starting", None]:
# 		return ({"error": 1, "message": "box in not on"})

# 	box_id = box_id.decode()

# 	if int(r.get(f"box:{box_id}/task_id")) != data["task_id"]:
# 		return ({"error": 2, "message": "box of another task is on"})

# 	tasks.box_stop.delay(box_id)

# 	return ({"error": 0})


# @app.route("/task/defence/test/start", methods=["POST"])
# @with_auth
# @with_redis
# @fancy_on_error
# def _test_start(r, uid):
# 	data = request.get_json(force=True)

# 	box_id = r.get(f"box/uid:{uid}")

# 	if box_id in [b"off", b"starting", None] \
# 		or int(r.get(f"box:{box_id.decode()}/task_id")) != data["task_id"]:
# 		return ({"error": 1, "message": "box in not on"})

# 	box_id = box_id.decode()

# 	if r.get(f"box:{box_id}/checks/progress") == "in progress":
# 		return ({"error": 1, "message": "box in checking"})

# 	tasks.box_checks.delay(box_id)

# 	return ({"error": 0})


# @app.route("/task/defence/test/checks", methods=["POST"])
# @with_auth
# @with_redis
# @fancy_on_error
# def _box_checks(r, uid):
# 	data = request.get_json(force=True)

# 	box_id = r.get(f"box/uid:{uid}")

# 	if box_id in [b"off", b"starting", None] \
# 		or int(r.get(f"box:{box_id.decode()}/task_id")) != data["task_id"]:
# 		return ({"error": 1, "message": "box in not on"})

# 	box_id = box_id.decode()

# 	def check_convert(x):
# 		color = "green" if x.split(":")[0] == "G" else "red"
# 		return {
# 			"color": color,
# 			"text": x[2:]
# 		}

# 	return ({
# 			"error": 0,
# 			"checks": [check_convert(x.decode()) for x in r.lrange(f"box:{box_id}/checks", 0, -1)],
# 			"finished_checks": True if r.get(f"box:{box_id}/checks/progress") in [b"finished", None] else False
# 		})


# ##  |           |
# ##  |           |
# ## \/ old shit \/


# # @app.route('/task/update', methods=['POST'])
# # def updtask():
# # 	post = request.get_json(force=True)

# # 	if post['task_id'] == 5:
# # 		return ({
# # 				"error": 0,
# # 				"done": {}
# # 			})




# message = """
# Данные для входа:
# ssh root@defence.imbadat.tech -p 60010
# Пароль: fKmUoDcgU
# curl http://defence.imbadat.tech:68010/
# """

# state = {
# 	"flag": None,

# 	"exploit": None,

# 	"box": "Not started",
# 	"tests": -1,
# 	"checks": [
# 		{
# 			"color": "green",
# 			"text": "Check: OK"
# 		},
# 		{
# 			"color": "green",
# 			"text": "Vuln check 1: PASS"
# 		},
# 		{
# 			"color": "green",
# 			"text": "Vuln check 2: PASS"
# 		},
# 		{
# 			"color": "red",
# 			"text": "Vuln check 3: FAIL"
# 		},
# 	],

# 	"exploit_code": "Code goes here"
# }









