from celery import Celery
from os import environ

environ["CELERY_BROKER"] = "redis://localhost"
environ["CELERY_BACKEND"] = "redis://localhost"

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


if __name__ == "__main__":
	app.start()