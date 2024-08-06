import asyncio

import api.watcher.attack.attack_watcher as attack_watcher
import api.watcher.demo_watcher as demo_watcher
import api.watcher.exploit.exploit_watcher as exploit_watcher
import api.watcher.rating_demo.watcher as rating_demo_watcher
import api.watcher.retry.retry as retry_watcher
import api.watcher.snapshot.snapshot_watcher as snapshot_watcher


async def main():
    await asyncio.gather(
        snapshot_watcher.main(),
        demo_watcher.main(),
        exploit_watcher.main(),
        attack_watcher.main(),
        rating_demo_watcher.main(),
        retry_watcher.main()
    )


asyncio.run(main())
