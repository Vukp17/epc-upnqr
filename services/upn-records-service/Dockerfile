# ── Stage 1: generate proto + build ──────────────────────────────────────────
FROM golang:1.23-alpine AS builder

# protoc and the two Go plugins
RUN apk add --no-cache protobuf protobuf-dev
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.2
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.5.1

WORKDIR /app

# Copy everything
COPY . .

# Generate Go bindings from proto/upnrecords.proto
# Output lands in proto/ alongside the .proto file (source-relative paths)
RUN protoc \
      --go_out=. --go_opt=paths=source_relative \
      --go-grpc_out=. --go-grpc_opt=paths=source_relative \
      proto/upnrecords.proto

# Resolve dependencies (also writes go.sum if missing)
RUN go mod tidy

# Static binary — no CGO needed thanks to modernc.org/sqlite
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# ── Stage 2: minimal runtime ──────────────────────────────────────────────────
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
RUN mkdir -p /data

COPY --from=builder /server /app/server

EXPOSE 50051

ENV DB_PATH=/data/upn-records.db
ENV GRPC_PORT=50051

ENTRYPOINT ["/app/server"]
