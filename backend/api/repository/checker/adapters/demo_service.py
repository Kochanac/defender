from typing import List

import api.model.checker as m_checker
import api.repository.machine.adapters.demo as demo_machine
import api.repository.task.tasks as tasks
from api.misc import with_redis

from .. import simple as simple_checker

CHECKER_RUNS_STORE_COUNT = 5

fmt = "demo_service_checker_runs/task:{task_id}"

@with_redis
def add_checker_run(r, task_id:int, run:m_checker.CheckerRun):
    r.lpush(fmt.format(task_id=task_id), run.run_id)
    r.ltrim(fmt.format(task_id=task_id), 0, CHECKER_RUNS_STORE_COUNT)


@with_redis
def get_checker_runs(r, task_id) -> List[m_checker.CheckerRun]:
    runs = r.lrange(fmt.format(task_id=task_id), 0, -1)
    if runs is None:
        return []

    res = []
    for run in runs:
        res.append(m_checker.CheckerRun(run_id=int(run.decode())))

    return res

@with_redis
def reset_checker_results(r, task_id):
    r.ltrim(fmt.format(task_id=task_id), 0, 0)


def check_start(task_id: int):
    mach = demo_machine.get_machine(task_id)
    if mach is None:
        raise ValueError("machine is None")

    task = tasks.get_task_info(task_id)
    if task is None:
        raise ValueError("No such task")

    check = simple_checker.create_check(task, mach, m_checker.CheckVariant.health)
    add_checker_run(task_id, check)
    simple_checker.run_check(check)
    
    # todo now we just assume it works. in reality we need to check it by GET, and check that they all complete successfully
    put = simple_checker.create_check(task, mach, m_checker.CheckVariant.put)
    simple_checker.run_check(put)


def check_results(
    task_id: int,
) -> List[tuple[m_checker.CheckStatus | None, m_checker.CheckerResults | None]]:
    checker_runs = get_checker_runs(task_id)
    print(checker_runs)

    checker_results = []

    for i in range(CHECKER_RUNS_STORE_COUNT):
        if i >= len(checker_runs):
            checker_results.append((None, None))
            continue

        status, res = simple_checker.check_result(checker_runs[i])
        checker_results.append((status, res))

    return checker_results
