.PHONY: generate deps build test docker-build clean

PROTO_SRC := proto/upnrecords.proto

## generate: run protoc to produce proto/*.pb.go (requires protoc + plugins)
generate:
	protoc \
	  --go_out=. --go_opt=paths=source_relative \
	  --go-grpc_out=. --go-grpc_opt=paths=source_relative \
	  $(PROTO_SRC)

## deps: download Go modules (run after 'make generate')
deps:
	go mod tidy

## build: generate + compile the server binary into bin/
build: generate deps
	go build -o bin/server ./cmd/server

## test: run all unit tests (requires 'make generate' first)
test:
	go test -v ./...

## docker-build: build the Docker image (proto generation handled inside)
docker-build:
	docker build -t upn-records-service:latest .

## clean: remove generated files and built binary
clean:
	rm -f bin/server
	rm -f proto/*.pb.go

# ── Local setup instructions ──────────────────────────────────────────────────
# macOS:
#   brew install protobuf
#   go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
#   go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
#   make generate deps test
#
# Docker (no local tooling required):
#   make docker-build
