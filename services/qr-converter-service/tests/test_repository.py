from app.repository import ConversionRepository


def test_repository_add_and_list() -> None:
    repo = ConversionRepository()

    repo.add(source="upn-string", iban="SI56290000159800373", amount=5.38)
    repo.add(source="pdf-upnqr", iban="SI56290000159800373", amount=12.0)

    records = repo.list()
    assert len(records) == 2
    assert records[0].source == "upn-string"
    assert records[0].amount == 5.38
    assert records[1].source == "pdf-upnqr"


def test_repository_clear() -> None:
    repo = ConversionRepository()
    repo.add(source="upn-string", iban=None, amount=None)

    repo.clear()

    assert len(repo.list()) == 0
