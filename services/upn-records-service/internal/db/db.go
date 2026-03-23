package db

import (
	"database/sql"
	"fmt"
	"log/slog"

	_ "modernc.org/sqlite"
)

// Open opens (or creates) a SQLite database at path and applies migrations.
func Open(path string) (*sql.DB, error) {
	database, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}

	if err := database.Ping(); err != nil {
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}

	if err := migrate(database); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}

	slog.Info("database ready", "path", path)
	return database, nil
}

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS conversions (
			id             TEXT PRIMARY KEY,
			source         TEXT NOT NULL,
			iban           TEXT NOT NULL,
			amount         REAL NOT NULL,
			currency       TEXT NOT NULL DEFAULT 'EUR',
			recipient_name TEXT NOT NULL DEFAULT '',
			purpose        TEXT NOT NULL DEFAULT '',
			reference      TEXT NOT NULL DEFAULT '',
			created_at     TEXT NOT NULL
		)
	`)
	return err
}
