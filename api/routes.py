from random import randint
import os
from secrets import token_hex

from flask import Flask
from flask import render_template, request, redirect, send_file, jsonify
from flask import session

import db
from misc import with_redis

app = Flask(__name__)

app.secret_key = os.urandom(32)

@with_redis
def with_auth(r, func):
	def with_auth_(*args, **kwargs):
		data = request.get_json(force=True)

		if "token" not in data:
			return jsonify({ "status": "bad auth"})

		uid = r.get(data["token"]).decode()

		if uid is None or uid.split(":")[0] != "uid":
			return jsonify({ "status": "bad auth"})

		uid = int(uid.split(":")[1])

		return func(uid, *args, **kwargs)

	return with_auth_



@app.route("/register", methods=["POST"])
def register():
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
def login(r):
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
def tasks(r, uid):
	data = request.get_json(force=True)

	tasks = db.get_tasks(uid)

	return jsonify({
			"tasks": tasks
		})




##  |           |
##  |           |
## \/ old shit \/


@app.route('/task', methods=['POST'])
def gettask():
	global state

	post = request.get_json(force=True)

	if post['task_id'] == 5:
		return jsonify({
				"error": 0,
				"exploit_example": "http://2.com/",
				"service_demo": "http://2.com/",
				"title": "PHP Web Token",
				"username": f"Kochan",

				"exploit_code": state["exploit_code"],
			})


	return jsonify({"error": 404})


@app.route('/task/update', methods=['POST'])
def updtask():
	post = request.get_json(force=True)

	if post['task_id'] == 5:
		return jsonify({
				"error": 0,
				"done": {}
			})


@app.route('/task/exploit/upload', methods=['POST'])
def upload_exploit():
	global state
	"""
		Expecting {
			auth,
			"code": "fewafm\nfeafmeaw\n"
		}
	"""
	post = request.get_json(force=True)

	assert "code" in post

	state["exploit"] = 1

	state["exploit_code"] = post["code"]

	print(post["code"])

	return jsonify({
			"error": 0
		})

timer = 0
res = 1
@app.route('/task/status', methods=['POST'])
def exploit_status():
	global state, res, timer

	post = request.get_json(force=True)

	assert post["task_id"] == 5
	
	timer += 1

	if state["exploit"] == 2:
		res = randint(0, 2) if res == None else res
		return jsonify({
				"error": 0,
				"exploit_id": 123,
				"status": "checked",
				"result": ("OK" if res == 1 else "FAIL"),

				"flag": state["flag"]
			})

	elif state["exploit"] == 1:
		if (randint(0, 100) < 10):
			state["exploit"] = 2
			res = None

		return jsonify({
				"error": 0,
				"exploit_id": 123,
				"status": "in progress"
			})
	else:
		return jsonify({
				"error": 0,
				"exploit_id": -1,
				"status": "none"
			})

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

@app.route("/task/defence/box/status", methods=['POST'])
def box_status():
	global state

	if state["box"] != "Not started":
		return jsonify({
				"status": "on",
				"message": message,
				"error": 0
			})
	else:
		return jsonify({
				"status": "off",
				"error": 0
			})



@app.route("/task/defence/box/start", methods=["POST"])
def start_box():
	global state

	state["box"] = "Started"

	return jsonify({"error": 0})


@app.route("/task/defence/box/stop", methods=["POST"])
def stop_box():
	global state

	state["box"] = "Not started"

	return jsonify({"error": 0})


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

