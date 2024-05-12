import asyncio
from datetime import timedelta

import api.repository.machine.adapters.rating_demo as machine_adapter

WATCHER_EVERY_X_SECONDS = 5



def handle_rating_demo(user_id):
    time_left = machine_adapter.get_rating_demo_machine_time_left(user_id)
    if time_left is None:
        return
    if time_left < timedelta():
        machine_adapter.delete_machine(user_id)


async def handle_rating_demos():
    users = machine_adapter.get_rating_demos()

    for user in users:
        handle_rating_demo(user)
        


async def scheduler():
    while True:
        await handle_rating_demos()
        await asyncio.sleep(WATCHER_EVERY_X_SECONDS)


async def main():
    task = asyncio.create_task(scheduler())
    await task
