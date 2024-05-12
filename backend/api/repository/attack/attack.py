from typing import List

import api.model.attack as m_attack

from .db import attack as db_attack

MAX_ATTACKS_OF_ONE_USER_IN_ONE_TASK = 4


def get_active_attacks() -> List[m_attack.Attack]:
    return db_attack.get_active_attacks()


def change_state(attack_id: int, new_state: m_attack.AttackState):
    return db_attack.change_state(attack_id, new_state)


def create_attack(user_id: int, task_id: int, exploit_id: int, name: str):
    active_attacks = db_attack.get_active_attacks_of_this_user(user_id, task_id)

    while len(active_attacks) > MAX_ATTACKS_OF_ONE_USER_IN_ONE_TASK:
        change_state(active_attacks[0].id, m_attack.AttackState.dead)
        active_attacks = active_attacks[1:]
    
    db_attack.create_attack(user_id, task_id, exploit_id, name)
