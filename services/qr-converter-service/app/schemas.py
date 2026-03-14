from pydantic import BaseModel, Field


class UPNParsedData(BaseModel):
    recipient_name: str | None = Field(default=None)
    iban: str | None = Field(default=None)
    amount: float | None = Field(default=None)
    currency: str = Field(default="EUR")
    purpose_code: str | None = Field(default=None)
    purpose: str | None = Field(default=None)
    reference: str | None = Field(default=None)
    payer_name: str | None = Field(default=None)


class ConvertResponse(BaseModel):
    source: str = Field(default="pdf-upnqr")
    upn_raw_payload: str
    upn_parsed: UPNParsedData
    epc_payload: str
    epc_qr_png_base64: str


class ConvertUPNStringRequest(BaseModel):
    upn_payload: str = Field(min_length=1, description="Raw UPNQR string scanned by mobile camera")
