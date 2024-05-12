import hashlib
from typing import List, Mapping

from api.misc import with_connection


def cryptohash(x: str) -> str:
	return hashlib.sha256(x.encode()).hexdigest()

@with_connection
def register(conn, username: str, password: str) -> bool:
	cur = conn.cursor()

	cur.execute("SELECT * FROM users WHERE username = %s", [username])

	if len(cur.fetchall()) != 0:
		return False

	cur.execute("INSERT INTO users (username, password) VALUES (%s, %s)", [username,  cryptohash(password)])

	return True


@with_connection
def login(conn, username, password) -> int | None:
	cur = conn.cursor()

	cur.execute("SELECT id FROM users WHERE username = %s and password = %s", [username, cryptohash(password)])

	res = cur.fetchall()
	if len(res) == 1:
		return res[0][0]
	else:
		return None


@with_connection
def get_by_ids(conn, id: List[int]) -> Mapping[int, str]:
	cur = conn.cursor()

	cur.execute("SELECT id, username FROM users WHERE id = ANY (%s)", [list(id)])

	res = cur.fetchall()
	if res is None:
		return {}
	
	return {int(r[0]): str(r[1]) for r in res}
