"""TypeSafe / Jev client + connectivity check. Key is read from ~/.workbuddy/typesafe.key (never hardcoded)."""
import json
import os
import urllib.request
import urllib.error
from pathlib import Path

KEY_FILE = Path(r"C:\Users\Administrator\.workbuddy\typesafe.key")
ENDPOINT = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"


def load_key() -> str:
    for cand in [KEY_FILE,
                 Path.home() / ".workbuddy" / "typesafe.key",
                 Path(os.environ.get("TYPESAFE_KEY_FILE", "/nonexistent"))]:
        if cand and cand.is_file():
            k = cand.read_text(encoding="utf-8").strip()
            if k:
                return k
    k = os.environ.get("TYPESAFE_API_KEY", "").strip()
    if k:
        return k
    raise SystemExit("no TypeSafe key found")


def ask(state, questions, model: str = MODEL, timeout: int = 60) -> dict:
    """One TypeSafe call. `questions` is a map id -> Question dict."""
    payload = {"state": state, "model": model, "questions": questions}
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        ENDPOINT, data=body, method="POST",
        headers={"Authorization": f"Bearer {load_key()}",
                 "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "ignore")[:600]
        return {"_http_error": e.code, "_detail": detail}
    except Exception as e:
        return {"_error": f"{type(e).__name__}: {e}"}


if __name__ == "__main__":
    print("=== connectivity check ===")
    res = ask("Help! My payouts have been failing for 3 days.",
              {"is_urgent": {"type": "noul",
                             "instructions": "Does this convey urgency?",
                             "criteria": {"true": "Explicitly time-sensitive",
                                          "false": "No urgency expressed"}}})
    print(json.dumps(res, ensure_ascii=False, indent=2))
