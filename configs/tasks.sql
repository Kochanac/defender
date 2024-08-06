insert into tasks
    (id, title, download_url, demo_url, flag, checker_path, qemu_qcow2_path)
VALUES (1, 'Test ssh', 'http://lyceumctf.ru/', 'http://{host}:7000/', 'LyceumCTF{test}', '../checkers/kek.py', '../images/ssh.qcow2');

insert into checker 
    (task_id, checker_url)
VALUES (1, '../checkers/kek.py');

insert into tasks
    (title, download_url, demo_url, flag, checker_path, qemu_qcow2_path)
VALUES ('Alikekspress', 'http://lyceumctf.ru/', 'http://{host}:7000/', 'LyceumCTF{h2ll0_4ttack_d3f3nce_w000}', '../checkers/alikekspress/checker.py', '../images/alikekspress.qcow2');


insert into tasks
    (id, title, download_url, demo_url, flag, qemu_qcow2_path)
VALUES (3, 'Defence 101', 'https://kochan.fun/f/defence-101.tar.gz', 'http://{host}:7878/', 'LyceumCTF{h3ll0_pr3dz4sch1t4}', '../images/defence-101.qcow2');

insert into checker 
    (task_id, checker_url)
VALUES (3, '../checkers/defence-101/checker.py');



insert into tasks
    (id, title, download_url, demo_url, flag, qemu_qcow2_path)
VALUES (4, 'Wall', 'https://kochan.fun/f/wall.tar.gz', 'http://{host}:8080/', 'LyceumCTF{w3lc0m3_t0_d3f3nc3}', '/var/lib/libvirt/images/wall.qcow2');

insert into checker 
    (task_id, checker_url)
VALUES (4, '../checkers/wall/wall_checker.py');



insert into tasks
    (id, title, download_url, demo_url, flag, qemu_qcow2_path)
VALUES (5, 'Lets see Paul Allens card', 'https://kochan.fun/f/paul_allen_card.tar.gz', 'http://{host}:8080/', 'Поздравляю с вашим первым эксплоитом)', '/var/lib/libvirt/images/cards.qcow2');

insert into checker 
    (task_id, checker_url)
VALUES (5, '../checkers/card_checker/c.py');






INSERT INTO public.work (type, worker_id, machine_id) 
(select 'remove', 'kek-1', machine_id from machine_assignment);
