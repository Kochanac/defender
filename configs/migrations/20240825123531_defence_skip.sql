-- +goose Up
-- +goose StatementBegin

ALTER TABLE tasks ADD COLUMN defence_skip boolean DEFAULT false NOT NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE tasks DROP COLUMN defence_skip;

-- +goose StatementEnd
