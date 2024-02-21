
import api.froutes as f

import uvicorn

uvicorn.run(f.app, host="127.0.0.1", port=8000)