import datetime
from typing import List, Tuple

import api.model.attack as m_attack
from api.misc import with_connection

cols = "id, task_id, user_id, name, exploit_id, state, created_at"


def convert_one(row) -> m_attack.Attack | None:
    if row is None:
        return None

    state = row[5]
    if state is not None:
        state = m_attack.AttackState(state)

    return m_attack.Attack(
        id=int(row[0]),
        task_id=int(row[1]),
        user_id=int(row[2]),
        name=str(row[3]),
        exploit_id=int(row[4]),
        state=state,
        created_at=row[6],
    )


@with_connection
def get_active_attacks(conn) -> List[m_attack.Attack]:
    cur = conn.cursor()
    cur.execute(
        f"""SELECT {cols}
           FROM attack
           WHERE state = 'active' or state is null 
           ORDER BY id ASC"""
    )

    res = cur.fetchall()

    r = [convert_one(row) for row in res]
    return [x for x in r if x is not None]


@with_connection
def get_attack(conn, attack_id) -> m_attack.Attack | None:
    cur = conn.cursor()
    cur.execute(
        f"""SELECT {cols}
           FROM attack
           WHERE id=%s
           ORDER BY id ASC""",
        [attack_id],
    )

    res = cur.fetchone()

    return convert_one(res)


@with_connection
def change_state(conn, attack_id: int, state: m_attack.AttackState):
    cur = conn.cursor()
    cur.execute(
        "UPDATE attack SET state=%s WHERE id=%s",
        [state.value, attack_id],
    )


@with_connection
def get_active_attacks_of_this_user(
    conn, user_id: int, task_id: int
) -> List[m_attack.Attack]:
    cur = conn.cursor()
    cur.execute(
        f"""SELECT {cols}
           FROM attack
           WHERE task_id=%s AND user_id = %s AND state = 'active' OR state is null
           ORDER BY id ASC""",
        [task_id, user_id],
    )

    res = cur.fetchall()

    r = [convert_one(row) for row in res]
    return [x for x in r if x is not None]

@with_connection
def get_attacks_of_this_user(
    conn, user_id: int, task_id: int
) -> List[m_attack.Attack]:
    cur = conn.cursor()
    cur.execute(
        f"""SELECT {cols}
           FROM attack
           WHERE task_id=%s AND user_id = %s
           ORDER BY id ASC""",
        [task_id, user_id],
    )

    res = cur.fetchall()

    r = [convert_one(row) for row in res]
    return [x for x in r if x is not None]

@with_connection
def get_active_attacks_of_task(
    conn, task_id: int
) -> List[m_attack.Attack]:
    cur = conn.cursor()
    cur.execute(
        f"""SELECT {cols}
           FROM attack
           WHERE task_id=%s AND state = 'active' OR state is null
           ORDER BY id ASC""",
        [task_id],
    )

    res = cur.fetchall()

    r = [convert_one(row) for row in res]
    return [x for x in r if x is not None]


@with_connection
def create_attack(conn, user_id: int, task_id: int, exploit_id: int, name: str):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO attack (task_id, user_id, exploit_id, name) VALUES (%s, %s, %s, %s)",
        [task_id, user_id, exploit_id, name],
    )


@with_connection
def get_attack_exploits(conn, attack_id: int) -> List[Tuple[int, int]]:
    cur = conn.cursor()
    cur.execute(
        """SELECT snapshot_id, exploit_run_id FROM attack_exploits WHERE attack_id = %s""",
        [attack_id],
    )

    res = cur.fetchall()

    if res is None:
        return []

    return [(int(x[0]), int(x[1])) for x in res]


@with_connection
def add_attack_exploit(conn, attack_id: int, snapshot_id: int, exploit_run_id: int):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO attack_exploits (attack_id, snapshot_id, exploit_run_id) VALUES (%s, %s, %s)",
        [attack_id, snapshot_id, exploit_run_id],
    )


@with_connection
def get_exploit_runs_of_attacks_before_time(
    conn, task_id: int, snapshot_id: int, time: datetime.datetime
) -> List[int]:
    cur = conn.cursor()
    cur.execute(
        """
            SELECT exploit_run_id
            FROM attack_exploits
            JOIN attack ON attack.id = attack_id
            WHERE snapshot_id = %s AND attack.task_id = %s AND attack.created_at < %s
        """,
        [snapshot_id, task_id, time],
    )

    res = cur.fetchall()

    if res is None:
        return []

    return [int(x[0]) for x in res]


@with_connection
def get_attack_exploits_for_snapshots(
    conn, attack_id: int, snapshot_ids: List[int]
) -> List[Tuple[int, int]]:
    cur = conn.cursor()
    cur.execute(
        """SELECT snapshot_id, exploit_run_id FROM attack_exploits WHERE attack_id = %s AND snapshot_id = ANY (%s)""",
        [attack_id, snapshot_ids],
    )

    res = cur.fetchall()

    if res is None:
        return []

    return [(int(x[0]), int(x[1])) for x in res]


@with_connection
def get_exploits_by_snapshot(
    conn, snap_id: int, attack_ids: List[int]
) -> List[Tuple[int, int]]:
    cur = conn.cursor()
    cur.execute(
        """SELECT attack_id, exploit_run_id FROM attack_exploits WHERE snapshot_id = %s AND attack_id = ANY (%s)""",
        [snap_id, attack_ids],
    )

    res = cur.fetchall()

    if res is None:
        return []

    return [(int(x[0]), int(x[1])) for x in res]
