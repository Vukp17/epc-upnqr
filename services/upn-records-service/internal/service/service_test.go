package service_test

import (
	"context"
	"database/sql"
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"upn-records-service/internal/db"
	"upn-records-service/internal/repository"
	"upn-records-service/internal/service"
	pb "upn-records-service/proto"
)

func setupService(t *testing.T) *service.UPNRecordsService {
	t.Helper()
	var database *sql.DB
	var err error
	database, err = db.Open(":memory:")
	if err != nil {
		t.Fatalf("open test db: %v", err)
	}
	t.Cleanup(func() { database.Close() })
	return service.New(repository.New(database))
}

// ── SaveConversion ────────────────────────────────────────────────────────────

func TestSaveConversion_ValidRequest(t *testing.T) {
	svc := setupService(t)

	resp, err := svc.SaveConversion(context.Background(), &pb.SaveConversionRequest{
		Source:        "pdf-upnqr",
		Iban:          "SI56290000159800373",
		Amount:        5.38,
		Currency:      "EUR",
		RecipientName: "A1 Slovenija d.d.",
		Purpose:       "Storitve",
		Reference:     "SI122512252875501",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Record.Id == "" {
		t.Error("expected non-empty record ID")
	}
	if resp.Record.Iban != "SI56290000159800373" {
		t.Errorf("IBAN: got %q", resp.Record.Iban)
	}
}

func TestSaveConversion_InvalidIBAN_ReturnsInvalidArgument(t *testing.T) {
	svc := setupService(t)

	_, err := svc.SaveConversion(context.Background(), &pb.SaveConversionRequest{
		Iban:          "NOT_VALID",
		Amount:        10,
		Currency:      "EUR",
		RecipientName: "Test",
	})
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if status.Code(err) != codes.InvalidArgument {
		t.Errorf("expected InvalidArgument, got %s", status.Code(err))
	}
}

func TestSaveConversion_ZeroAmount_ReturnsInvalidArgument(t *testing.T) {
	svc := setupService(t)

	_, err := svc.SaveConversion(context.Background(), &pb.SaveConversionRequest{
		Iban:          "SI56290000159800373",
		Amount:        0,
		Currency:      "EUR",
		RecipientName: "Test",
	})
	if status.Code(err) != codes.InvalidArgument {
		t.Errorf("expected InvalidArgument, got %s", status.Code(err))
	}
}

// ── ListConversions ───────────────────────────────────────────────────────────

func TestListConversions_EmptyDB(t *testing.T) {
	svc := setupService(t)

	resp, err := svc.ListConversions(context.Background(), &pb.ListConversionsRequest{Limit: 10})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Total != 0 || len(resp.Records) != 0 {
		t.Errorf("expected empty list, got total=%d records=%d", resp.Total, len(resp.Records))
	}
}

func TestListConversions_ReturnsSavedRecords(t *testing.T) {
	svc := setupService(t)
	ctx := context.Background()

	for i := 0; i < 3; i++ {
		_, err := svc.SaveConversion(ctx, &pb.SaveConversionRequest{
			Source:        "upn-string",
			Iban:          "SI56290000159800373",
			Amount:        float64(i+1) * 10,
			Currency:      "EUR",
			RecipientName: "Test Recipient",
		})
		if err != nil {
			t.Fatalf("SaveConversion %d: %v", i, err)
		}
	}

	resp, err := svc.ListConversions(ctx, &pb.ListConversionsRequest{Limit: 10})
	if err != nil {
		t.Fatalf("ListConversions: %v", err)
	}
	if resp.Total != 3 {
		t.Errorf("total: got %d, want 3", resp.Total)
	}
	if len(resp.Records) != 3 {
		t.Errorf("len(records): got %d, want 3", len(resp.Records))
	}
}

// ── GetConversionById ─────────────────────────────────────────────────────────

func TestGetConversionById_Found(t *testing.T) {
	svc := setupService(t)
	ctx := context.Background()

	saved, _ := svc.SaveConversion(ctx, &pb.SaveConversionRequest{
		Iban:          "SI56290000159800373",
		Amount:        99.99,
		Currency:      "EUR",
		RecipientName: "Recipient",
	})

	got, err := svc.GetConversionById(ctx, &pb.GetConversionByIdRequest{Id: saved.Record.Id})
	if err != nil {
		t.Fatalf("GetConversionById: %v", err)
	}
	if got.Id != saved.Record.Id {
		t.Errorf("ID mismatch: got %q, want %q", got.Id, saved.Record.Id)
	}
}

func TestGetConversionById_NotFound(t *testing.T) {
	svc := setupService(t)

	_, err := svc.GetConversionById(context.Background(), &pb.GetConversionByIdRequest{Id: "ghost-id"})
	if status.Code(err) != codes.NotFound {
		t.Errorf("expected NotFound, got %s", status.Code(err))
	}
}

// ── ValidatePayment ───────────────────────────────────────────────────────────

func TestValidatePayment_Valid(t *testing.T) {
	svc := setupService(t)

	resp, err := svc.ValidatePayment(context.Background(), &pb.ValidatePaymentRequest{
		Iban:          "SI56290000159800373",
		Amount:        10,
		Currency:      "EUR",
		RecipientName: "Test",
	})
	if err != nil {
		t.Fatalf("ValidatePayment: %v", err)
	}
	if !resp.Valid {
		t.Errorf("expected valid=true, errors: %v", resp.Errors)
	}
}

func TestValidatePayment_Invalid(t *testing.T) {
	svc := setupService(t)

	resp, err := svc.ValidatePayment(context.Background(), &pb.ValidatePaymentRequest{
		Iban:          "BAD",
		Amount:        -1,
		Currency:      "XYZ",
		RecipientName: "",
	})
	if err != nil {
		t.Fatalf("ValidatePayment: %v", err)
	}
	if resp.Valid {
		t.Error("expected valid=false")
	}
	if len(resp.Errors) == 0 {
		t.Error("expected at least one error message")
	}
}
