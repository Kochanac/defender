from typing import List

import api.model.snapshot as m_snapshot
from api.misc import with_connection

cols = "id, task_id, user_id, image_path, state, name, created_at"


def convert_one(row) -> m_snapshot.Snapshot | None:
    if row is None:
        return None

    if len(row) != 7:
        return None

    state = row[4]
    state = m_snapshot.SnapshotState(state) if state is not None else None
    return m_snapshot.Snapshot(
        id=int(row[0]),
        task_id=int(row[1]),
        user_id=int(row[2]),
        state=state,
        image_path=str(row[3]),
        name=row[5],
        created_at=row[6],
    )


@with_connection
def get_alive_snapshots(conn) -> List[m_snapshot.Snapshot]:
    cur = conn.cursor()
    cur.execute(
        f"""SELECT {cols}
           FROM snapshot
           WHERE state != 'dead' or state is null 
           ORDER BY id ASC"""
    )

    res = cur.fetchall()

    r = [convert_one(row) for row in res]
    return [x for x in r if x is not None]


@with_connection
def create_snapshot(conn, task_id: int, user_id: int, image_path: str, name: str):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO snapshot (task_id, user_id, image_path, name) VALUES (%s, %s, %s, %s)",
        [task_id, user_id, image_path, name],
    )


@with_connection
def change_state(conn, snapshot_id: int, state: m_snapshot.SnapshotState):
    cur = conn.cursor()
    cur.execute(
        "UPDATE snapshot SET state=%s WHERE id=%s",
        [state.value, snapshot_id],
    )


@with_connection
def delete_snapshot(conn, snapshot_id: int):
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM snapshot WHERE id=%s",
        [
            snapshot_id,
        ],
    )


@with_connection
def get_active_snapshot(conn, task_id, user_id) -> m_snapshot.Snapshot | None:
    cur = conn.cursor()
    cur.execute(
        f"""SELECT {cols}
           FROM snapshot
           WHERE task_id=%s and user_id=%s AND state = 'active'
           ORDER BY id DESC LIMIT 1""",
        [task_id, user_id],
    )

    res = cur.fetchone()
    return convert_one(res)


@with_connection
def get_latest_snapshot(conn, task_id, user_id) -> m_snapshot.Snapshot | None:
    cur = conn.cursor()
    cur.execute(
        f"""SELECT {cols}
           FROM snapshot
           WHERE task_id=%s AND user_id=%s AND state != 'dead' OR state is null
           ORDER BY id DESC LIMIT 1""",
        [task_id, user_id],
    )

    res = cur.fetchone()

    return convert_one(res)


@with_connection
def get_snapshot(conn, id) -> m_snapshot.Snapshot | None:
    cur = conn.cursor()
    cur.execute(
        f"""SELECT {cols}
           FROM snapshot
           WHERE id=%s
           LIMIT 1""",
        [id],
    )

    res = cur.fetchone()
    return convert_one(res)


@with_connection
def get_latest_snapshots_by_user(conn, task_id: int) -> List[m_snapshot.Snapshot]:
    cur = conn.cursor()
    cur.execute(
        f"""SELECT {cols}
           FROM snapshot
           WHERE id in (
               SELECT MAX(id) FROM snapshot
               WHERE task_id=%s
               GROUP BY user_id
           )
           ORDER BY id ASC""",
        [task_id],
    )

    res = cur.fetchall()

    r = [convert_one(row) for row in res]
    return [x for x in r if x is not None]
