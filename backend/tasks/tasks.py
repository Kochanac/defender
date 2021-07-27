from os import environ
from celery import Celery

from api.misc import with_redis
import api.db as db

environ["CELERY_BROKER"] = environ.get("CELERY_BROKER", "redis://localhost")
environ["CELERY_BACKEND"] = environ.get("CELERY_BACKEND", "redis://localhost")

celery = Celery("celery", broker=environ["CELERY_BROKER"], backend=environ["CELERY_BACKEND"])

celery.conf.update(
	result_extended=True
)

ticks = 0


@celery.task(bind=True, track_started=True)
def check_exploit(self, task_id, exploit_path):
	# self.update_state(state="PROGRESS")
	import time
	from random import randint

	time.sleep(5)

	result = True if randint(0, 1) == 1 else False
	db.evaluate_exploit(exploit_path, result)

	return result


@celery.task(bind=True, track_started=True)
@with_redis
def box_start(r, self, user_id, task_id):
	# self.update_state(state="PROGRESS")
	r.set(f"box/uid:{user_id}", "starting")

	import time
	from random import randint

	print(r, user_id, task_id)

	time.sleep(5)

	from secrets import token_hex

	box_id = token_hex()

	r.set(f"box/uid:{user_id}", box_id)

	r.set(f"box:{box_id}/status", "on")

	r.set(f"box:{box_id}/uid", user_id)
	r.set(f"box:{box_id}/task_id", task_id)
	r.set(f"box:{box_id}/message", f"wow it works. uid: {user_id}; task_id: {task_id}")


@celery.task(bind=True, track_started=True)
@with_redis
def box_stop(r, self, box_id):
	# self.update_state(state="PROGRESS")
	import time
	from random import randint

	time.sleep(5)

	uid = r.get(f"box:{box_id}/uid").decode()
	r.delete(
		f"box:{box_id}/status",
		f"box:{box_id}/uid",
		f"box:{box_id}/task_id",
		f"box:{box_id}/message",
		f"box:{box_id}/checks",
		f"box:{box_id}/checks/progress")
	r.delete(f"box/uid:{uid}")


@celery.task(bind=True, track_started=True)
@with_redis
def box_checks(r, self, box_id):
	print("w")

	import time
	from random import randint, choice

	def gen_s(n=10):
		return ''.join([choice("qwertyuiopasdfghjklzxcvbnm") for _ in range(10)])

	r.set(f"box:{box_id}/checks/progress", "in progress")
	r.delete(f"box:{box_id}/checks")

	for i in range(5):
		time.sleep(2)
		result = True if randint(0, 1) == 1 else False
		comment = f"Check {gen_s()}: {'PASS' if result else 'FAILED'}"

		colored = f"{'G' if result else 'R'}:{comment}"

		r.rpush(f"box:{box_id}/checks", colored)

	r.set(f"box:{box_id}/checks/progress", "finished")
# db.evaluate_box
