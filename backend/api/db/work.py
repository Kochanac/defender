from api.misc import with_connection
import api.model.task as task
import api.model.exploit as exploit

import api.model.work as mWork
from pydantic import BaseModel

class StartWork(BaseModel):
	data: str | None
	work_type: mWork.WorkType
	machine_name: str


@with_connection
def start_work(conn, w: StartWork):
	cur = conn.cursor()
	cur.execute("INSERT INTO WORK (type, machine_id, data) VALUES (%s, %s, %s)", [w.work_type.value, w.machine_name, w.data])


@with_connection
def get_last_by_machine_name(conn, machine_id: str) -> tuple[mWork.Work, bool | None] | None:
	cur = conn.cursor()

	cur.execute("SELECT id, type, data, result FROM work WHERE machine_id = %s ORDER BY id DESC LIMIT 1", [machine_id, ])

	res = cur.fetchone()
	if res is None:
		return None

	work_id, w_type, data, result = res

	if result is not None:
		result = result == "OK"

	return (mWork.Work(work_id=work_id, work_type=w_type, data=data, machine_name=machine_id), result)

