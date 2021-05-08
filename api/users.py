from db import with_connection



@with_connection
def register(conn, data):
	username = data["username"]
	password = data["password"]

	cur = conn.cursor()

	cur.execute("SELECT * FROM users WHERE username = %s", [username])

	if len(cur.fetchall()) != 0:
		return False

	cur.execute("INSERT INTO users (username, password) VALUES (%s, %s)", [username,  password])

	return True


@with_connection
def login(conn, data):
	username = data["username"]
	password = data["password"]

	cur = conn.cursor()

	cur.execute("SELECT * FROM users WHERE username = %s and password = %s", [username, password])

	if len(cur.fetchall()) != 0:
		return True
	else:
		return False
