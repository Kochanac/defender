import logging
import secrets
from datetime import timedelta
from typing import Annotated, List, Mapping, Tuple

import api.db.users as db
import api.model.attack as m_attack
import api.model.checker as m_checker
import api.model.exploit_model as exploit_model
import api.model.exploit_model as m_exploit
import api.model.machine as m_machine
import api.model.snapshot as m_snapshot
import api.model.task as m_task
import api.redis as redis
import api.repository.attack.adapters.rating as rating_attack
import api.repository.attack.attack as attack
import api.repository.checker.adapters.first_defence as first_defence_checker
import api.repository.exploit.adapters.first_exploit as first_exploit
import api.repository.exploit.exploit as exploit
import api.repository.machine.adapters.first_defence as first_defence
import api.repository.machine.adapters.rating_demo as rating_demo_adapter
import api.repository.rating.rating as rating_repo
import api.repository.snapshot.adapters.rating as rating_snapshot
import api.repository.snapshot.adapters.user_snapshot as user_snapshot
import api.repository.snapshot.snapshot as snapshot
import api.repository.task.db.tasks as db_tasks
import api.repository.task.tasks as tasks
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

logging.basicConfig(level=logging.DEBUG)

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

    return GetTaskResponse(
        exploit_example=ti.exploit_example,
        service_demo=ti.service_demo,
        title=ti.title,
        download_url=ti.download_url,
        exploit_code="import requests",
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
    fe = first_exploit.get_first_exploit_status(
        user_id, t.task_id
    )
    if fe is not None:
        first_exploit_status, first_exploit_result = fe[0], fe[1]
        if first_exploit_status is None:
            first_exploit_status = m_exploit.ExploitStatus.pre_starting
    else:
        first_exploit_status, first_exploit_result = None, None

    print(f"{first_exploit_status=} {first_exploit_result=}")

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
    m = first_defence.get_first_defence_machine(user_id, t.task_id)
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
    first_defence.create_first_defence_machine(user_id, t.task_id)


@app.post("/task/defence/box/stop")
async def _box_stop(t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]):
    first_defence.stop_first_defence_machine(user_id, t.task_id)


@app.post("/task/defence/box/start")
async def _box_start(t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]):
    first_defence.start_first_defence_machine(user_id, t.task_id)


@app.post("/task/defence/box/remove")
async def _box_remove(t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]):
    first_defence.remove_first_defence_machine(user_id, t.task_id)


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


class SnapshotCreateModel(BaseModel):
    task_id: int
    name: str


@app.post("/task/snapshot/create")
async def _snapshot_create(
    t: SnapshotCreateModel, user_id: Annotated[int, Depends(get_user_id)]
):
    user_snapshot.create_snapshot(t.task_id, user_id, t.name)


@app.post("/task/snapshot/get-latest-snapshot-status")
async def _snapshot_get_all(
    t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]
) -> m_snapshot.Snapshot | None:
    return snapshot.get_latest_snapshot(t.task_id, user_id)


class AttackCreateModel(BaseModel):
    task_id: int
    name: str
    exploit_text: str


@app.post("/task/attack/create")
async def _attack_create(
    m: AttackCreateModel, user_id: Annotated[int, Depends(get_user_id)]
):
    exp = exploit.upload_exploit(m.task_id, user_id, m.exploit_text)
    attack.create_attack(user_id, m.task_id, exp.exploit_id, m.name)


class AttackDeactivateModel(BaseModel):
    task_id: int
    attack_id: int


@app.post("/task/attack/deactivate")
async def _attack_deactivate(
    m: AttackDeactivateModel, user_id: Annotated[int, Depends(get_user_id)]
):
    att = attack.get_attack(m.attack_id)
    if att is None:
        return "hahaha"
    if att.user_id != user_id:
        return "hahaha"

    attack.change_state(m.attack_id, m_attack.AttackState.dead)


class SnapshotStates(BaseModel):
    snapshots: List[
        Tuple[
            m_snapshot.Snapshot,
            Tuple[int, int],  # score
            List[
                Tuple[
                    m_attack.Attack,
                    m_exploit.ExploitStatus | None,
                    m_exploit.ExploitResult | None,
                ]
            ],
        ]
    ]
    usernames: Mapping[int, str]


