package repository

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
)

// ConversionRecord holds a single UPN→EPC conversion entry.
type ConversionRecord struct {
	ID            string
	Source        string
	IBAN          string
	Amount        float64
	Currency      string
	RecipientName string
	Purpose       string
	Reference     string
	CreatedAt     string
}

// Repository provides persistence for ConversionRecords.
type Repository struct {
	db *sql.DB
}

// New creates a Repository backed by the given *sql.DB.
func New(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// Save persists a new ConversionRecord and returns the saved copy (with ID and timestamp).
func (r *Repository) Save(ctx context.Context, rec ConversionRecord) (ConversionRecord, error) {
	rec.ID = uuid.NewString()
	rec.CreatedAt = time.Now().UTC().Format(time.RFC3339)

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO conversions
			(id, source, iban, amount, currency, recipient_name, purpose, reference, created_at)
		VALUES
			(?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, rec.ID, rec.Source, rec.IBAN, rec.Amount, rec.Currency,
		rec.RecipientName, rec.Purpose, rec.Reference, rec.CreatedAt)
	if err != nil {
		return ConversionRecord{}, fmt.Errorf("insert conversion: %w", err)
	}

	slog.Info("conversion saved", "id", rec.ID, "iban", rec.IBAN, "amount", rec.Amount)
	return rec, nil
}

// List returns a page of conversions ordered by most recent first, plus the total count.
func (r *Repository) List(ctx context.Context, limit, offset int) ([]ConversionRecord, int, error) {
	if limit <= 0 {
		limit = 20
	}

	var total int
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM conversions").Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count conversions: %w", err)
	}

	rows, err := r.db.QueryContext(ctx, `
		SELECT id, source, iban, amount, currency, recipient_name, purpose, reference, created_at
		FROM conversions
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list conversions: %w", err)
	}
	defer rows.Close()

	var records []ConversionRecord
	for rows.Next() {
		var rec ConversionRecord
		if err := rows.Scan(
			&rec.ID, &rec.Source, &rec.IBAN, &rec.Amount, &rec.Currency,
			&rec.RecipientName, &rec.Purpose, &rec.Reference, &rec.CreatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scan conversion: %w", err)
		}
		records = append(records, rec)
	}

	return records, total, rows.Err()
}

// GetByID returns the ConversionRecord with the given ID, or an error if not found.
func (r *Repository) GetByID(ctx context.Context, id string) (ConversionRecord, error) {
	var rec ConversionRecord
	err := r.db.QueryRowContext(ctx, `
		SELECT id, source, iban, amount, currency, recipient_name, purpose, reference, created_at
		FROM conversions WHERE id = ?
	`, id).Scan(
		&rec.ID, &rec.Source, &rec.IBAN, &rec.Amount, &rec.Currency,
		&rec.RecipientName, &rec.Purpose, &rec.Reference, &rec.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return ConversionRecord{}, fmt.Errorf("conversion not found: %s", id)
	}
	if err != nil {
		return ConversionRecord{}, fmt.Errorf("get conversion: %w", err)
	}
	return rec, nil
}
