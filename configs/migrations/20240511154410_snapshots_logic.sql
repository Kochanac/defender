-- +goose Up
-- +goose StatementBegin


CREATE TABLE snapshot (
    id serial PRIMARY KEY,
    task_id serial REFERENCES tasks(id) ON DELETE CASCADE,
    user_id serial REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,

    image_path text NOT NULL, -- Path to the VM image

    state text DEFAULT NULL
);


-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE snapshot;
-- +goose StatementEnd
