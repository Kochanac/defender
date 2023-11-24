import os, signal
import shutil
import subprocess
import time
from os import environ, devnull

from psycopg2.extensions import connection
from celery import Celery

from api.misc import with_redis, with_connection
import api.db as db

HOSTNAME = "defender.lyceumctf.ru"
environ["CELERY_BROKER"] = environ.get("CELERY_BROKER", "redis://localhost")
environ["CELERY_BACKEND"] = environ.get("CELERY_BACKEND", "redis://localhost")
FNULL = open(devnull, 'w')

celery = Celery("celery", broker=environ["CELERY_BROKER"], backend=environ["CELERY_BACKEND"])

celery.conf.update(
    result_extended=True
)

ticks = 0

vms = {}

# qemu_run_cli = """
# qemu-system-x86_64 \
# 	-nographic \
# 	-m 512M \
# 	-boot d "{image}" \
# 	-net nic,model=virtio \
# 	-net user,hostfwd=tcp::10022-:22,hostfwd=tcp::10080-:8080 \
# 	-daemonize"""


# qemu_run_cli = """
# qemu-system-x86_64 \
#     -nographic \
#     -m 512M \
#     -boot d "{image}" \
#     -net nic,model=virtio \
#     -net user,{ports} \
#     -daemonize"""
# -nographic \

qemu_run_cli = """
qemu-system-x86_64 \
    -enable-kvm \
    -m 512M \
    -boot d "{image}" \
    -net nic,model=virtio \
    -net user,{ports} \
    -daemonize""".strip()

greet = """
Тачка запустилась или скоро запустится. Подключитесь к ней по ssh

routed ports - {ports}

ssh -p {box_id}22 root@{hostname}. password 8QIQzf0okRCPs5zD""".strip()


def fwd_ports(from_to_ports):
    res = []
    for fr, to in from_to_ports:
        res.append(f"hostfwd=tcp::{fr}-:{to}")

    return ','.join(res)


def fmt_ports(from_to_ports):
    res = []
    for fr, to in from_to_ports:
        res.append(f"{fr} -> {to}")

    return "; ".join(res)


@celery.task(bind=True, track_started=True)
def check_exploit(self, task_id, exploit_path):
    # self.update_state(state="PROGRESS")

    from random import randint

    time.sleep(5)

    # result = True if randint(0, 1) == 1 else False
    result = True
    db.evaluate_exploit(exploit_path, result)

    return result


# @with_connection // r, conn, ...
@celery.task(bind=True, track_started=True)
@with_redis
def box_start(r, self, user_id, task_id):
    # self.update_state(state="PROGRESS")
    print("kek")
    r.set(f"box/uid:{user_id}", "starting")

    task = db.get_task(task_id)
    print(task)

    img = f"/tmp/{user_id}.qcow2"
    shutil.copyfile(task["qemu_qcow2_path"], img)

    subprocess.check_output("qemu-img resize {img} +3G", shell=True)

    port_prefix = 1000 + user_id * 100
    ports = [(port_prefix + port, port) for port in task["ports"]]

    proc = subprocess.Popen(
        qemu_run_cli.format(image=img, ports=fwd_ports(ports)),
        shell=True,
        stderr=FNULL,
        stdout=FNULL,
        stdin=FNULL)


    time.sleep(50)

    r.set(f"box/uid:{user_id}", user_id)

    r.set(f"box:{user_id}/status", "on")

    r.set(f"box:{user_id}/uid", user_id)
    r.set(f"box:{user_id}/task_id", task_id)
    r.set(f"box:{user_id}/pid", proc.pid)
    r.set(f"box:{user_id}/port_prefix", port_prefix)
    r.set(f"box:{user_id}/message", greet.format(ports=fmt_ports(ports), box_id=user_id+10, hostname=HOSTNAME))


@celery.task(bind=True, track_started=True)
@with_redis
def box_stop(r, self, box_id):
    # self.update_state(state="PROGRESS")
    import time
    from random import randint
    pid = r.get(f"box:{box_id}/pid")
    print(f"killig {pid}")
    if pid is not None:
        pid = pid.decode()
        try:
            print(subprocess.check_output(f"kill -9 {int(pid)}", shell=True))
        except subprocess.CalledProcessError as e:
            print(e)

    uid = r.get(f"box:{box_id}/uid")
    if uid is not None:
        uid = uid.decode()
    print(f"del box/uid:{uid}")

    r.delete(
        f"box:{box_id}/status",
        f"box:{box_id}/uid",
        f"box:{box_id}/task_id",
        f"box:{box_id}/message",
        f"box:{box_id}/checks",
        f"box:{box_id}/pid",
        f"box:{box_id}/checks/progress",
        f"box:{box_id}/port_prefix",
        f"box/uid:{uid}")


@celery.task(bind=True, track_started=True)
@with_redis
def box_checks(r, self, box_id):
    print("Checks")

    r.set(f"box:{box_id}/checks/progress", "in progress")
    r.delete(f"box:{box_id}/checks")

    task_id = r.get(f"box:{box_id}/task_id")
    if task_id is None:
        r.rpush(f"box:{box_id}/checks", "R: box is not run, try restarting")
        r.set(f"box:{box_id}/checks/progress", "finished")
        return

    task_id = int(task_id.decode())

    task = db.get_task(task_id)
    print(task)

    ppref = r.get(f"box:{box_id}/port_prefix")
    if ppref is None:
        r.rpush(f"box:{box_id}/checks", "R: box is not run, try restarting")
        r.set(f"box:{box_id}/checks/progress", "finished")
        return

    ppref = ppref.decode()

    proc = subprocess.Popen([task["checker_path"], "localhost", ppref], stdout=subprocess.PIPE)
    proc.wait()
    for line in proc.stdout.readlines():
        #line = proc.stdout.readline()
        print(f"{line = }")
        if len(line) < 2:
            continue
        r.rpush(f"box:{box_id}/checks", line)

    # for i in range(5):
    #     time.sleep(2)
    #     result = True if randint(0, 1) == 1 else False
    #     comment = f"Check {gen_s()}: {'PASS' if result else 'FAILED'}"

    #     colored = f"{'G' if result else 'R'}:{comment}"

    #     r.rpush(f"box:{box_id}/checks", colored)

    r.set(f"box:{box_id}/checks/progress", "finished")
    # db.evaluate_box











