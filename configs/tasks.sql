insert into tasks
    (id, title, download_url, demo_url, flag, checker_path, qemu_qcow2_path, tcp_ports_needed)
VALUES (1, 'Test ssh', 'http://lyceumctf.ru/', 'http://lyceumctf.ru/kek', 'LyceumCTF{test}', '../checkers/kek.py', '../images/ssh.qcow2', array[22, 80, 81]);

insert into checker 
    (task_id, checker_url)
VALUES (1, '../checkers/kek.py');

insert into tasks
    (title, download_url, demo_url, flag, checker_path, qemu_qcow2_path, tcp_ports_needed)
VALUES ('Alikekspress', 'http://lyceumctf.ru/', 'http://lyceumctf.ru/kek', 'LyceumCTF{h2ll0_4ttack_d3f3nce_w000}', '../checkers/alikekspress/checker.py', '../images/alikekspress.qcow2', array[22, 7000, 8080]);
