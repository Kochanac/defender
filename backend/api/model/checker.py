from enum import Enum
from typing import List

from pydantic import BaseModel

class CheckerResult(BaseModel):
	passed: bool
	comment: str

class CheckerResults(BaseModel):
	results: List[CheckerResult]
	ok: bool | None

class CheckerRun(BaseModel):
	run_id: int

class CheckStatus(str, Enum):
	in_progress = "in progress"
	checked = "checked"

class Checker(BaseModel):
	id: int
	task_id: int
	checker_url: str


class SimpleCheckerRun(CheckerRun):
	target_machine_name: str
	checker_id: int