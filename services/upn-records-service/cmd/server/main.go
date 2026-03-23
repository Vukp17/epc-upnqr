package main

import (
	"context"
	"log/slog"
	"net"
	"os"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"upn-records-service/internal/db"
	"upn-records-service/internal/repository"
	"upn-records-service/internal/service"
	pb "upn-records-service/proto"
)

func main() {
	// Structured JSON logging (stdout)
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	// ── Database ──────────────────────────────────────────────────────────────
	dbPath := envOr("DB_PATH", "data/upn-records.db")

	database, err := db.Open(dbPath)
	if err != nil {
		slog.Error("cannot open database", "error", err)
		os.Exit(1)
	}
	defer database.Close()

	// ── gRPC server ───────────────────────────────────────────────────────────
	port := envOr("GRPC_PORT", "50051")

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		slog.Error("cannot listen", "port", port, "error", err)
		os.Exit(1)
	}

	repo := repository.New(database)
	svc := service.New(repo)

	grpcServer := grpc.NewServer(
		grpc.ChainUnaryInterceptor(loggingInterceptor),
	)
	pb.RegisterUPNRecordsServiceServer(grpcServer, svc)
	reflection.Register(grpcServer) // allows grpcurl / Postman gRPC discovery

	slog.Info("UPN Records Service started", "port", port, "db", dbPath)

	if err := grpcServer.Serve(lis); err != nil {
		slog.Error("server stopped", "error", err)
		os.Exit(1)
	}
}

func loggingInterceptor(
	ctx context.Context,
	req any,
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (any, error) {
	slog.Info("gRPC call", "method", info.FullMethod)
	resp, err := handler(ctx, req)
	if err != nil {
		slog.Error("gRPC error", "method", info.FullMethod, "error", err)
	}
	return resp, err
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
