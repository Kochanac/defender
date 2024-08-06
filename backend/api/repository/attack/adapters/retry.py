
from typing import List

from pydantic import BaseModel

from ..db import retry as db


def get_tasks_to_retry() -> List[int]:
    return db.get_tasks_to_retry()


class RetryAttack(BaseModel):
    attack_id: int
    snapshot_id: int
    attempt: int

def get_retry_status(attack_ids: List[int], attempt_limit: int) -> List[RetryAttack]:
    statuses = db.get_retry_status(attack_ids, attempt_limit)
    return [
        RetryAttack(attack_id=s[0], snapshot_id=s[1], attempt=s[2])
        for s in statuses
    ]

# def get_retry_status_single(attack_id: int, snapshot_id: int) -> RetryAttack:
#     ...

def inc_attack_attempts(attack_id: int, snapshot_id: int):
    db.inc_attack_attempts(attack_id, snapshot_id)