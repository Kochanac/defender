insert into tasks
    (id, title, download_url, demo_url, flag, checker_path, qemu_qcow2_path)
VALUES (1, 'Test ssh', 'http://lyceumctf.ru/', 'http://{host}:7000/', 'LyceumCTF{test}', '../checkers/kek.py', '../images/ssh.qcow2');

insert into checker 
    (task_id, checker_url)
VALUES (1, '../checkers/kek.py');

insert into tasks
    (title, download_url, demo_url, flag, checker_path, qemu_qcow2_path)
VALUES ('Alikekspress', 'http://lyceumctf.ru/', 'http://{host}:7000/', 'LyceumCTF{h2ll0_4ttack_d3f3nce_w000}', '../checkers/alikekspress/checker.py', '../images/alikekspress.qcow2');
