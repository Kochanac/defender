from typing import List

import api.model.attack as m_attack
import cachetools.func

from .db import attack as db_attack

TTL=10

MAX_ATTACKS_OF_ONE_USER_IN_ONE_TASK = 4


def get_active_attacks() -> List[m_attack.Attack]:
    return db_attack.get_active_attacks()

@cachetools.func.ttl_cache(maxsize=500, ttl=TTL)
def get_attack(attack_id: int) -> m_attack.Attack | None:
    return db_attack.get_attack(attack_id)


def change_state(attack_id: int, new_state: m_attack.AttackState):
    if new_state == m_attack.AttackState.active:
        attack = get_attack(attack_id)
        if attack is None:
            raise ValueError(f"no such attack: {attack_id}")

        active_attacks = db_attack.get_active_attacks_of_this_user(attack.user_id, attack.task_id)

        while len(active_attacks) > MAX_ATTACKS_OF_ONE_USER_IN_ONE_TASK:
            change_state(active_attacks[0].id, m_attack.AttackState.dead)
            active_attacks = active_attacks[1:]
    
    return db_attack.change_state(attack_id, new_state)


def create_attack(user_id: int, task_id: int, exploit_id: int, name: str):
    db_attack.create_attack(user_id, task_id, exploit_id, name)

def remove_attack_exploit_run(attack_id: int, snapshot_id: int):
    db_attack.remove_attack_exploit_run(attack_id, snapshot_id)