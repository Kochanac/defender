from pydantic import BaseModel

from enum import Enum

class WorkType(str, Enum):
	create = "create"
	stop = "stop"
	start = "start"
	remove = "remove"

class WorkEventStatus(str, Enum):
	assigned = "ASSIGNED"
	done = "DONE"

class Work(BaseModel):
	work_id: int
	data: str
	work_type: WorkType
	machine_name: str

class CreateWorkData(BaseModel):
	task_name: str
	image: str


