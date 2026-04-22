# UPN QR -> Revolut QR sistem za generisanje i štampanje računa

Mikrostoritveni projekat za:
- generisanje UPN QR koda,
- konverziju UPN podataka u Revolut-kompatibilan QR format,
- kreiranje i štampanje računa.

Cilj je razvoj sistema kroz više vežbi, uz jasan GitHub repozitorijum, odvojene servise i dosledno verzionisanje.

## 1. Cilj projekta

Ovaj projekat implementira mikrostoritvenu arhitekturu koja omogućava:
- unos podataka za plaćanje (iznos, primalac, svrha, referenca),
- generisanje validnog UPN QR koda,
- transformaciju istih podataka u Revolut QR payload,
- generisanje računa (PDF/HTML) i slanje na štampu.

## 2. Arhitektura rešenja

Sistem se sastoji od tri mikrostoritve i jedne web aplikacije (UI):

1. `upn-service`
- Validacija ulaznih podataka.
- Generisanje UPN QR sadržaja i slike (PNG/SVG).

2. `revolut-service`
- Preuzimanje UPN payload-a.
- Mapiranje i konverzija u Revolut QR format.
- Povrat QR sadržaja/slike za Revolut plaćanje.

3. `receipt-service`
- Generisanje računa (npr. PDF).
- Evidencija metapodataka računa.

4. `web-app`
- Korisnički interfejs za unos podataka.
- Pozivanje mikrostoritvi preko API-ja.
- Prikaz QR kodova i pokretanje štampe računa.

## 3. Predložena struktura repozitorijuma

```text
.
├─ README.md
├─ docs/
│  ├─ architecture.md
│  ├─ api-contracts.md
│  └─ deployment.md
├─ services/
│  ├─ upn-service/
│  │  ├─ src/
│  │  ├─ tests/
│  │  ├─ Dockerfile
│  │  └─ README.md
│  ├─ revolut-service/
│  │  ├─ src/
│  │  ├─ tests/
│  │  ├─ Dockerfile
│  │  └─ README.md
│  └─ receipt-service/
│     ├─ src/
│     ├─ tests/
│     ├─ Dockerfile
│     └─ README.md
├─ web-app/
│  ├─ src/
│  ├─ public/
│  ├─ tests/
│  ├─ Dockerfile
│  └─ README.md
├─ infra/
│  ├─ docker-compose.yml
│  └─ nginx/
└─ .github/
   └─ workflows/
      ├─ ci.yml
      └─ lint-and-test.yml
```

## 4. Tok podataka

1. Korisnik u `web-app` unosi podatke za plaćanje.
2. `web-app` šalje zahtev ka `upn-service`.
3. `upn-service` vraća UPN QR.
4. Po potrebi, `web-app` šalje payload ka `revolut-service`.
5. `revolut-service` vraća Revolut QR.
6. `web-app` šalje podatke računa ka `receipt-service`.
7. `receipt-service` generiše račun i pokreće štampu.

## 5. API primeri (koncept)

### UPN Service
- `POST /api/upn/generate`
- Request: podaci za UPN nalog
- Response: `upnPayload`, `qrImageBase64`

### Revolut Service
- `POST /api/revolut/convert`
- Request: `upnPayload`
- Response: `revolutPayload`, `qrImageBase64`

### Receipt Service
- `POST /api/receipt/create`
- Request: stavke računa + payment metadata
- Response: `receiptId`, `pdfUrl`

- `POST /api/receipt/print`
- Request: `receiptId` ili `pdfUrl`
- Response: status štampe

## 6. Tehnologije (predlog)

- Backend servisi: Node.js (Express/Nest) ili Python (FastAPI)
- Frontend: React/Vue
- Komunikacija: REST JSON
- Kontejnerizacija: Docker + Docker Compose
- CI/CD: GitHub Actions

## 7. Pokretanje projekta (lokalno)

```bash
# 1) Kloniranje repozitorijuma
git clone https://github.com/<username>/<repo>.git
cd <repo>

# 2) Pokretanje svih servisa
docker compose -f infra/docker-compose.yml up --build
```

Nakon pokretanja:
- `web-app`: `http://localhost:3000` (primer)
- servisi: prema portovima definisanim u `docker-compose.yml`

## 8. Git workflow i verzionisanje

Preporuka za dosledan rad:

1. Kreiraj feature granu:
```bash
git checkout -b feature/upn-generation
```

2. Pravi male i jasne commit-e:
```bash
git add .
git commit -m "feat(upn-service): add payload validator"
```

