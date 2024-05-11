from enum import Enum

from pydantic import BaseModel


class WorkType(str, Enum):
	create = "create"
	stop = "stop"
	start = "start"
	remove = "remove"
	upload_image = "upload-image"

class WorkEventStatus(str, Enum):
	assigned = "ASSIGNED"
	done = "DONE"

class Work(BaseModel):
	work_id: int
	data: str | None
	work_type: WorkType
	machine_name: str

class CreateWorkData(BaseModel):
	task_name: str
	image: str

class UploadImageWorkData(BaseModel):
	image_name: str # new image name

