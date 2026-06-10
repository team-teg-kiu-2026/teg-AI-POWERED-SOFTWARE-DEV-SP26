"""Pytest bootstrap: put backend/ on the import path so tests can
`import ai`, `import app`, and `import db` from the repo root."""
import sys
from pathlib import Path

BACKEND = Path(__file__).parent / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))
