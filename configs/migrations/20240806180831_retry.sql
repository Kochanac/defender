-- +goose Up
-- +goose StatementBegin

CREATE TABLE retry_tasks (
    id serial PRIMARY KEY,
    task_id serial REFERENCES tasks(id) ON DELETE CASCADE,
    do_retry boolean
);

CREATE TABLE retry_attacks (
    id serial PRIMARY KEY,

    attack_id serial REFERENCES attack(id) ON DELETE CASCADE,
    snapshot_id serial REFERENCES snapshot(id) ON DELETE CASCADE,
    
    attempt int,

    UNIQUE (attack_id, snapshot_id)
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE retry_tasks;
DROP TABLE retry_attacks;

-- +goose StatementEnd
