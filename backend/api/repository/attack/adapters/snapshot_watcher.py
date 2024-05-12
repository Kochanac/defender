

from datetime import datetime
from typing import List

from ..db import attack as db_attack


def get_exploit_runs_of_attacks_before_time(task_id: int, snapshot_id: int, time: datetime) -> List[int]:
    return db_attack.get_exploit_runs_of_attacks_before_time(task_id, snapshot_id, time)