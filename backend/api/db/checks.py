import json
from subprocess import run

from pydantic import with_config

from backend.api.misc import with_connection
from enum import Enum

import backend.api.model.checker as m_checker


# CHECK RUN

class CheckerType(str, Enum):
	simple = "simple"


@with_connection
def get_checker_by_task(conn, task_id: int) -> m_checker.Checker | None:
    cur = conn.cursor()

    cur.execute("SELECT id, checker_url FROM checker_run WHERE task_id=%s", [task_id, ])
    res = cur.fetchone()

    if res is None:
        return None
    else:
        return m_checker.Checker(
            id=int(res[0]),
            task_id=task_id,
            checker_url=str(res[1])
        )
    

@with_connection
def get_checker_by_id(conn, checker_id: int) -> m_checker.Checker | None:
    cur = conn.cursor()

    cur.execute("SELECT task_id, checker_url FROM checker_run WHERE checker_id=%s", [checker_id, ])
    res = cur.fetchone()

    if res is None:
        return None
    else:
        return m_checker.Checker(
            id=checker_id,
            task_id=int(res[0]),
            checker_url=str(res[1])
        )



@with_connection
def create_simple_checker_run(conn, checker_id: int, target_machine_name: str) -> int:
    cur = conn.cursor()

    cur.execute("INSERT INTO checker_run (check_type) VALUES (%s) RETURNING id", [CheckerType.simple, ])
    checker_run_id = cur.fetchone()

    cur.execute(
        "INSERT INTO simple_checker_run (checker_run_id, target_machine_name, checker_id) VALUES (%s, %s, %s)",
        [checker_run_id, target_machine_name, checker_id]
    )

    return checker_run_id


def parse_checker_results(x: str, is_ok) -> m_checker.CheckerResults:
    res_json = json.loads(x)
    results = []
    for r in res_json:
        results.append(m_checker.CheckerResult.model_validate_json(json.dumps(r)))

    is_ok_res = None
    if is_ok is not None:
        is_ok_res = bool(is_ok)

    return m_checker.CheckerResults(
        results=results,
        ok=is_ok_res
    )


@with_connection
def get_checker_run(conn, checker_run: int) -> m_checker.CheckerResults | None:
    cur = conn.cursor()

    cur.execute("SELECT result, ok FROM checker_run WHERE id=%s", [checker_run, ])
    res = cur.fetchone()

    if res is None:
        return None
    else:
        return parse_checker_results(res[0], res[1])


@with_connection
def get_simple_checker_run(conn, checker_run: int) -> m_checker.SimpleCheckerRun | None:
    cur = conn.cursor()

    cur.execute("SELECT target_machine_name, checker_id FROM simple_checker_run WHERE checker_run_id=%s", [checker_run, ])
    res = cur.fetchone()

    if res is None:
        return None
    else:
        return m_checker.SimpleCheckerRun(
            checker_id=int(res[1]),
            run_id=checker_run,
            target_machine_name=str(res[0])
        )

@with_connection
def add_checker_result(conn, checker_run: int, new_result: m_checker.CheckerResult):
    now = get_checker_run(checker_run)
    if now is None:
        raise ValueError("no checker run")
    assert isinstance(now, m_checker.CheckerResults)

    now.results.append(new_result)

    cur = conn.cursor()
    cur.execute(
        "UPDATE checker_run SET result=%s WHERE id=%s",
        [json.dumps(now.results), checker_run]
    )

@with_connection
def set_checker_final_ok(conn, checker_run, is_ok: bool):
    cur = conn.cursor()
    cur.execute(
        "UPDATE checker_run SET ok=%s WHERE id=%s",
        [is_ok, checker_run]
    )
    

# FIRST STAGE ADAPTER

@with_connection
def set_first_defence_checker_run(conn, user_id: int, task_id: int, run_id: int):
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO first_checker_run user_id, task_id, run_id VALUES (%s, %s, %s)",
        [user_id, task_id, run_id]
    )


@with_connection
def get_first_defence_checker_run(conn, user_id: int, task_id: int) -> int | None:
    cur = conn.cursor()

    cur.execute(
        "SELECT run_id FROM first_checker_run WHERE user_id=%s AND task_id=%s", 
        [user_id, task_id]
    )

    run_id = cur.fetchone()
    if run_id is None:
        return None   
        
    return int(run_id)


