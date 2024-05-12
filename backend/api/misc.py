import logging
from collections.abc import Callable
from functools import wraps
from os import environ

import psycopg2
import redis
from psycopg2 import pool

db = {
    "host": environ.get("PSQL_HOST", "localhost"),
    "db": "defender",
    "user": environ.get("PSQL_USER", "kochan"),
    "password": environ.get("PSQL_PASSWORD", "XThwauCbMPcaTkByRGsu"),
}

environ["REDIS_HOST"] = environ.get("REDIS_HOST", "localhost")

conn_pool = None
r = None


def with_connection(f) -> Callable:
    @wraps(f)
    def with_connection_(*args, **kwargs):
        global conn_pool
        if not conn_pool:
            print(db["host"], db["password"])
            conn_pool = psycopg2.pool.ThreadedConnectionPool(
                1,
                20,
                host=db["host"],
                database=db["db"],
                user=db["user"],
                password=db["password"],
            )

        conn = conn_pool.getconn()

        logging.debug("start db")

        try:
            rv = f(conn, *args, **kwargs)
        except Exception as e:
            conn.rollback()
            conn_pool.putconn(conn)
            raise
        else:
            conn.commit()
        
        conn_pool.putconn(conn)

        logging.debug("end db")
        return rv

    return with_connection_


def with_redis(func) -> Callable:
    @wraps(func)
    def with_redis_(*args, **kwargs):
        global r
        if r is None:
            r = redis.Redis(host=environ["REDIS_HOST"])
        # print(str(func))
        return func(r, *args, **kwargs)

    return with_redis_
