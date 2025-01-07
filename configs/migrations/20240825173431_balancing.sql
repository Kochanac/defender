-- +goose Up
-- +goose StatementBegin

CREATE TABLE workers (
    id serial PRIMARY KEY,

    worker_id text,
    weight int
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE workers;

-- +goose StatementEnd
