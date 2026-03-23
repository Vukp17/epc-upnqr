package validator

import (
	"fmt"
	"regexp"
	"strings"
)

var ibanRegex = regexp.MustCompile(`^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$`)

// PaymentData holds the fields to validate.
type PaymentData struct {
	IBAN          string
	Amount        float64
	Currency      string
	RecipientName string
	Reference     string
}

// ValidatePayment checks the given PaymentData and returns a slice of error messages.
// An empty slice means the data is valid.
func ValidatePayment(d PaymentData) []string {
	var errs []string

	// IBAN
	normalized := strings.ToUpper(strings.ReplaceAll(d.IBAN, " ", ""))
	if !ibanRegex.MatchString(normalized) {
		errs = append(errs, fmt.Sprintf("invalid IBAN format: %q", d.IBAN))
	}

	// Amount
	if d.Amount <= 0 {
		errs = append(errs, "amount must be greater than 0")
	} else if d.Amount > 999_999.99 {
		errs = append(errs, "amount exceeds maximum allowed value of 999999.99")
	}

	// Currency
	supported := map[string]bool{"EUR": true, "USD": true, "GBP": true, "CHF": true}
	if !supported[strings.ToUpper(d.Currency)] {
		errs = append(errs, fmt.Sprintf("unsupported currency: %q (use EUR, USD, GBP, or CHF)", d.Currency))
	}

	// Recipient name
	if strings.TrimSpace(d.RecipientName) == "" {
		errs = append(errs, "recipient_name is required")
	} else if len(d.RecipientName) > 70 {
		errs = append(errs, "recipient_name exceeds 70 characters")
	}

	return errs
}
