-- +goose Up
-- +goose StatementBegin

ALTER TABLE machine_assignment ADD COLUMN created_at timestamptz DEFAULT now() NOT NULL;
DROP TABLE defences;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE machine_assignment DROP COLUMN created_at timestamptz DEFAULT now() NOT NULL;

-- +goose StatementEnd
