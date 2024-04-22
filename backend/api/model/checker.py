import json
from enum import Enum
from typing import List

from pydantic import BaseModel


class VulnCheckerResult(BaseModel):
    passed: bool
    comment: str

class NormalCheckerResult(BaseModel):
    comment: str

class CheckerResults(BaseModel):
    results: List[VulnCheckerResult] | List[NormalCheckerResult] # todo after проверки 2 удалить VulnCheckerResult
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
    health = "health" # Проверка того что сервис работает. = check
    vulns = "vulns" # Проверка организаторскими эксплоитами = check-vuln
    put = "put" # положить флаг
    get = "get" # проверить что флаг лежит

class SimpleCheckerRun(CheckerRun):
    target_machine_name: str
    checker_id: int
    variant: CheckVariant # check method like check / put / get / check-vuln 
    flag: str | None
    args: List[str] | None


def parse_vuln_checker_results(x: str) -> List[VulnCheckerResult]:
    res_json = json.loads(x)

    results = []
    for r in res_json:
        results.append(VulnCheckerResult.model_validate_json(json.dumps(r)))

    return results

def parse_checker_results(x: str | None, is_ok, checker_variant: str) -> CheckerResults:
    print(x, is_ok, checker_variant)

    results = []
    if x is not None:
        if CheckVariant(checker_variant) == CheckVariant.vulns:
            results = parse_vuln_checker_results(x)
        else:
            results = [NormalCheckerResult(comment=y) for y in x.split()]

    is_ok_res = None
    if is_ok is not None:
        is_ok_res = bool(is_ok)

    return CheckerResults(
        results=results,
        ok=is_ok_res
    )


def serialise_checker_results(results: List[VulnCheckerResult]) -> str:
    # res = "["
    res = []
    for x in results:
        res.append(x.model_dump_json())
    
    return f'[{",".join(res)}]'