3. Push na GitHub:
```bash
git push -u origin feature/upn-generation
```

4. Otvori Pull Request ka `main` grani.

Preporuka za poruke commit-a:
- `feat:` nova funkcionalnost
- `fix:` ispravka greške
- `docs:` dokumentacija
- `refactor:` prepravka bez promene ponašanja
- `test:` testovi
- `chore:` održavanje

## 9. Plan razvoja kroz vežbe

- Vežba 1: Inicijalna struktura repozitorijuma + osnovni README
- Vežba 2: Implementacija `upn-service`
- Vežba 3: Implementacija `revolut-service`
- Vežba 4: Implementacija `receipt-service`
- Vežba 5: Integracija `web-app` + end-to-end tok
- Vežba 6: Testovi, CI i dokumentacija

## 10. `upn-records-service` (Go / gRPC)

Servis se nalazi u `services/upn-records-service/` i pisan je u **Go-u**. Izlaže **gRPC API** (port `50051` po defaultu) i čuva zapise o UPN konverzijama u lokalnoj **SQLite** bazi.

### Šta radi

| gRPC metoda | Opis |
|---|---|
| `SaveConversion` | Validira polja plaćanja i čuva novi zapis konverzije u bazi |
| `ListConversions` | Vraća paginiranu listu svih sačuvanih konverzija |
| `GetConversionById` | Dohvata jedan zapis po UUID-u |
| `ValidatePayment` | Validira IBAN, iznos, valutu i ime primaoca — bez čuvanja u bazi |

**Validaciona pravila** (primenjuju se u `SaveConversion` i `ValidatePayment`):
- IBAN mora biti u ispravnom formatu (`SI56...`, `DE89...`, itd.)
- Iznos mora biti između `0.01` i `999 999.99`
- Podržane valute: `EUR`, `USD`, `GBP`, `CHF`
- Ime primaoca: obavezno, max 70 karaktera

### Pokretanje lokalno

```bash
cd services/upn-records-service

# 1) Instaliraj protoc i Go pluginove (samo prvi put, macOS)
brew install protobuf
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# 2) Generiši proto, preuzmi module, izgradi binarni fajl
make build

# 3) Pokreni server (kreira data/upn-records.db automatski)
./bin/server
```

Promenljive okruženja (opcionalne):

| Varijabla | Default | Opis |
|---|---|---|
| `GRPC_PORT` | `50051` | Port na kome sluša gRPC server |
| `DB_PATH` | `data/upn-records.db` | Putanja do SQLite fajla |

### Testiranje

```bash
# Pokreni sve unit testove
make test

# ili direktno
go test -v ./...
```

Testovi pokrivaju:
- `internal/validator` — granični slučajevi za IBAN, iznos, valutu i ime
- `internal/repository` — CRUD operacije nad SQLite in-memory bazom
- `internal/service` — gRPC handler logika

### Testiranje gRPC endpointa (grpcurl)

```bash
# Instaliraj grpcurl
brew install grpcurl

# Prikaži dostupne metode (server reflection je uključen)
grpcurl -plaintext localhost:50051 list

# Sačuvaj konverziju
grpcurl -plaintext -d '{
  "source": "UPN",
  "iban": "SI56020170014356205",
  "amount": 42.50,
  "currency": "EUR",
  "recipient_name": "Janez Novak",
  "purpose": "Račun 2024-001",
  "reference": "SI00123456"
}' localhost:50051 upnrecords.UPNRecordsService/SaveConversion

# Prikaži listu konverzija
grpcurl -plaintext -d '{"limit": 10, "offset": 0}' \
  localhost:50051 upnrecords.UPNRecordsService/ListConversions

# Validiraj plaćanje bez čuvanja
grpcurl -plaintext -d '{
  "iban": "INVALID",
  "amount": -5,
  "currency": "RSD",
  "recipient_name": ""
}' localhost:50051 upnrecords.UPNRecordsService/ValidatePayment
```

### Docker

```bash
# Izgradi image (proto generisanje se radi unutar Dockerfile-a)
make docker-build

# Pokreni kontejner
docker run -p 50051:50051 upn-records-service:latest
```

---

## 11. Autor i licenca

- Autor: `<ime i prezime>`
- Fakultet/predmet: `<naziv predmeta>`
- Licenca: MIT (ili prema zahtevu predmeta)

---

Ako želiš, sledeći korak mogu odmah da uradim:
- generisanje početne strukture foldera,
- dodavanje `docker-compose.yml`,
- kreiranje skeleton-a za sve 3 mikrostoritve i `web-app`.
