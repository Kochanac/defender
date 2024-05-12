from typing import List

import api.model.snapshot as m_snapshot
import cachetools.func

from ..db import snapshot as db_snapshot

TTL = 10


@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_snapshosts_of_user(user_id: int, task_id: int) -> List[m_snapshot.Snapshot]:
    return db_snapshot.get_snapshosts_of_user(user_id, task_id)


@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_rating_snapshots_in_task(task_id: int) -> List[m_snapshot.Snapshot]:
    return db_snapshot.get_rating_snapshots_in_task(task_id)


@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_active_snapshots_in_task(task_id: int) -> List[m_snapshot.Snapshot]:
    return db_snapshot.get_active_snapshots_in_task(task_id)
