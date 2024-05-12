import datetime
from enum import Enum

from pydantic import BaseModel


class AttackState(str, Enum):
    active = "active"
    dead = "dead"


class Attack(BaseModel):
    id: int
    task_id: int
    user_id: int

    name: str
    exploit_id: int

    state: AttackState | None

    created_at: datetime.datetime
