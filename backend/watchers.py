import asyncio

import api.watcher.demo_watcher as demo_watcher
import api.watcher.exploit.exploit_watcher as exploit_watcher


async def main():
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(demo_watcher.main())
        task2 = tg.create_task(exploit_watcher.main())


asyncio.run(main())
