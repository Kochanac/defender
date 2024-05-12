import json
import logging
from enum import Enum
from hmac import new
from typing import List

import api.model.checker as m_checker
import api.model.flag as m_flag
from api.misc import with_connection

# CHECK RUN


class CheckerType(str, Enum):
    simple = "simple"


@with_connection
def get_checker_by_task(conn, task_id: int) -> m_checker.Checker | None:
    cur = conn.cursor()

    cur.execute(
        "SELECT id, checker_url FROM checker WHERE task_id=%s",
        [
            task_id,
        ],
    )
    res = cur.fetchone()

    if res is None:
        return None
    else:
        return m_checker.Checker(
            id=int(res[0]), task_id=task_id, checker_url=str(res[1])
        )


@with_connection
def get_checker_by_id(conn, checker_id: int) -> m_checker.Checker | None:
    cur = conn.cursor()

    cur.execute(
        "SELECT task_id, checker_url FROM checker WHERE id=%s",
        [
            checker_id,
        ],
    )
    res = cur.fetchone()

    if res is None:
        return None
    else:
        return m_checker.Checker(
            id=checker_id, task_id=int(res[0]), checker_url=str(res[1])
        )


@with_connection
def create_simple_checker_run(
    conn,
    checker_id: int,
    target_machine_name: str,
    check_variant: m_checker.CheckVariant,
    flag: str | None = None,
    args: List[str] = []
) -> int:
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO checker_run (check_type) VALUES (%s) RETURNING id",
        [
            CheckerType.simple,
        ],
    )
    checker_run_id = cur.fetchone()

    args_raw = json.dumps(args)

    cur.execute(
        "INSERT INTO simple_checker_run (checker_run_id, target_machine_name, checker_id, check_variant, flag, args) VALUES (%s, %s, %s, %s, %s, %s)",
        [checker_run_id, target_machine_name, checker_id, check_variant, flag, args_raw],
    )

    return checker_run_id[0]


@with_connection
def get_checker_run(conn, checker_run: int) -> m_checker.CheckerResults | None:
    cur = conn.cursor()

    cur.execute(
        """
        SELECT result, ok, simple_checker_run.check_variant FROM checker_run 
            JOIN simple_checker_run ON checker_run_id = checker_run.id
        WHERE checker_run.id=%s
    """,
        [
            checker_run,
        ],
    )
    res = cur.fetchone()

    if res is None:
        return None
    else:
        return m_checker.parse_checker_results(res[0], res[1], res[2])


def to_check_variant(x: str) -> m_checker.CheckVariant:
    return m_checker.CheckVariant(x)


@with_connection
def get_simple_checker_run(conn, checker_run: int) -> m_checker.SimpleCheckerRun | None:
    cur = conn.cursor()

    cur.execute(
        "SELECT target_machine_name, checker_id, check_variant, flag, args FROM simple_checker_run WHERE checker_run_id=%s",
        [
            checker_run,
        ],
    )
    res = cur.fetchone()

    if res is None or res[2] is None:
        return None
    else:
        return m_checker.SimpleCheckerRun(
            checker_id=int(res[1]),
            run_id=checker_run,
            target_machine_name=str(res[0]),
            variant=to_check_variant(res[2]),
            flag=res[3], # none works huh?
            args=list(json.loads(str(res[4]))),
        )


@with_connection
def add_checker_result(
    conn,
    checker_run: int,
    new_result: m_checker.VulnCheckerResult | m_checker.NormalCheckerResult,
):
    now = get_checker_run(checker_run)
    if now is None:
        raise ValueError("no checker run")
    assert isinstance(now, m_checker.CheckerResults)

    res = ""

    if isinstance(new_result, m_checker.VulnCheckerResult):
        now.results.append(new_result)
        res = m_checker.serialise_checker_results(now.results)
    else:
        now.results.append(new_result)
        res = '\n'.join([x.comment for x in now.results])

    cur = conn.cursor()
    cur.execute(
        "UPDATE checker_run SET result=%s WHERE id=%s",
        [res, checker_run],
    )


@with_connection
def set_checker_final_ok(conn, checker_run, is_ok: bool):
    cur = conn.cursor()
    cur.execute("UPDATE checker_run SET ok=%s WHERE id=%s", [is_ok, checker_run])


# FIRST STAGE ADAPTER


@with_connection
def set_first_defence_checker_run(conn, user_id: int, task_id: int, run_id: int):
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO first_checker_run (user_id, task_id, run_id) VALUES (%s, %s, %s)",
        [user_id, task_id, run_id],
    )


@with_connection
def get_first_defence_checker_run(conn, user_id: int, task_id: int) -> int | None:
    cur = conn.cursor()

    cur.execute(
        "SELECT run_id FROM first_checker_run WHERE user_id=%s AND task_id=%s ORDER BY id DESC LIMIT 1",
        [user_id, task_id],
    )

    run_id = cur.fetchone()
    if run_id is None:
        return None

    return int(run_id[0])
