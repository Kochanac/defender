
import api.db.db as db
import api.db.checks as db_checks

import api.controller.checker.simple as simple_checker
import api.controller.machine as machine

import api.model.checker as m_checker


def check_start(user_id: int, task_id: int):
    mach = machine.get_first_defence_machine(user_id, task_id)
    if mach is None:
        raise ValueError("No machine for this task for this user")

    task = db.get_task_info(task_id)

    check = simple_checker.create_check(task, mach)

    db_checks.set_first_defence_checker_run(user_id, task_id, check.run_id)

    simple_checker.run_check(check)


def check_result(task_id: int, user_id: int) -> tuple[m_checker.CheckStatus | None, m_checker.CheckerResults | None]:
    run_id = db_checks.get_first_defence_checker_run(user_id, task_id)

    if run_id is None:
        return None, None

    return simple_checker.check_result(m_checker.CheckerRun(run_id=run_id))
