from typing import List, Mapping

import api.model.attack as m_attack
import cachetools.func

from ..db import attack as db_attack

TTL = 10


def get_attack_exploits_for_snapshots(
    attack_id: int, snap_ids: List[int]
) -> Mapping[int, int]:
    exploit_runs = db_attack.get_attack_exploits_for_snapshots(attack_id, snap_ids)

    return {x[0]: x[1] for x in exploit_runs}


def get_exploits_by_snapshot(snap_id: int, attack_ids: List[int]) -> Mapping[int, int]:
    exploit_runs = db_attack.get_exploits_by_snapshot(snap_id, attack_ids)

    return {x[0]: x[1] for x in exploit_runs}


@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_active_attack_of_task(task_id: int) -> List[m_attack.Attack]:
    return db_attack.get_active_attacks_of_task(task_id)

@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_active_attacks_of_this_user(
    user_id: int, task_id: int
) -> List[m_attack.Attack]:
    return db_attack.get_active_attacks_of_this_user(user_id, task_id)

@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_attacks_of_this_user(user_id: int, task_id: int) -> List[m_attack.Attack]:
    return db_attack.get_attacks_of_this_user(user_id, task_id)


def get_exploit_run_by_attack_snapshot(attack_id: int, snapshot_id: int) -> int | None:
    res = db_attack.get_attack_exploits_for_snapshots(attack_id, [snapshot_id])

    if len(res) != 1:
        return None
    
    res = res[0]
    return res[1]

    