from datetime import datetime, timedelta
from typing import List, Tuple

import api.model.machine as m_machine
import api.model.rating_demo as m_rating_demo
import api.model.work as m_work
import api.repository.snapshot.snapshot as snapshot_repo
import api.repository.task.tasks as task
from api.misc import with_redis

from .. import machine

fmt = "rating_demo_machine_{user}/target"
fmt_started = "rating_demo_machine_{user}/started"
demo_machines = "rating_demo_machines"
time_fmt = "%Y-%m-%d %H:%M:%S"

ALLOWED_TIME_SECONDS = 15 * 60


@with_redis
def get_rating_demo_machine_target(r, user_id: int) -> m_rating_demo.RatingDemoTarget | None:
    res = r.get(fmt.format(user=user_id))
    if res is None:
        return None

    return m_rating_demo.RatingDemoTarget.model_validate_json(res)


@with_redis
def set_rating_demo_machine_target(r, user_id: int, target: m_rating_demo.RatingDemoTarget):
    res = r.set(fmt.format(user=user_id), target.model_dump_json())
    if res is None:
        return None

    r.sadd(demo_machines, user_id)


@with_redis
def del_rating_demo_machine_target(r, user_id: int) -> int | None:
    r.delete(fmt.format(user=user_id))
    r.delete(fmt_started.format(user=user_id))
    r.spop(demo_machines, user_id)


@with_redis
def get_rating_demos(r) -> List[int]:
    members = r.smembers(demo_machines)
    if members is None:
        return []

    res = []
    for mem in members:
        res.append(int(mem.decode()))

    return res


@with_redis
def set_rating_demo_machine_started(r, user_id: int):
    r.set(
        fmt_started.format(user=user_id), datetime.strftime(datetime.now(), time_fmt)
    )


@with_redis
def get_rating_demo_machine_time_left(r, user_id: int) -> timedelta | None:
    now = datetime.now()
    key = fmt_started.format(user=user_id)

    start_time_raw = r.get(key)
    if start_time_raw is None:
        return None

    start_time = datetime.strptime(start_time_raw.decode(), time_fmt)

    return timedelta(seconds=ALLOWED_TIME_SECONDS) - (now - start_time)


def gen_demo_machine_name(user_id: int) -> str:
    return f"rating_demo_user_{user_id}"


def get_machine(user_id: int) -> Tuple[m_rating_demo.RatingDemoTarget | None, m_machine.Machine | None]:
    machine_name = gen_demo_machine_name(user_id)

    target = get_rating_demo_machine_target(user_id)

    return target, machine.get_machine(machine_name)


def start_machine(user_id: int, task_id: int, target_user_id: int):
    machine_name = gen_demo_machine_name(user_id)

    target, mach = get_machine(user_id)
    if target is not None or mach is not None:
        raise ValueError("only one machine allowed")

    task_info = task.get_task_info(task_id)
    if task_info is None:
        raise ValueError("no such task")

    latest_snapshot = snapshot_repo.get_latest_uploaded_snapshot(task_id, target_user_id)
    if latest_snapshot is None:
        raise ValueError("this user does not have snapshots")

    data = m_work.CreateWorkData(
        task_name=task_info.title, image=latest_snapshot.image_path
    )

    machine.create_machine(data, machine_name)

    set_rating_demo_machine_target(user_id, m_rating_demo.RatingDemoTarget(user_id=user_id, task_id=task_id))
    set_rating_demo_machine_started(user_id)


def delete_machine(user_id: int):
    machine_name = gen_demo_machine_name(user_id)

    machine.delete_machine(machine_name)
    del_rating_demo_machine_target(user_id)
