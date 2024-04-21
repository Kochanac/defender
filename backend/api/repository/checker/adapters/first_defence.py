import api.db.users as db
import api.model.checker as m_checker
import api.repository.checker.db.checks as db_checks
import api.repository.checker.simple as simple_checker
import api.repository.machine.adapters.first_defence as first_defence
import api.repository.task.tasks as tasks


def check_start(user_id: int, task_id: int):
    mach = first_defence.get_first_defence_machine(user_id, task_id)
    if mach is None:
        raise ValueError("No machine for this task for this user")

    task = tasks.get_task_info(task_id)
    if task is None:
        raise ValueError("No such task")

    check = simple_checker.create_check(task, mach, m_checker.CheckVariant.vulns)

    db_checks.set_first_defence_checker_run(user_id, task_id, check.run_id)

    simple_checker.run_check(check)


def check_result(task_id: int, user_id: int) -> tuple[m_checker.CheckStatus | None, m_checker.CheckerResults | None]:
    run_id = db_checks.get_first_defence_checker_run(user_id, task_id)

    if run_id is None:
        return None, None

    return simple_checker.check_result(m_checker.CheckerRun(run_id=run_id))
