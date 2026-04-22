# Angular Frontend Setup & Running

## What's Been Implemented

### Project Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── models/
│   │   │   └── convert-response.model.ts       # TypeScript interfaces for API responses
│   │   ├── services/
│   │   │   └── qr-converter.service.ts         # HTTP client service (3 API methods)
│   │   ├── components/
│   │   │   ├── health-status/                  # Service health badge (polls every 5s)
│   │   │   ├── pdf-upload/                     # PDF file upload form
│   │   │   ├── upn-string-input/               # UPN string textarea form
│   │   │   └── conversion-result/              # Result display (UPN data, QR image, EPC payload)
│   │   ├── app.ts                              # Root component (assembles all components)
│   │   ├── app.scss                            # App-level styles
│   │   └── app.config.ts                       # Angular config with HttpClient provider
│   ├── environments/
│   │   └── environment.ts                      # API base URL config
│   ├── styles.scss                             # Global styles
│   └── main.ts
├── angular.json
├── package.json
└── tsconfig.json
```

### Components

#### 1. **HealthStatusComponent**
- Polls `GET /health` every 5 seconds
- Shows green "Service Online" or red "Service Offline" badge
- Live status indicator with pulsing animation

#### 2. **PdfUploadComponent**
- File picker (restricted to `.pdf`)
- "Convert" button
- Calls `POST /api/convert/pdf`
- Emits `ConvertResponse` on success
- Shows inline error messages on failure

#### 3. **UpnStringInputComponent**
- Textarea for raw UPN payload
- "Convert" button
- Calls `POST /api/convert/upn-string`
- Emits `ConvertResponse` on success
- Shows inline error messages on failure

#### 4. **ConversionResultComponent**
- Displays source (PDF Upload or UPN String)
- Shows parsed UPN data in a table
- Displays EPC payload in a `<pre>` block
- Renders EPC QR code as a base64 PNG image

### Service (QrConverterService)
- `checkHealth()` — GET /health
- `convertPdf(file)` — POST /api/convert/pdf
- `convertUpnString(payload)` — POST /api/convert/upn-string

All endpoints point to `http://localhost:8001` (configurable in `src/environments/environment.ts`)

---

## Running the Project

### Prerequisites
- Backend service running on port 8001 (see backend README)
- Node.js 18+ installed

### 1. Start the Backend
```bash
cd services/qr-converter-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

The backend should now have CORS enabled for `http://localhost:4200`.

### 2. Start the Frontend
```bash
cd frontend
npm install  # (optional, already done during scaffolding)
npm start
# or
ng serve
```

The app will be available at `http://localhost:4200`

### 3. Build for Production
```bash
cd frontend
npm run build
# Output: frontend/dist/frontend
```

---

## Features

✅ **Health Check** — Real-time service status  
✅ **PDF Conversion** — Upload PDF, extract UPN, generate EPC QR  
✅ **UPN String Conversion** — Paste raw UPN string, generate EPC QR  
✅ **Result Visualization** — See parsed data, QR image, and EPC payload  
✅ **Error Handling** — User-friendly error messages  
✅ **Responsive Design** — Works on mobile and desktop  
✅ **Component-Based** — Clean, reusable, standalone components  
✅ **No External UI Library** — Plain SCSS styling only  

---

## Testing the APIs

### Test with a PDF
1. Open `http://localhost:4200`
2. Verify the health badge is green
3. Click "Choose a PDF file" and select a PDF with a UPN QR code
4. Click "Convert"
5. See the result below

### Test with UPN String
1. Open `http://localhost:4200`
2. Paste a UPN payload into the textarea (e.g., from the backend README example)
3. Click "Convert"
4. See the result below

### Example UPN String (from backend README)
```
UPNQR


G. VUK PAPIC
KOROSKA CESTA 80
2000 MARIBOR
00000000538


OTLC
Storitve 25.11. do 24.12.2025
09.01.2026
SI56290000159800373
SI122512252875501
A1 Slovenija, d. d.
Ameriska ulica 4
1000 Ljubljana
203
```

---

## Next Steps (Optional Enhancements)

- Add environment-specific config (development, production, staging)
- Add unit tests for components and service
- Add E2E tests with Cypress or Playwright
- Add loading spinner for better UX
- Add copy-to-clipboard for EPC payload
- Export results as PDF or JSON
- Add Docker configuration for frontend deployment
