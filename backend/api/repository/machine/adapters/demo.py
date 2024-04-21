
import api.model.machine as m_machine
import api.model.work as m_work
import api.repository.task.tasks as task

from .. import machine


def gen_demo_machine_name(task_id: int) -> str:
	return f"demo_task_{task_id}"

def get_machine(task_id: int) -> m_machine.Machine | None:
	machine_name = gen_demo_machine_name(task_id)

	return machine.get_machine(machine_name)


def start_machine(task_id: int):
    machine_name = gen_demo_machine_name(task_id)

    task_info = task.get_task_info(task_id)
    if task_info is None:
        raise ValueError("no such task")

    data = m_work.CreateWorkData(task_name=task_info.title, image=task_info.image_path)

    machine.create_machine(data, machine_name)


def delete_machine(task_id: int):
    machine_name = gen_demo_machine_name(task_id)

    machine.delete_machine(machine_name)

