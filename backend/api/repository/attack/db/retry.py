
from typing import List

from api.misc import with_connection

from .attack import cols, convert_one


@with_connection
def get_tasks_to_retry(conn) -> List[int]:
    cur = conn.cursor()

    cur.execute(
        """SELECT task_id
           FROM retry_tasks
           WHERE do_retry
           ORDER BY id ASC""",
    )

    res = cur.fetchall()
    res = [int(x[0]) for x in res]

    return res


@with_connection
def inc_attack_attempts(conn, attack_id: int, snapshot_id: int):
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO retry_attacks (attack_id, snapshot_id, attempt) VALUES (%(a_id)s, %(s_id)s, 1)
        ON CONFLICT (attack_id, snapshot_id) DO UPDATE SET attempt = retry_attacks.attempt + 1
        """,
        {"a_id": attack_id, "s_id": snapshot_id}
    )


# attack_id, snapshot_id, attempt
@with_connection
def get_retry_status(conn, attack_ids: List[int], limit_attempts: int) -> List:
    cur = conn.cursor()

    cur.execute(
        """
        SELECT attack_exploits.attack_id, attack_exploits.snapshot_id, retry_attacks.attempt
        FROM attack_exploits
        LEFT JOIN retry_attacks ON retry_attacks.attack_id=attack_exploits.attack_id
        WHERE 
            attack_exploits.attack_id = ANY (%s) AND
            coalesce(attempt, 0) <= %s
        """, [attack_ids, limit_attempts]
    )

    res = [
        [int(x[0]), int(x[1]), 0 if x[2] is None else int(x[2])]
        for x in cur.fetchall()
    ]

    return res

