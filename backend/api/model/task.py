import enum

from pydantic import BaseModel


# Таск и состояние решения для юзера
class UserTask(BaseModel):
    id: int
    title: str
    is_exploited: bool
    is_defended: bool

class TaskDemoState(str, enum.Enum):
    ok = "ok"
    fail = "fail"


class TaskDemo(BaseModel):
    state: TaskDemoState
    url: str | None


class TaskInfo(BaseModel):
    id: int
    title: str
    download_url: str
    exploit_example: str  # url
    service_demo: TaskDemo
    image_path: str
    flag: str

class TaskInfoRaw(BaseModel):
    id: int
    title: str
    download_url: str
    exploit_example: str  # url
    service_demo: str  # url
    image_path: str
    flag: str
