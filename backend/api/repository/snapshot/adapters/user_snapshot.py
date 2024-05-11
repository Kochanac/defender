
from secrets import token_hex

import api.repository.task.tasks as task

from .. import snapshot


def create_image_name(task_id: int, user_id: int) -> str:
    t = task.get_task_info(task_id)
    assert t is not None

    return t.image_path + f"-snapshots/user-{user_id}-snapshot-{token_hex(8)}"

def create_snapshot(task_id: int, user_id: int, name: str):
    image_name = create_image_name(task_id, user_id)

    snapshot.create_snapshot(task_id, user_id, image_name, name)

