from typing import List

import api.model.snapshot as m_snapshot

from ..db import snapshot as db_snapshot


def get_latest_snapshots_by_user(task_id: int) -> List[m_snapshot.Snapshot]:
    return db_snapshot.get_latest_snapshots_by_user(task_id)
