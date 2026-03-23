package repository_test

import (
	"context"
	"database/sql"
	"testing"

	"upn-records-service/internal/db"
	"upn-records-service/internal/repository"
)

func setupDB(t *testing.T) *sql.DB {
	t.Helper()
	database, err := db.Open(":memory:")
	if err != nil {
		t.Fatalf("open test db: %v", err)
	}
	t.Cleanup(func() { database.Close() })
	return database
}

func TestSave_AssignsIDAndTimestamp(t *testing.T) {
	repo := repository.New(setupDB(t))

	rec, err := repo.Save(context.Background(), repository.ConversionRecord{
		Source:        "pdf-upnqr",
		IBAN:          "SI56290000159800373",
		Amount:        100.00,
		Currency:      "EUR",
		RecipientName: "A1 Slovenija d.d.",
	})
	if err != nil {
		t.Fatalf("Save: %v", err)
	}

	if rec.ID == "" {
		t.Error("expected non-empty ID")
	}
	if rec.CreatedAt == "" {
		t.Error("expected non-empty CreatedAt")
	}
}

func TestGetByID_ReturnsRecord(t *testing.T) {
	repo := repository.New(setupDB(t))
	ctx := context.Background()

	saved, err := repo.Save(ctx, repository.ConversionRecord{
		Source:        "upn-string",
		IBAN:          "SI56290000159800373",
		Amount:        5.38,
		Currency:      "EUR",
		RecipientName: "Test",
		Purpose:       "Storitve",
		Reference:     "SI122512252875501",
	})
	if err != nil {
		t.Fatalf("Save: %v", err)
	}

	retrieved, err := repo.GetByID(ctx, saved.ID)
	if err != nil {
		t.Fatalf("GetByID: %v", err)
	}

	if retrieved.IBAN != saved.IBAN {
		t.Errorf("IBAN: got %q, want %q", retrieved.IBAN, saved.IBAN)
	}
	if retrieved.Amount != saved.Amount {
		t.Errorf("Amount: got %v, want %v", retrieved.Amount, saved.Amount)
	}
}

func TestGetByID_NotFound(t *testing.T) {
	repo := repository.New(setupDB(t))

	_, err := repo.GetByID(context.Background(), "nonexistent-id")
	if err == nil {
		t.Error("expected error for missing ID")
	}
}

func TestList_PaginationAndTotal(t *testing.T) {
	repo := repository.New(setupDB(t))
	ctx := context.Background()

	for i := 0; i < 5; i++ {
		_, err := repo.Save(ctx, repository.ConversionRecord{
			Source:        "upn-string",
			IBAN:          "SI56290000159800373",
			Amount:        float64(i+1) * 10,
			Currency:      "EUR",
			RecipientName: "Test",
		})
		if err != nil {
			t.Fatalf("Save %d: %v", i, err)
		}
	}

	records, total, err := repo.List(ctx, 3, 0)
	if err != nil {
		t.Fatalf("List: %v", err)
	}

	if total != 5 {
		t.Errorf("total: got %d, want 5", total)
	}
	if len(records) != 3 {
		t.Errorf("len(records): got %d, want 3", len(records))
	}
}

func TestList_EmptyTable(t *testing.T) {
	repo := repository.New(setupDB(t))

	records, total, err := repo.List(context.Background(), 10, 0)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if total != 0 {
		t.Errorf("expected total=0, got %d", total)
	}
	if len(records) != 0 {
		t.Errorf("expected no records, got %d", len(records))
	}
}
