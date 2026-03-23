package service

import (
	"context"
	"log/slog"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "upn-records-service/proto"

	"upn-records-service/internal/repository"
	"upn-records-service/internal/validator"
)

// UPNRecordsService implements the gRPC UPNRecordsServiceServer interface.
type UPNRecordsService struct {
	pb.UnimplementedUPNRecordsServiceServer
	repo *repository.Repository
}

// New creates a new UPNRecordsService.
func New(repo *repository.Repository) *UPNRecordsService {
	return &UPNRecordsService{repo: repo}
}

// SaveConversion validates the request and persists a new ConversionRecord.
func (s *UPNRecordsService) SaveConversion(ctx context.Context, req *pb.SaveConversionRequest) (*pb.SaveConversionResponse, error) {
	slog.Info("SaveConversion", "iban", req.Iban, "amount", req.Amount, "source", req.Source)

	errs := validator.ValidatePayment(validator.PaymentData{
		IBAN:          req.Iban,
		Amount:        req.Amount,
		Currency:      req.Currency,
		RecipientName: req.RecipientName,
	})
	if len(errs) > 0 {
		slog.Warn("SaveConversion validation failed", "errors", errs)
		return nil, status.Errorf(codes.InvalidArgument, "validation failed: %v", errs)
	}

	saved, err := s.repo.Save(ctx, repository.ConversionRecord{
		Source:        req.Source,
		IBAN:          req.Iban,
		Amount:        req.Amount,
		Currency:      req.Currency,
		RecipientName: req.RecipientName,
		Purpose:       req.Purpose,
		Reference:     req.Reference,
	})
	if err != nil {
		slog.Error("SaveConversion db error", "error", err)
		return nil, status.Errorf(codes.Internal, "failed to save: %v", err)
	}

	return &pb.SaveConversionResponse{Record: toProto(saved)}, nil
}

// ListConversions returns a paginated list of stored conversions.
func (s *UPNRecordsService) ListConversions(ctx context.Context, req *pb.ListConversionsRequest) (*pb.ListConversionsResponse, error) {
	slog.Info("ListConversions", "limit", req.Limit, "offset", req.Offset)

	records, total, err := s.repo.List(ctx, int(req.Limit), int(req.Offset))
	if err != nil {
		slog.Error("ListConversions db error", "error", err)
		return nil, status.Errorf(codes.Internal, "failed to list: %v", err)
	}

	out := make([]*pb.ConversionRecord, len(records))
	for i, r := range records {
		out[i] = toProto(r)
	}
	return &pb.ListConversionsResponse{Records: out, Total: int32(total)}, nil
}

// GetConversionById retrieves a single ConversionRecord by its ID.
func (s *UPNRecordsService) GetConversionById(ctx context.Context, req *pb.GetConversionByIdRequest) (*pb.ConversionRecord, error) {
	slog.Info("GetConversionById", "id", req.Id)

	rec, err := s.repo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "not found: %s", req.Id)
	}
	return toProto(rec), nil
}

// ValidatePayment validates payment fields without persisting anything.
func (s *UPNRecordsService) ValidatePayment(_ context.Context, req *pb.ValidatePaymentRequest) (*pb.ValidatePaymentResponse, error) {
	slog.Info("ValidatePayment", "iban", req.Iban, "amount", req.Amount)

	errs := validator.ValidatePayment(validator.PaymentData{
		IBAN:          req.Iban,
		Amount:        req.Amount,
		Currency:      req.Currency,
		RecipientName: req.RecipientName,
		Reference:     req.Reference,
	})
	return &pb.ValidatePaymentResponse{Valid: len(errs) == 0, Errors: errs}, nil
}

func toProto(r repository.ConversionRecord) *pb.ConversionRecord {
	return &pb.ConversionRecord{
		Id:            r.ID,
		Source:        r.Source,
		Iban:          r.IBAN,
		Amount:        r.Amount,
		Currency:      r.Currency,
		RecipientName: r.RecipientName,
		Purpose:       r.Purpose,
		Reference:     r.Reference,
		CreatedAt:     r.CreatedAt,
	}
}
