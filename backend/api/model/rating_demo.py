from pydantic import BaseModel


class RatingDemoTarget(BaseModel):
    user_id: int
    task_id: int