from pydantic import BaseModel


# Таск и состояние решения для юзера
class UserTask(BaseModel):
    id: int
    title: str
    is_exploited: bool
    is_defended: bool


class TaskInfo(BaseModel):
    id: int
    title: str
    download_url: str
    exploit_example: str  # url
    service_demo: str  # url
    image_path: str
    flag: str
