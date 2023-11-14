insert into tasks
    (title, download_url, demo_url, flag, checker_path, qemu_qcow2_path, tcp_ports_needed)
VALUES ('Test ssh', 'http://lyceumctf.ru/', 'http://lyceumctf.ru/kek', 'LyceumCTF{test}', './checkers/kek.py', './images/ssh.qcow2', array[22, 80, 81]);


insert into tasks
    (title, download_url, demo_url, flag, checker_path, qemu_qcow2_path, tcp_ports_needed)
VALUES ('Alikekspress', 'http://lyceumctf.ru/', 'http://lyceumctf.ru/kek', 'LyceumCTF{h3ll0_4ttack_d3f3nce_w000}', '../checkers/alikekspress/checker.py', '../images/alikekspress.qcow2', array[22, 7000, 8080]);