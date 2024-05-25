import asyncio
import logging

import api.model.attack as m_attack
import api.model.snapshot as m_snapshot
import api.repository.attack.adapters.watcher as attack_watcher_adapter
import api.repository.attack.attack as attack
import api.repository.exploit.exploit as exploit_repo
import api.repository.snapshot.adapters.attack_watcher as snapshot_adapter

WATCHER_EVERY_X_SECONDS = 2


def handle_active_attack(at: m_attack.Attack):
    logging.info(f"handle attack {at}")
    exploit_ids = attack_watcher_adapter.get_attack_exploits(at.id)
    snap_to_exploit = {snapshot_id:run_id for snapshot_id, run_id in exploit_ids}

    snapshots_to_attack = snapshot_adapter.get_latest_snapshots_by_user(at.task_id)

    to_run_exploit_against = []

    for snap in snapshots_to_attack:
        run_id = snap_to_exploit.get(snap.id, None)
        if run_id is None:
            to_run_exploit_against.append(snap)
            continue

    for snap in to_run_exploit_against:
        if snap.user_id == at.user_id:
            continue
        if snap.state not in [
            m_snapshot.SnapshotState.active,
            m_snapshot.SnapshotState.checking,
        ]:
            continue
        logging.info(f"starting exploit on {snap}")
        exploit_run_id = exploit_repo.run_exploit(at.exploit_id, snap.image_path)
        attack_watcher_adapter.add_attack_exploit(at.id, snap.id, exploit_run_id)


async def handle_all_attacks():
    ats = attack.get_active_attacks()

    for at in ats:
        logging.info(f"attack {at}")
        match at.state:
            case None:
                attack.change_state(at.id, m_attack.AttackState.active)
            case m_attack.AttackState.active:
                handle_active_attack(at)
            case _:
                raise ValueError("unhanlded attack state, attack: " + str(at))


async def scheduler():
    while True:
        await handle_all_attacks()
        await asyncio.sleep(WATCHER_EVERY_X_SECONDS)


async def main():
    task = asyncio.create_task(scheduler())
    await task
