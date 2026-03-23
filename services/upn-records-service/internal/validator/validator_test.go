package validator_test

import (
	"strings"
	"testing"

	"upn-records-service/internal/validator"
)

func TestValidatePayment_Valid(t *testing.T) {
	errs := validator.ValidatePayment(validator.PaymentData{
		IBAN:          "SI56290000159800373",
		Amount:        5.38,
		Currency:      "EUR",
		RecipientName: "A1 Slovenija d.d.",
		Reference:     "SI122512252875501",
	})
	if len(errs) != 0 {
		t.Errorf("expected no errors, got: %v", errs)
	}
}

func TestValidatePayment_InvalidIBAN(t *testing.T) {
	errs := validator.ValidatePayment(validator.PaymentData{
		IBAN:          "NOT-AN-IBAN",
		Amount:        10,
		Currency:      "EUR",
		RecipientName: "Test",
	})
	if !containsSubstring(errs, "IBAN") {
		t.Errorf("expected IBAN error, got: %v", errs)
	}
}

func TestValidatePayment_ZeroAmount(t *testing.T) {
	errs := validator.ValidatePayment(validator.PaymentData{
		IBAN:          "SI56290000159800373",
		Amount:        0,
		Currency:      "EUR",
		RecipientName: "Test",
	})
	if !containsSubstring(errs, "amount") {
		t.Errorf("expected amount error, got: %v", errs)
	}
}

func TestValidatePayment_NegativeAmount(t *testing.T) {
	errs := validator.ValidatePayment(validator.PaymentData{
		IBAN:          "SI56290000159800373",
		Amount:        -1,
		Currency:      "EUR",
		RecipientName: "Test",
	})
	if !containsSubstring(errs, "amount") {
		t.Errorf("expected amount error, got: %v", errs)
	}
}

func TestValidatePayment_ExceedMaxAmount(t *testing.T) {
	errs := validator.ValidatePayment(validator.PaymentData{
		IBAN:          "SI56290000159800373",
		Amount:        1_000_000,
		Currency:      "EUR",
		RecipientName: "Test",
	})
	if !containsSubstring(errs, "maximum") {
		t.Errorf("expected max-amount error, got: %v", errs)
	}
}

func TestValidatePayment_UnsupportedCurrency(t *testing.T) {
	errs := validator.ValidatePayment(validator.PaymentData{
		IBAN:          "SI56290000159800373",
		Amount:        10,
		Currency:      "RSD",
		RecipientName: "Test",
	})
	if !containsSubstring(errs, "currency") {
		t.Errorf("expected currency error, got: %v", errs)
	}
}

func TestValidatePayment_EmptyRecipientName(t *testing.T) {
	errs := validator.ValidatePayment(validator.PaymentData{
		IBAN:          "SI56290000159800373",
		Amount:        10,
		Currency:      "EUR",
		RecipientName: "   ",
	})
	if !containsSubstring(errs, "recipient_name") {
		t.Errorf("expected recipient_name error, got: %v", errs)
	}
}

func TestValidatePayment_MultipleErrors(t *testing.T) {
	errs := validator.ValidatePayment(validator.PaymentData{
		IBAN:          "BAD",
		Amount:        0,
		Currency:      "XYZ",
		RecipientName: "",
	})
	if len(errs) < 3 {
		t.Errorf("expected at least 3 errors, got %d: %v", len(errs), errs)
	}
}

func containsSubstring(errs []string, sub string) bool {
	for _, e := range errs {
		if strings.Contains(strings.ToLower(e), strings.ToLower(sub)) {
			return true
		}
	}
	return false
}
