from typing import List, Tuple

import api.model.attack as m_attack
import api.model.exploit_model as m_exploit
import api.model.snapshot as m_snapshot
import api.repository.attack.adapters.rating as attack_adapter
import api.repository.attack.attack as attack_repo
import api.repository.exploit.exploit as exploit_repo
import api.repository.snapshot.adapters.rating as snapshot_adapter
import api.repository.snapshot.snapshot as snapshot_repo
import cachetools.func

TTL = 10


@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_attack_score(attack_id: int) -> Tuple[int, int]:
    attack = attack_repo.get_attack(attack_id)
    if attack is None:
        return 0, 0

    snaps = snapshot_adapter.get_active_snapshots_in_task(attack.task_id)

    exploit_runs = attack_adapter.get_attack_exploits_for_snapshots(
        attack.id, [x.id for x in snaps]
    )

    score = set()
    for snap in snaps:
        run_id = exploit_runs.get(snap.id, None)
        if run_id is None:
            continue

        _, result = exploit_repo.get_exploit_status(run_id)
        if result == m_exploit.ExploitResult.ok:
            score.add(snap.user_id)

    return len(score), len(snaps)


@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_snapshot_score(snapshot_id: int) -> Tuple[int, int]:
    snap = snapshot_repo.get_snapshot(snapshot_id)
    if snap is None:
        raise ValueError("no such snapshot")

    snaps = snapshot_adapter.get_active_snapshots_in_task(snap.task_id)

    attacks = attack_adapter.get_active_attack_of_task(snap.task_id)
    exploit_runs = attack_adapter.get_exploits_by_snapshot(
        snap.id, [x.id for x in attacks]
    )

    hackers = set()
    for attack in attacks:
        if attack.user_id == snap.user_id:
            continue

        run_id = exploit_runs.get(attack.id, None)
        if run_id is None:
            continue

        status, result = exploit_repo.get_exploit_status(run_id)
        if status in [
            m_exploit.ExploitStatus.checked,
            m_exploit.ExploitStatus.to_delete_machine,
        ]:
            if result != m_exploit.ExploitResult.no_flags:
                hackers.add(attack.user_id)

    return len(snaps) - len(hackers), len(snaps)


@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_user_attack_score(user_id: int, task_id: int) -> Tuple[int, int]:
    score = set()

    attacks = attack_adapter.get_active_attacks_of_this_user(user_id, task_id)

    snaps = snapshot_adapter.get_active_snapshots_in_task(task_id)
    snaps = [x for x in snaps if x.user_id != user_id]

    for attack in attacks:
        exploit_runs = attack_adapter.get_attack_exploits_for_snapshots(
            attack.id, [x.id for x in snaps]
        )

        for snap in snaps:
            run_id = exploit_runs.get(snap.id, None)
            if run_id is None:
                continue

            _, result = exploit_repo.get_exploit_status(run_id)
            if result == m_exploit.ExploitResult.ok:
                score.add(snap.user_id)

    return len(score), len(snaps)


@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_attack_status(
    attack_id: int,
) -> Tuple[
    List[m_snapshot.Snapshot],
    List[
        Tuple[
            m_snapshot.Snapshot,
            m_exploit.ExploitStatus | None,
            m_exploit.ExploitResult | None,
        ]
    ],
]:
    attack = attack_repo.get_attack(attack_id)
    if attack is None:
        return [], []

    snaps = snapshot_adapter.get_rating_snapshots_in_task(attack.task_id)
    snaps = [x for x in snaps if x.user_id != attack.user_id]

    exploit_runs = attack_adapter.get_attack_exploits_for_snapshots(
        attack.id, [x.id for x in snaps]
    )

    res = []
    for snap in snaps:
        run_id = exploit_runs.get(snap.id, None)
        if run_id is None:
            continue

        status, result = exploit_repo.get_exploit_status(run_id)
        res.append((snap, status, result))

    return snaps, res


@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_snapshot_status(
    snapshot_id: int,
) -> List[
    Tuple[
        m_attack.Attack, m_exploit.ExploitStatus | None, m_exploit.ExploitResult | None
    ]
]:
    snap = snapshot_repo.get_snapshot(snapshot_id)
    if snap is None:
        raise ValueError("no such snapshot")

    attacks = attack_adapter.get_active_attack_of_task(snap.task_id)
    exploit_runs = attack_adapter.get_exploits_by_snapshot(
        snap.id, [x.id for x in attacks]
    )

    res = []
    for attack in attacks:
        if attack.user_id == snap.user_id:
            continue
        
        run_id = exploit_runs.get(attack.id, None)
        if run_id is None:
            continue

        status, result = exploit_repo.get_exploit_status(run_id)

        res.append((attack, status, result))

    return res


@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_standings(
    task_id: int,
) -> List[Tuple[int, Tuple[int, int], Tuple[int, int], int]]:
    snaps = snapshot_adapter.get_rating_snapshots_in_task(task_id)
    users = set([snap.user_id for snap in snaps])

    result = []
    for user_id in users:
        attack_score = get_user_attack_score(user_id, task_id)
        if attack_score[1] == 0:
            attack_score = (0, 1)

        defence_score = (0, len(users))
        active_snap = snapshot_repo.get_active_snapshot(task_id, user_id)
        if active_snap is not None:
            defence_score = get_snapshot_score(active_snap.id)

        result_score = 1000 * (
            float(attack_score[0]) / attack_score[1]
            + (float(defence_score[0]) / defence_score[1])
        )

        result.append((user_id, attack_score, defence_score, result_score))

    return sorted(result, key=lambda x: x[-1])[::-1]
