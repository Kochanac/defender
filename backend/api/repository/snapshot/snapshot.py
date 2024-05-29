


# todo add limit and offset -> do pagination
import logging
from typing import List

import api.model.snapshot as m_snapshot
import cachetools.func

from .db import snapshot as db


def get_alive_snapshots() -> List[m_snapshot.Snapshot]:
    return db.get_alive_snapshots()

def create_snapshot(task_id: int, user_id: int, image_path: str, name: str):
    db.create_snapshot(task_id, user_id, image_path, name)

def change_state(snapshot_id: int, new_state: m_snapshot.SnapshotState):
    logging.info(f"CHANGE STATE {snapshot_id} -> {new_state=}")
    snap = db.get_snapshot(snapshot_id)
    if snap is None:
        raise ValueError("non-existant snapshot")

    if new_state == m_snapshot.SnapshotState.active:
        active_now = db.get_active_snapshot(snap.task_id, snap.user_id)
        if active_now is not None and active_now.id == snapshot_id:
            return
    
        if active_now is not None:
            db.change_state(active_now.id, m_snapshot.SnapshotState.dead)
    db.change_state(snapshot_id, new_state)

def delete(snapshot_id: int):
    db.change_state(snapshot_id, m_snapshot.SnapshotState.dead)

def get_active_snapshot(task_id: int, user_id: int) -> m_snapshot.Snapshot | None:
    return db.get_active_snapshot(task_id, user_id)

def get_latest_snapshot(task_id: int, user_id: int) -> m_snapshot.Snapshot | None:
    return db.get_latest_snapshot(task_id, user_id)

def get_latest_uploaded_snapshot(task_id: int, user_id: int) -> m_snapshot.Snapshot | None:
    return db.get_latest_uploaded_snapshot(task_id, user_id)

TTL = 10

@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_snapshot(id: int) -> m_snapshot.Snapshot | None:
    return db.get_snapshot(id)

