import secrets
from typing import Annotated

import api.db.users as db
import api.model.checker as m_checker
import api.model.exploit_model as exploit_model
import api.model.machine as m_machine
import api.model.task as m_task
import api.redis as redis
import api.repository.checker.adapters.first_defence as first_defence_checker
import api.repository.exploit.adapters.first_exploit as first_exploit
import api.repository.exploit.exploit as exploit
import api.repository.machine.adapters.first_defence as first_defence
import api.repository.machine.machine as machine
import api.repository.task.db.tasks as db_tasks
import api.repository.task.tasks as tasks
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_user_id(token: Annotated[str, Depends(oauth2_scheme)]) -> int:
    user_id = redis.get_user_auth(token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Not authenticated")

    return user_id


class RegisterModel(BaseModel):
    username: str
    password: str


@app.post("/register")
async def _register(reg: RegisterModel):
    success = db.register(reg.username, reg.password)
    if not success:
        return {"status": "failed"}

    return {"status": "ok"}


class LoginModel(BaseModel):
    username: str
    password: str


@app.post("/login")
async def _login(log: LoginModel):
    user_id = db.login(log.username, log.password)

    if user_id is None:
        return {"status": "failed"}

    token = secrets.token_hex()
    redis.set_user_id(user_id, token)

    return {"status": "ok", "token": token}


@app.post("/token")
async def _token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user_id = db.login(form_data.username, form_data.password)

    if user_id is None:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    token = secrets.token_hex()
    redis.set_user_id(user_id, token)

    return {"access_token": token, "token_type": "bearer"}


@app.post("/tasks")
async def _tasks(user_id: Annotated[int, Depends(get_user_id)]):
    return db_tasks.get_tasks(user_id)


class GetTaskModel(BaseModel):
    task_id: int

class GetTaskResponse(BaseModel):
    exploit_example: str
    service_demo: m_task.TaskDemo
    title: str
    download_url: str
    exploit_code: str


@app.post("/task")
async def _get_task(t: GetTaskModel) -> GetTaskResponse:
    ti = tasks.get_task_info(t.task_id)
    if ti is None:
        raise HTTPException(status_code=404, detail="No task found")
    print(ti)
    print(dir(ti))
    
    return GetTaskResponse(
        exploit_example=ti.exploit_example,
        service_demo=ti.service_demo,
        title=ti.title,
        download_url=ti.download_url,
        exploit_code="import requests"
    )


class TaskState(BaseModel):
    exploit_status: exploit_model.ExploitStatus | None
    exploit_result: exploit_model.ExploitResult | None

    defence_unlocked: bool
    flag: str | None


@app.post("/task/state")
async def _task_state(
    t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]
) -> TaskState:
    first_exploit_status, first_exploit_result = first_exploit.get_first_exploit_status(
        user_id, t.task_id
    )

    task_status = db_tasks.get_task_progress(user_id, t.task_id)
    if task_status is None:
        raise HTTPException(status_code=404, detail="No task found")

    flag = None
    if task_status.is_exploited and task_status.is_defended:
        task_info = db_tasks.get_task_info(t.task_id)
        flag = task_info.flag

    return TaskState(
        exploit_status=first_exploit_status,
        exploit_result=first_exploit_result,
        defence_unlocked=task_status.is_exploited,
        flag=flag,
    )


class UploadExploit(BaseModel):
    task_id: int
    exploit_text: str


@app.post("/task/exploit/upload")
async def _upload_exploit(
    ue: UploadExploit, user_id: Annotated[int, Depends(get_user_id)]
):
    exp = exploit.upload_exploit(ue.task_id, user_id, ue.exploit_text)
    first_exploit.start_first_exploit(exp.exploit_id)


class BoxStatus(BaseModel):
    status: m_machine.MachineState
    message: str | None


@app.post("/task/defence/box/status")
async def _box_status(
    t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]
) -> BoxStatus:
    m = first_defence.get_first_defence_machine(
        user_id, t.task_id
    )
    if m is None:
        raise HTTPException(status_code=404, detail="No machine found")

    return BoxStatus(
        status=m.state,
        message=(
            f"Машина доступна по `ssh root@{m.hostname}` с паролем 8QIQzf0okRCPs5zD"
            if m.state == m_machine.MachineState.on
            else None
        ),
    )


@app.post("/task/defence/box/create")
async def _box_create(t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]):
    first_defence.create_first_defence_machine(
        user_id, t.task_id
    )


@app.post("/task/defence/box/stop")
async def _box_stop(t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]):
    first_defence.stop_first_defence_machine(
        user_id, t.task_id
    )


@app.post("/task/defence/box/start")
async def _box_start(t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]):
    first_defence.start_first_defence_machine(
        user_id, t.task_id
    )


@app.post("/task/defence/box/remove")
async def _box_remove(t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]):
    first_defence.remove_first_defence_machine(
        user_id, t.task_id
    )


@app.post("/task/defence/test/start")
async def _first_defence_check(
    t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]
):
    first_defence_checker.check_start(user_id, t.task_id)


class FirstDefenceStatus(BaseModel):
    results: m_checker.CheckerResults | None
    status: m_checker.CheckStatus | None


@app.post("/task/defence/test/checks")
async def _first_defence_check_result(
    t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]
) -> FirstDefenceStatus:
    status, result = first_defence_checker.check_result(t.task_id, user_id)
    return FirstDefenceStatus(status=status, results=result)
