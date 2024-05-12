

from typing import List, Tuple

from ..db import attack as db_attack


# snapshot_id, exploit_run_id
def get_attack_exploits(attack_id: int) -> List[Tuple[int, int]]:
    return db_attack.get_attack_exploits(attack_id)

def add_attack_exploit(attack_id: int, snapshot_id: int, exploit_run_id: int):
    return db_attack.add_attack_exploit(attack_id, snapshot_id, exploit_run_id)