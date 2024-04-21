-- +goose Up
-- +goose StatementBegin
SELECT 'up SQL query';

TRUNCATE TABLE simple_checker_run;

ALTER TABLE simple_checker_run ADD COLUMN check_variant text NOT NULL;

ALTER TABLE checker_run ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 'down SQL query';
-- +goose StatementEnd
