from pathlib import Path
import sys

# Ensure imports like `from app.main import app` work in CI and locally.
SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))
