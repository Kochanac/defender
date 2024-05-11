from enum import Enum

from pydantic import BaseModel


class SnapshotState(str, Enum):
    creating = "creating"
    checking = "checking"
    active = "active"
    dead = "dead"  # Перестал быть активным. Терминальное состояние


class Snapshot(BaseModel):
    id: int
    task_id: int
    user_id: int
    image_path: str

    state: SnapshotState | None
