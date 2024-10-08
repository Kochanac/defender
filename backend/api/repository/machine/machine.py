import api.model.machine as m_machine
import api.model.work as m_work
import api.repository.machine.db.machine_assignment as db_machine_assignment
import requests
from pydantic import BaseModel

from .db import work as db_work


class WorkerInfo(BaseModel):
    ip: str
    task_name: str
    is_running: bool


def get_worker_info(worker_hostname: str, machine_name: str) -> WorkerInfo | None:
    try:
        res = requests.get(
            f"http://{worker_hostname}:20768/vm-info", json={"vm_name": machine_name}
        ).text
        return WorkerInfo.model_validate_json(res)
    except Exception:
        return None


def convert_state(
    work: m_work.Work, work_result: bool | None, worker_info: WorkerInfo | None
) -> m_machine.MachineState | None:
    print(work, work_result, worker_info)

    if (
        work.work_type == m_work.WorkType.create
        or work.work_type == m_work.WorkType.start
    ):
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

    work_info = db_work.get_last_status_by_machine_name(
        machine_name,
        [
            m_work.WorkType.create,
            m_work.WorkType.remove,
            m_work.WorkType.start,
            m_work.WorkType.stop,
        ],
    )

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


def is_last_action_the_same(
    machine_name: str, work_type: m_work.WorkType, data: str | None
) -> bool:
    work_info = db_work.get_last_status_by_machine_name(
        machine_name,
        [
            m_work.WorkType.create,
            m_work.WorkType.remove,
            m_work.WorkType.start,
            m_work.WorkType.stop,
            m_work.WorkType.upload_image
        ],
    )
    if work_info is None:
        return False

    work: m_work.Work = work_info[0]

    if work.work_type == work_type and work.data == data:
        return True

    return False


def create_machine(machine_data: m_work.CreateWorkData, machine_name: str):
    data = machine_data.model_dump_json()

    if is_last_action_the_same(machine_name, m_work.WorkType.create, data):
        return

    db_work.start_work(
        db_work.StartWork(
            data=data, work_type=m_work.WorkType.create, machine_name=machine_name
        )
    )


def start_machine(machine_name: str):
    if is_last_action_the_same(machine_name, m_work.WorkType.start, None):
        return

    db_work.start_work(
        db_work.StartWork(
            data=None, work_type=m_work.WorkType.start, machine_name=machine_name
        )
    )


def stop_machine(machine_name: str):
    if is_last_action_the_same(machine_name, m_work.WorkType.stop, None):
        return

    db_work.start_work(
        db_work.StartWork(
            data=None, work_type=m_work.WorkType.stop, machine_name=machine_name
        )
    )


def delete_machine(machine_name: str):
    if is_last_action_the_same(machine_name, m_work.WorkType.remove, None):
        return

    db_work.start_work(
        db_work.StartWork(
            data=None, work_type=m_work.WorkType.remove, machine_name=machine_name
        )
    )


def upload_image(data: m_work.UploadImageWorkData, machine_name: str):
    d = data.model_dump_json()

    if is_last_action_the_same(machine_name, m_work.WorkType.upload_image, d):
        return

    db_work.start_work(
        db_work.StartWork(
            data=d, work_type=m_work.WorkType.upload_image, machine_name=machine_name
        )
    )