@app.post("/task/snapshot/get-snapshot-states")
async def _get_snapshot_states(
    t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]
) -> SnapshotStates:
    res = []
    user_ids = set()

    logging.info("getting snapshots")
    snaps = rating_snapshot.get_snapshosts_of_user(user_id, t.task_id)

    for snap in snaps[::-1][:20]:
        logging.info(f"snapshot {snap}")
        score = rating_repo.get_snapshot_score(snap.id)
        status = rating_repo.get_snapshot_status(snap.id)

        for st in status:
            user_ids.add(st[0].user_id)

        res.append((snap, score, status))

    logging.info("snapshots done")
    users = db.get_by_ids(user_ids)

    return SnapshotStates(snapshots=res, usernames=users)


class AttackStates(BaseModel):
    attacks: List[
        Tuple[
            m_attack.Attack,
            Tuple[int, int],  # score
            List[
                Tuple[
                    m_snapshot.Snapshot,
                    m_exploit.ExploitStatus | None,
                    m_exploit.ExploitResult | None,
                ]
            ],
        ]
    ]
    usernames: Mapping[int, str]


@app.post("/task/attack/get-attack-states")
async def _get_attack_states(
    t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]
) -> AttackStates:
    res = []
    user_ids = set()

    logging.info("attacks")
    attacks = rating_attack.get_attacks_of_this_user(user_id, t.task_id)

    DEAD_ATTACKS_LIMIT = 10

    for at in attacks[::-1]:
        if at.state == m_attack.AttackState.dead:
            if DEAD_ATTACKS_LIMIT <= 0:
                continue

            DEAD_ATTACKS_LIMIT -= 1

        logging.info(f"attack {at}")

        score = rating_repo.get_attack_score(at.id)
        status = rating_repo.get_attack_status(at.id)[1]
        for st in status:
            user_ids.add(st[0].user_id)

        res.append((at, score, status))

    users = db.get_by_ids(user_ids)

    return AttackStates(attacks=res, usernames=users)


class Scoreboard(BaseModel):
    users: List[
        Tuple[
            int,  # user_id
            Tuple[
                Tuple[int, int],  # attack score
                Tuple[int, int],  # defence score
                float,  # result
            ],
            List[
                Tuple[
                    m_attack.Attack,
                    m_exploit.ExploitStatus | None,
                    m_exploit.ExploitResult | None,
                ]
            ],
        ]
    ]
    usernames: Mapping[int, str]


@app.post("/task/scoreboard")
async def _get_scoreboard(
    t: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]
) -> Scoreboard:
    res = []

    user_ids = set()

    standings = rating_repo.get_standings(t.task_id)

    for stand in standings:
        user_ids.add(stand[0])
        snap = snapshot.get_latest_uploaded_snapshot(t.task_id, stand[0])
        if snap is None:
            continue

        status = rating_repo.get_snapshot_status(snap.id)

        res.append((stand[0], (stand[1], stand[2], stand[3]), status))

    users = db.get_by_ids(user_ids)

    return Scoreboard(users=res, usernames=users)


class RatingDemoRequest(BaseModel):
    task_id: int
    target_id: int


@app.post("/task/rating-demo/create")
async def _rating_demo_create(
    m: RatingDemoRequest, user_id: Annotated[int, Depends(get_user_id)]
):
    rating_demo_adapter.start_machine(user_id, m.task_id, m.target_id)


class RatingDemoStatus(BaseModel):
    target_id: int
    state: m_machine.MachineState
    url: str | None
    time_left: int


@app.post("/task/rating-demo/status")
async def _rating_demo_status(
    m: GetTaskModel, user_id: Annotated[int, Depends(get_user_id)]
) -> RatingDemoStatus | None:
    target_id, machine = rating_demo_adapter.get_machine(user_id)
    print(f"{target_id=} {machine=}")
    if target_id is None or machine is None:
        raise HTTPException(status_code=404, detail="No machine found")

    if machine.hostname is not None:
        url = tasks.format_task_url(m.task_id, machine.hostname)
    else:
        url = None

    time_left = rating_demo_adapter.get_rating_demo_machine_time_left(user_id)

    return RatingDemoStatus(
        target_id=target_id,
        state=machine.state,
        url=url,
        time_left=max(time_left.seconds, 0),
    )


@app.post("/task/rating-demo/delete")
async def _rating_demo_delete(
    user_id: Annotated[int, Depends(get_user_id)]
):
    rating_demo_adapter.delete_machine(user_id)
