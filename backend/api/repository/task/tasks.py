

import api.model.task as m_task
import api.repository.machine.adapters.demo as demo_machine

from . import demo_status
from .db import tasks as db_tasks


def get_task_info(task_id: int) -> m_task.TaskInfo | None:
    task_info = db_tasks.get_task_info(task_id)
    if task_info is None:
        return None

    task_demo = m_task.TaskDemo(state=m_task.TaskDemoState.fail, url=None)
    demo_st = demo_status.get_demo_status(task_id)

    print(demo_st)
    if demo_st  == m_task.TaskDemoState.ok:
        mach = demo_machine.get_machine(task_id)
        if mach is not None:
            demo_url = task_info.service_demo.format(host=mach.hostname)

            task_demo = m_task.TaskDemo(
                state=demo_st,
                url=demo_url
            )

    return  m_task.TaskInfo(
        download_url=task_info.download_url,
        exploit_example=task_info.exploit_example,
        flag=task_info.flag,
        id=task_info.id,
        image_path=task_info.image_path,
        service_demo=task_demo,
        title=task_info.title
    )



def format_task_url(task_id, hostname: str):
    task_info = db_tasks.get_task_info(task_id)
    if task_info is None:
        raise ValueError("no such task")

    return task_info.service_demo.format(host=hostname)