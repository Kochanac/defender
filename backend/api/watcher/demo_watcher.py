import asyncio
import datetime
import logging

import api.model.checker as m_checker
import api.model.machine as m_machine
import api.model.task as m_task
import api.repository.checker.adapters.demo_service as demo_checker
import api.repository.machine.adapters.demo as demo_machine
import api.repository.task.db.tasks as db_tasks
import api.repository.task.demo_status as demo_status
from api.misc import with_redis

WATCHER_EVERY_X_SECONDS = 5
CHECK_EVERY_X_MINUTES = 1


fmt = "last_checker_run_time/task_id:{task_id}"
time_fmt = "%Y-%m-%d %H:%M:%S"


@with_redis
def get_last_checker_run_time(r, task_id: int) -> datetime.datetime | None:
    time_str = r.get(fmt.format(task_id=task_id))
    if time_str is None:
        return None

    return datetime.datetime.strptime(time_str.decode(), time_fmt)


@with_redis
def set_last_checker_run_time(r, task_id: int, time: datetime.datetime):
    r.set(fmt.format(task_id=task_id), datetime.datetime.strftime(time, time_fmt))


def handle_no_machine(task_id: int):
    demo_status.set_demo_status(task_id, db_tasks.m_task.TaskDemoState.fail)
    demo_machine.start_machine(task_id)


def handle_ok_machine(task_id: int, mach: m_machine.Machine):
    last_checks = demo_checker.check_results(task_id)

    machine_status_ok = False
    not_null_checks = 0
    for i, check in enumerate(last_checks):
        logging.info(f"check {i}: {check}")
        check_status, check_result = check
        if (
            check_status == m_checker.CheckStatus.checked
            and check_result is not None
            and check_result.ok
        ):
            machine_status_ok = True
        if check_status is not None or check_result is not None:
            not_null_checks += 1

    if machine_status_ok:
        demo_status.set_demo_status(task_id, m_task.TaskDemoState.ok)
    else:
        demo_status.set_demo_status(task_id, m_task.TaskDemoState.fail)

    if not machine_status_ok and not_null_checks == len(last_checks):
        demo_checker.reset_checker_results(task_id)
        demo_machine.delete_machine(task_id)

    # if last check is missing or is done, and if CHECK_EVERY_X_MINUTES time passed, run new check
    if (
        len(last_checks) == 0
        or last_checks[0][0] is None
        or last_checks[0][0] == m_checker.CheckStatus.checked
    ):
        last_run_time = get_last_checker_run_time(task_id)
        if (
            last_run_time is None
            or datetime.datetime.now() - last_run_time
            > datetime.timedelta(minutes=CHECK_EVERY_X_MINUTES)
        ):
            demo_checker.check_start(task_id)
            set_last_checker_run_time(task_id, datetime.datetime.now())


async def ensure_all_tasks_have_demo_machines():
    logging.basicConfig(level=logging.INFO)

    tasks = db_tasks.get_task_ids()

    for task_id in tasks:
        logging.info(f"handling task {task_id}")
        mach = demo_machine.get_machine(task_id)

        if mach is None:
            logging.info("No machine, creating new")
            handle_no_machine(task_id)
            continue

        if mach.state in [
            m_machine.MachineState.starting,
            m_machine.MachineState.removing,
            m_machine.MachineState.turning_off,
        ]:
            logging.info(f"Machine is in progress, ignoring. state {mach.state}")
            continue

        if mach.state == m_machine.MachineState.off:
            logging.info("Machine is off, deleting")
            demo_machine.delete_machine(task_id)
            continue

        if mach.state == m_machine.MachineState.on:
            logging.info("Machine is UP")
            handle_ok_machine(task_id, mach)
            continue

        assert False

    logging.info("exiting")


async def scheduler():
    while True:
        await ensure_all_tasks_have_demo_machines()
        await asyncio.sleep(WATCHER_EVERY_X_SECONDS)


async def main():
    task = asyncio.create_task(scheduler())
    await task
