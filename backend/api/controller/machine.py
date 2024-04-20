from pydantic import BaseModel
import api.model.machine as m_machine
import api.model.work as m_work
import api.db.work as db_work
import api.db.db as db
import api.db.machine_assignment as db_machine_assignment

import requests 

class WorkerInfo(BaseModel):
	ip: str
	task_name: str
	is_running: bool

def get_worker_info(worker_hostname: str, machine_name: str) -> WorkerInfo | None:
	try:
		res = requests.get(f"http://{worker_hostname}:20768/vm-info", json={"vm_name": machine_name}).text
		return WorkerInfo.model_validate_json(res)
	except Exception:
		return None

def convert_state(work: m_work.Work, work_result: bool | None, worker_info: WorkerInfo | None) -> m_machine.MachineState | None:
	print(work, work_result, worker_info)

	if work.work_type == m_work.WorkType.create or work.work_type == m_work.WorkType.start:
		if work_result and worker_info is not None and worker_info.is_running:
			return m_machine.MachineState.on

		return m_machine.MachineState.starting

	if work.work_type == m_work.WorkType.stop:
		if work_result and worker_info is not None and not worker_info.is_running:
			return m_machine.MachineState.off

		return m_machine.MachineState.turning_off

	if work.work_type == m_work.WorkType.remove and worker_info is not None:
		return m_machine.MachineState.removing

	return None


def get_machine(machine_name: str) -> m_machine.Machine | None:
	# 1) get info about work queue
	# 2) get info from worker

	work_info = db_work.get_last_by_machine_name(machine_name)

	assignment = db_machine_assignment.get_machine_assignment(machine_name)
	if assignment is None:
		return None

	worker_info = get_worker_info(assignment.worker_hostname, machine_name)

	if work_info is None:
		return None

	work: m_work.Work = work_info[0]
	work_result: bool | None = work_info[1]

	state = convert_state(work, work_result, worker_info)

	if state is None:
		return None

	ip = None
	if worker_info is not None:
		ip = worker_info.ip

	return m_machine.Machine(name=machine_name, state=state, hostname=ip)


# TODO то что ниже кажется может называться "Адаптером" и можно это вынести в другой файл

def gen_first_machine_name(user_id: int, task_id: int) -> str:
	return f"first_user_{user_id}_task_{task_id}"

def get_first_defence_machine(user_id: int, task_id: int) -> m_machine.Machine | None:
	# 1) get first defence machine name

	machine_name = gen_first_machine_name(user_id, task_id)
	print(machine_name)
	return get_machine(machine_name)


def create_first_defence_machine(user_id: int, task_id: int):
	# insert info first_defences, work
	machine_name = gen_first_machine_name(user_id, task_id)

	task_info = db.get_task_info(task_id)
	data = m_work.CreateWorkData(task_name=task_info.title, image=task_info.image_path).model_dump_json()

	db_work.start_work(db_work.StartWork(data=data, work_type=m_work.WorkType.create, machine_name=machine_name))


def stop_first_defence_machine(user_id: int, task_id: int):
	machine_name = gen_first_machine_name(user_id, task_id)

	db_work.start_work(db_work.StartWork(data=None, work_type=m_work.WorkType.stop, machine_name=machine_name))


def start_first_defence_machine(user_id: int, task_id: int):
	machine_name = gen_first_machine_name(user_id, task_id)

	db_work.start_work(db_work.StartWork(data=None, work_type=m_work.WorkType.start, machine_name=machine_name))

def remove_first_defence_machine(user_id: int, task_id: int):
	machine_name = gen_first_machine_name(user_id, task_id)

	db_work.start_work(db_work.StartWork(data=None, work_type=m_work.WorkType.remove, machine_name=machine_name))



