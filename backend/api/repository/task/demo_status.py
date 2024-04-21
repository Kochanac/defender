import logging
from datetime import timedelta

import api.model.task as m_task
from api.misc import with_redis

DEMO_STATE_EXPIRE_MINUTES = 10

fmt = "task_demo_state/task_id:{task_id}"

@with_redis
def set_demo_status(r, task_id: int, state: m_task.TaskDemoState):
    logging.info(f"setting status of task {task_id=} to {state}")
    r.setex(fmt.format(task_id=task_id), timedelta(minutes=DEMO_STATE_EXPIRE_MINUTES), str(state))
    pass


@with_redis
def get_demo_status(r, task_id: int) -> m_task.TaskDemoState:
    status = r.get(fmt.format(task_id=task_id))

    if status is None:
        return m_task.TaskDemoState.fail

    if status.decode() == str(m_task.TaskDemoState.ok):
        return m_task.TaskDemoState.ok

    return m_task.TaskDemoState.fail
