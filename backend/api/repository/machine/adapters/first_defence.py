
import api.repository.task.tasks as task
from api.model import machine as m_machine
from api.model import work as m_work

from .. import machine


def remove_first_defence_machine(user_id: int, task_id: int):
	machine_name = gen_first_machine_name(user_id, task_id)

	machine.delete_machine(machine_name)


def start_first_defence_machine(user_id: int, task_id: int):
	machine_name = gen_first_machine_name(user_id, task_id)

	machine.start_machine(machine_name)


def stop_first_defence_machine(user_id: int, task_id: int):
	machine_name = gen_first_machine_name(user_id, task_id)

	machine.stop_machine(machine_name)


def create_first_defence_machine(user_id: int, task_id: int):
	# insert info first_defences, work
	machine_name = gen_first_machine_name(user_id, task_id)

	task_info = task.get_task_info(task_id)
	if task_info is None:
		raise ValueError('no such task')


	data = m_work.CreateWorkData(task_name=task_info.title, image=task_info.image_path)

	machine.create_machine(data, machine_name)


def get_first_defence_machine(user_id: int, task_id: int) -> m_machine.Machine | None:
	# 1) get first defence machine name
	machine_name = gen_first_machine_name(user_id, task_id)
	
	return machine.get_machine(machine_name)


def gen_first_machine_name(user_id: int, task_id: int) -> str:
	return f"first_user_{user_id}_task_{task_id}"
