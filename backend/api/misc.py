from os import environ

import redis
import psycopg2
from functools import wraps

db = {
	"host": environ.get("PSQL_HOST", "localhost"),
	"db": "defender",
	"user": "root",
	"password": environ.get("PSQL_PASSWORD", "XThwauCbMPcaTkByRGsu")
}

environ["REDIS_HOST"] = environ.get("REDIS_HOST", "localhost")

conn = None
r = None

def with_connection(f):
	@wraps(f)
	def with_connection_(*args, **kwargs):
		global conn
		if not conn:
			conn = psycopg2.connect(host=db["host"], database=db["db"], user=db["user"], password=db["password"])
		try:
			rv = f(conn, *args, **kwargs)
		except Exception as e:
			conn.rollback()
			raise
		else:
			conn.commit()
		return rv

	return with_connection_


def with_redis(func):
	@wraps(func)
	def with_redis_(*args, **kwargs):
		global r
		if r is None:
			r = redis.Redis(host=environ["REDIS_HOST"])
		# print(str(func))
		return func(r, *args, **kwargs)

	return with_redis_


