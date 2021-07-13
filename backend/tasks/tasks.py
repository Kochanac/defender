from celery import Celery
from os import environ
from api.misc import with_redis, with_connection

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

	if randint(0, 1) == 0:
		return True
	else:
		return False


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
		f"box:{box_id}/message")
	r.delete(f"box/uid:{uid}")


# if __name__ == "__main__":
# 	celery.start()



