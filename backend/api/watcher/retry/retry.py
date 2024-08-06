import asyncio
import logging

import api.repository.attack.adapters.rating as rating_adapter
import api.repository.attack.adapters.retry as retry_adapter
import api.repository.attack.attack as attack_repo

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
