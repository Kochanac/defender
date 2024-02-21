-- +goose Up
-- +goose StatementBegin
SELECT 'up SQL query';

ALTER TABLE machine_assignment ADD COLUMN worker_hostname text NOT NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 'down SQL query';

ALTER TABLE machine_assignment DROP COLUMN worker_hostname;
-- +goose StatementEnd
