
import redis
from api.misc import with_redis


@with_redis
def set_user_id(r: redis.Redis, user_id: int, token: str):
	return r.set(token, f"uid:{user_id}")


@with_redis
def get_user_auth(r: redis.Redis, token: str) -> int | None:
	u = bytes(r.get(token))
	u = u.decode()

	if u is None or u.split(":")[0] != "uid":
		return None

	res = u.split(":")[1]
	return int(res)


@with_redis
def set_exploit_run_celery_task(r, run_id: int, celery_task_id: str):
	r.set(f"run:{run_id}/celery_task", celery_task_id)

@with_redis
def get_exploit_run_celery_task(r, run_id: int) -> str:
	task_id = r.get(f"run:{run_id}/celery_task")
	return str(task_id.decode())


@with_redis
def set_checker_run_celery_task(r, run_id: int, celery_task_id: str):
	r.set(f"checker:{run_id}/celery_task", celery_task_id)

@with_redis
def get_checker_run_celery_task(r, run_id: int) -> str:
	task_id = r.get(f"checker:{run_id}/celery_task")
	return str(task_id.decode())

