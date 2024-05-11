-- +goose Up
-- +goose StatementBegin

-- needs temporal shutdown
ALTER TABLE machine_assignment ADD COLUMN image_path TEXT NOT NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE machine_assignment DROP COLUMN image_path;
-- +goose StatementEnd
