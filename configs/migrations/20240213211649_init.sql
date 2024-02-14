-- +goose Up
-- +goose StatementBegin
SELECT 'up SQL query';

CREATE TABLE work (  
	id serial PRIMARY KEY,  
	
	type text NOT NULL,  
	
	worker_id text DEFAULT NULL, -- Имя воркера который будет выполнять эту работу
	machine_id text, -- Имя тачки, которое присваивает апишка при создании. Можно как-то хитро использовать имя пользователя и запрещать ему иметь две машины
	
	data text, -- json самого таска, например имя файла образа
	result text, -- заполяется когда создается евент о том 

	created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE work_events (
	id serial PRIMARY KEY,

	work_id int NOT NULL, -- ref work
	worker_id text NOT NULL,

	event_type text NOT NULL, -- ASSIGNED, DONE

	created_at timestamptz DEFAULT now() NOT NULL,
	UNIQUE (work_id, event_type)
);

CREATE INDEX work_events_work_id_idx ON work_events (work_id);

CREATE TABLE machine_assignment (
	id serial PRIMARY KEY,
	
	worker_id text NOT NULL,
	machine_id text NOT NULL,
	
	UNIQUE (machine_id)
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 'down SQL query';


DROP TABLE machine_assignment;
DROP TABLE work_events;
DROP TABLE work;

-- +goose StatementEnd
