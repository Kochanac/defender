from api.misc import with_connection
import api.model.task as task
import api.model.exploit_model as exploit_model

import api.model.work as mWork
from pydantic import BaseModel


class Assignment(BaseModel):
	worker_id: str
	machine_name: str
	worker_hostname: str

@with_connection
def get_machine_assignment(conn, machine_name: str) -> Assignment | None:
	cur = conn.cursor()

	cur.execute("SELECT worker_id, worker_hostname FROM machine_assignment WHERE machine_id=%s", [machine_name, ])

	res = cur.fetchone()
	if res is None:
		return None

	worker_id, worker_hostname = res

	return Assignment(worker_id=worker_id, worker_hostname=worker_hostname, machine_name=machine_name)

