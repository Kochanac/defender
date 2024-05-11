
import logging
from typing import Tuple

import api.repository.task.tasks as task
from api.model import machine as m_machine
from api.model import work as m_work

from .. import machine
from ..db import work as db_work


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


def upload_image(user_id: int, task_id: int, image_name: str):
	machine_name = gen_first_machine_name(user_id, task_id)

	return machine.upload_image(m_work.UploadImageWorkData(image_name=image_name), machine_name)


# -> (is_in_progress, is_result_ok)
def upload_status(user_id: int, task_id: int, image_name: str) -> Tuple[bool, bool]:
	machine_name = gen_first_machine_name(user_id, task_id)

	res = db_work.get_last_status_by_machine_name(machine_name, [m_work.WorkType.upload_image])
	logging.info(res)
	if res is None:
		return False, False

	status, res = res[0], res[1]

	if status.data != m_work.UploadImageWorkData(image_name=image_name).model_dump_json():
		return False, False

	if res is None:
		return True, False
	else:
		return False, res







