import subprocess
import time
from os import devnull, environ
from typing import List

import api.model.checker as m_checker
import api.model.exploit_model as exploit_model
import api.repository.checker.db.checks as db_checks
import api.repository.exploit.db.exploits as db_exploits
import api.repository.machine.machine as machine
from api.misc import with_redis
from celery import Celery

environ["CELERY_BROKER"] = environ.get("CELERY_BROKER", "redis://localhost")
environ["CELERY_BACKEND"] = environ.get("CELERY_BACKEND", "redis://localhost")

FNULL = open(devnull, 'w')

celery = Celery("celery", broker=environ["CELERY_BROKER"], backend=environ["CELERY_BACKEND"])

celery.conf.update(
    result_extended=True
)


def convert_args_and_variant(variant: m_checker.CheckVariant, flag: str | None, hostname: str, args: List[str] | None) -> List[str]:
    print(variant)
    
    if args is None:
        args = []

    if variant == m_checker.CheckVariant.health:
        return ["check", hostname]
    
    if variant == m_checker.CheckVariant.put:
        assert flag is not None
        return ["put", hostname, args[0], flag, *args[1:]] # :D args[0] is flag_id
    
    if variant == m_checker.CheckVariant.get:
        assert flag is not None
        return ["get", hostname, args[0], flag, *args[1:]] # :D args[0] is flag_id
    
    raise ValueError('unknown variant')


@celery.task(bind=True, track_started=True)
@with_redis
def simple_checker(r, self, simple_checker_run_id: int):
    print("Checks")

    # 1) Достать сам чекер (ну щас он локально)
    # 2) Достать hostname тачки
    # 3) По мере поступления данных закидывать их в result
    # 4) финально отметить ok / не ок

    checker_run = db_checks.get_simple_checker_run(simple_checker_run_id)
    if checker_run is None:
        raise ValueError("not found checker run")
    assert isinstance(checker_run, m_checker.SimpleCheckerRun)

    mach = machine.get_machine(checker_run.target_machine_name)
    if mach is None:
        raise ValueError("not found machine")
    if mach.hostname is None:
        raise ValueError("machine is not run or is not connected to the network")
    
    hostname = str(mach.hostname)

    checker = db_checks.get_checker_by_id(checker_run.checker_id)
    assert isinstance(checker, m_checker.Checker)

    # todo S3 and so on...

    print(f"{checker=}")

    # костыль но пофиг как-то. check-vuln это отдельный флоу и отдельный протокол чекера
    if checker_run.variant == m_checker.CheckVariant.vulns:
        handle_check_vuln(checker, hostname, simple_checker_run_id)
        return
    

    args = convert_args_and_variant(checker_run.variant, checker_run.flag, hostname, checker_run.args)

    # todo convert to normal labels and so on
    proc = subprocess.Popen([checker.checker_url, *args], stdout=subprocess.PIPE)

    while True:
        line = proc.stdout.readline()
        if not line:
            break

        db_checks.add_checker_result(
            simple_checker_run_id,
            m_checker.NormalCheckerResult(comment=line.decode())
        )
    
    proc.wait()

    if proc.returncode == 101:
        print("ok")
        db_checks.set_checker_final_ok(simple_checker_run_id, True)
    else:
        print(f"not ok, return code {proc.returncode}")
        db_checks.set_checker_final_ok(simple_checker_run_id, False)





def handle_check_vuln(checker, hostname, simple_checker_run_id):
    proc = subprocess.Popen([checker.checker_url, 'check-vuln', hostname], stdout=subprocess.PIPE)
    

    allgreen = True

    while True:
        line = proc.stdout.readline()
        if not line:
            break

        print(f"{line = }")
        if len(line) < 2:
            continue
        
        if line[0:1] != b"G":
            allgreen = False
        
        db_checks.add_checker_result(
            simple_checker_run_id,
            m_checker.VulnCheckerResult(
                comment=line[2:].decode().strip(), 
                passed=line[0:1] == b"G"
            )
        )
    
    proc.wait()

    if allgreen:
        print("ok")
        db_checks.set_checker_final_ok(simple_checker_run_id, True)
    else:
        print("not ok")
        db_checks.set_checker_final_ok(simple_checker_run_id, False)












