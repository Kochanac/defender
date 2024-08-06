import asyncio
import logging

import api.model.exploit_model as m_exploit
import api.repository.attack.adapters.rating as rating_adapter
import api.repository.attack.adapters.retry as retry_adapter
import api.repository.attack.attack as attack_repo
import api.repository.exploit.exploit as exploit_repo

WATCHER_EVERY_X_SECONDS = 5
ATTEMPT_LIMIT = 4


async def handle_task(task_id: int):
    active_attacks = rating_adapter.get_active_attack_of_task(task_id)

    retry_status = retry_adapter.get_retry_status(
        [x.id for x in active_attacks], ATTEMPT_LIMIT
    )

    for retry in retry_status:
        if retry.attempt > ATTEMPT_LIMIT:
            continue

        exploit_run_id = rating_adapter.get_exploit_run_by_attack_snapshot(
            retry.attack_id, retry.snapshot_id
        )
        if exploit_run_id is None:
            continue

        run = exploit_repo.get_exploit_run(exploit_run_id)
        if run is None:
            # not sure
            attack_repo.remove_attack_exploit_run(retry.attack_id, retry.snapshot_id)
            continue

        if run.status != m_exploit.ExploitStatus.checked:
            continue
        if run.result not in [
            m_exploit.ExploitResult.error,
            m_exploit.ExploitResult.other_checker_fail,
            m_exploit.ExploitResult.machine_start_timeout,
        ]:
            continue

        attack_repo.remove_attack_exploit_run(retry.attack_id, retry.snapshot_id)
        retry_adapter.inc_attack_attempts(retry.attack_id, retry.snapshot_id)


async def retry():
    tasks = retry_adapter.get_tasks_to_retry()
    for task in tasks:
        logging.info(f"handling task {task}")
        await handle_task(task)


async def scheduler():
    while True:
        await retry()
        await asyncio.sleep(WATCHER_EVERY_X_SECONDS)


async def main():
    task = asyncio.create_task(scheduler())
    await task
