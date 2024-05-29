from typing import List

import api.model.checker as m_checker
import api.model.machine as m_machine
import api.model.task as m_task
import api.redis as redis
import api.repository.checker.db.checks as db_checks
import tasks.tasks as tasks


def create_check(
    task: m_task.TaskInfo,
    machine: m_machine.Machine,
    variant: m_checker.CheckVariant,
    flag: str | None = None,
    args: List[str] = [],
) -> m_checker.CheckerRun:
    checker = db_checks.get_checker_by_task(task.id)
    if checker is None:
        raise ValueError("No checker for this task")

    checker_run_id = db_checks.create_simple_checker_run(
        checker.id, machine.name, variant, flag, args
    )

    return m_checker.CheckerRun(run_id=checker_run_id)


def run_check(check: m_checker.CheckerRun):
    # call celery task -> save it's id

    task = tasks.simple_checker.delay(check.run_id)
    task_id = task.id

    redis.set_checker_run_celery_task(check.run_id, task_id)


def check_result(
    checker_run: m_checker.CheckerRun,
) -> tuple[m_checker.CheckStatus | None, m_checker.CheckerResults | None]:
    checker_result = db_checks.get_checker_run(checker_run.run_id)

    task_id = redis.get_checker_run_celery_task(checker_run.run_id)
    if task_id is None:
        return None, checker_result

    celery_status = tasks.simple_checker.AsyncResult(task_id)

    status = None
    print(f"{celery_status=} {celery_status.status}")
    if celery_status.status in ["STARTED", "PENDING"]:
        status = m_checker.CheckStatus.in_progress
    elif celery_status.status == "SUCCESS":
        status = m_checker.CheckStatus.checked

    return (status, checker_result)
