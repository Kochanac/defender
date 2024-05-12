-- +goose Up
-- +goose StatementBegin

CREATE TABLE attack (
    id serial PRIMARY KEY,
    task_id serial REFERENCES tasks(id) ON DELETE CASCADE,
    user_id serial REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,

    exploit_id serial REFERENCES exploits(id), -- Path to the VM image

    state text DEFAULT NULL,
    
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE attack_exploits (
    attack_id serial REFERENCES attack(id) ON DELETE CASCADE,
    snapshot_id serial REFERENCES snapshot(id) ON DELETE CASCADE,
    exploit_run_id serial REFERENCES exploit_runs(run_id) ON DELETE CASCADE
);

ALTER TABLE snapshot ADD COLUMN created_at timestamptz DEFAULT now() NOT NULL;


-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE attack;
DROP TABLE attack_exploits;
ALTER TABLE snapshot DROP COLUMN created_at;
-- +goose StatementEnd
