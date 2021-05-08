import psycopg2

db = {
	"host": "localhost",
	"db": "defender",
	"user": "root",
	"password": "XThwauCbMPcaTkByRGsu"
}
conn = None

def with_connection(f):

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
