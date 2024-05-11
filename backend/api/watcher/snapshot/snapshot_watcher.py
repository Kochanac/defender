import asyncio
import logging

import api.model.machine as m_machine
import api.model.snapshot as m_snapshot
import api.repository.machine.adapters.first_defence as fd_machine
import api.repository.snapshot.snapshot as snapshot

WATCHER_EVERY_X_SECONDS = 5
CHECK_EVERY_X_MINUTES = 1


def handle_null(snap: m_snapshot.Snapshot):
    logging.info("null state")

    machine = fd_machine.get_first_defence_machine(snap.user_id, snap.task_id)
    logging.info(f"{machine=}")

    # strange state
    if machine is None or machine.state in [
        m_machine.MachineState.starting,
        m_machine.MachineState.removing,
    ]:
        snapshot.delete(snap.id)
        return

    if machine.state == m_machine.MachineState.turning_off:
        return # just wait for it
    
    if machine.state == m_machine.MachineState.on:
        fd_machine.stop_first_defence_machine(snap.user_id, snap.task_id)
    
    if machine.state == m_machine.MachineState.off:
        snapshot.change_state(snap.id, m_snapshot.SnapshotState.creating)


def handle_creating(snap: m_snapshot.Snapshot):
    logging.info("creating")

    machine = fd_machine.get_first_defence_machine(snap.user_id, snap.task_id)
    if machine is None or machine.state != m_machine.MachineState.off:
        snapshot.delete(snap.id)
        return


    is_in_progress, result_ok = fd_machine.upload_status(snap.user_id, snap.task_id, snap.image_path)
    logging.info(f"{is_in_progress=}, {result_ok=}")
    print(f"{is_in_progress=}, {result_ok=}", flush=True)
    
    if result_ok:
        snapshot.change_state(snap.id, m_snapshot.SnapshotState.checking)
        return

    if not is_in_progress:
        fd_machine.upload_image(snap.user_id, snap.task_id, snap.image_path)


def handle_checking(snap: m_snapshot.Snapshot):
    logging.info("checking")
    snapshot.change_state(snap.id, m_snapshot.SnapshotState.active)


def handle_active(snap: m_snapshot.Snapshot):
    logging.info("active")
    return


async def handle_snapshots():
    snapshots = snapshot.get_alive_snapshots()

    for snap in snapshots:
        logging.info(f"handling {snap=}")
        match snap.state:
            case None:
                handle_null(snap)
            case m_snapshot.SnapshotState.creating:
                handle_creating(snap)
            case m_snapshot.SnapshotState.checking:
                handle_checking(snap)
            case m_snapshot.SnapshotState.active:
                handle_active(snap)
            case _:
                raise ValueError("unhanlded snapshot state: " + str(snap))


async def scheduler():
    while True:
        await handle_snapshots()
        await asyncio.sleep(WATCHER_EVERY_X_SECONDS)


async def main():
    task = asyncio.create_task(scheduler())
    await task
