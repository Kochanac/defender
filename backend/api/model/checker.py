import json
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

class CheckVariant(str, Enum):
	health = "health" # Проверка того что сервис работает
	vulns = "vulns" # Проверка организаторскими эксплоитами

class SimpleCheckerRun(CheckerRun):
	target_machine_name: str
	checker_id: int
	variant: CheckVariant


def parse_checker_results(x: str | None, is_ok) -> CheckerResults:
    res_json = []
    if x is not None:
        res_json = json.loads(x)

    results = []
    for r in res_json:
        results.append(CheckerResult.model_validate_json(json.dumps(r)))

    is_ok_res = None
    if is_ok is not None:
        is_ok_res = bool(is_ok)

    return CheckerResults(
        results=results,
        ok=is_ok_res
    )


def serialise_checker_results(results: List[CheckerResult]) -> str:
	# res = "["
	res = []
	for x in results:
		res.append(x.model_dump_json())
	
	return f'[{",".join(res)}]'
