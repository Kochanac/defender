CREATE TABLE users (
	id int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
	username TEXT NOT NULL,
	password TEXT NOT NULL
);

CREATE TABLE tasks (
	id int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
	title TEXT NOT NULL,
	download_url TEXT NOT NULL,
	demo_url TEXT NOT NULL,
	flag TEXT NOT NULL,

	checker_path VARCHAR(1024) NOT NULL,
	qemu_qcow2_path VARCHAR(1024) NOT NULL,
	tcp_ports_needed int[],
	post_time TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE defences (
	id int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,

	user_id int REFERENCES users (id) ON DELETE CASCADE,
	task_id int REFERENCES tasks (id) ON DELETE CASCADE,

	done_time TIMESTAMP WITH TIME ZONE DEFAULT now(),

	UNIQUE (user_id, task_id)
);

CREATE TABLE exploits (
	id int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,

	user_id int REFERENCES users (id) ON DELETE CASCADE,
	task_id int REFERENCES tasks (id) ON DELETE CASCADE,

	path VARCHAR(1024),
	works int DEFAULT -1,
	post_time TIMESTAMP WITH TIME ZONE DEFAULT now()
);


CREATE TABLE machines (
	id int PRIMARY KEY,
	status text NOT NULL,
	worker_url text,
	worker_ports int[],
	
	user_id int REFERENCES users (id) ON DELETE NO ACTION NOT NULL,
	task_id int REFERENCES tasks (id) ON DELETE NO ACTION NOT NULL,
	
	UNIQUE (id, worker_url)
);









