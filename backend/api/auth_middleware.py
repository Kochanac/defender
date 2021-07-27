
from starlette.authentication import (
    AuthenticationBackend, AuthenticationError, SimpleUser, UnauthenticatedUser,
    AuthCredentials
)
# from starlette.middleware import Middleware
from starlette.middleware.authentication import AuthenticationMiddleware

from api.misc import with_redis

class TokenAuthBackend(AuthenticationBackend):
	
	@with_redis
	async def authenticate(r, self, request):
		data = request.headers

		if "Auth-Token" not in data:
			return

		uid = r.get(data["Auth-Token"]).decode()

		if uid is None or uid.split(":")[0] != "uid":
			return

		uid = int(uid.split(":")[1])

		return AuthCredentials(["authenticated"]), SimpleUser(username)

TokenAuthMiddleware = (AuthenticationMiddleware, TokenAuthBackend())
