


# todo add limit and offset -> do pagination
from typing import List

import api.model.snapshot as m_snapshot


def get_alive_snapshots() -> List[m_snapshot.Snapshot]:
    ...

def create_snapshot(task_id: int, user_id: int, image_path: str):
    ...


