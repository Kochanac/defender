import asyncio

import api.watcher.demo_watcher as demo_watcher
import api.watcher.exploit.exploit_watcher as exploit_watcher


async def main():
    await asyncio.gather(
        demo_watcher.main(),
        exploit_watcher.main()
    )


asyncio.run(main())
