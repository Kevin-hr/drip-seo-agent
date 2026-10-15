#!/usr/bin/env python3
"""Validate blue-ocean Reddit opportunity reports and hard-gate classifications."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime
from pathlib import Path

SIGNALS = (
    "reddit_activity",
    "external_demand",
    "competition",
    "business_fit",
    "commercial_intent",
    "entry_feasibility",
)
STATUSES = {"verified", "pending", "conflicting", "failed"}
CLASSIFICATIONS = {"confirmed", "provisional", "rejected"}


def parse_day(value: str) -> date:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).date()


def expected_classification(candidate: dict) -> str:
    signals = candidate["signals"]
    statuses = {name: signals[name]["status"] for name in SIGNALS}
    fit = signals["business_fit"].get("level")
    intent = signals["commercial_intent"].get("level")
    entry = signals["entry_feasibility"].get("level")
    if "failed" in statuses.values() or fit == "weak" or intent == "low" or entry == "blocked":
        return "rejected"
    if (
        all(value == "verified" for value in statuses.values())
        and fit == "strong"
        and intent in {"high", "medium"}
        and entry in {"open", "constrained"}
    ):
        return "confirmed"
    return "provisional"


def validate(payload: dict) -> list[str]:
    errors: list[str] = []
    for key in ("run_date", "target_market", "freshness_days", "candidates"):
        if key not in payload:
            errors.append(f"missing top-level field: {key}")
    if errors:
        return errors
    try:
        run_day = parse_day(payload["run_date"])
        freshness = int(payload["freshness_days"])
        if freshness < 1:
            raise ValueError("freshness_days must be positive")
    except (TypeError, ValueError) as exc:
        errors.append(f"invalid run_date or freshness_days: {exc}")
        return errors
    if not isinstance(payload["candidates"], list) or not payload["candidates"]:
        errors.append("candidates must be a non-empty list")
        return errors
    for index, candidate in enumerate(payload["candidates"]):
        label = candidate.get("id", f"candidate[{index}]")
        for key in ("url", "title", "classification", "signals", "missing_data", "confidence", "recheck_on"):
            if key not in candidate:
                errors.append(f"{label}: missing field {key}")
        if "signals" not in candidate:
            continue
        if candidate.get("classification") not in CLASSIFICATIONS:
            errors.append(f"{label}: invalid classification {candidate.get('classification')!r}")
        signals = candidate["signals"]
        for name in SIGNALS:
            if name not in signals:
                errors.append(f"{label}: missing signal {name}")
                continue
            status = signals[name].get("status")
            if status not in STATUSES:
                errors.append(f"{label}.{name}: invalid status {status!r}")
        if any(name not in signals for name in SIGNALS):
            continue
        for name in ("reddit_activity", "external_demand"):
            signal = signals[name]
            if signal.get("status") == "verified":
                for field in ("observed_at", "source_url"):
                    if not signal.get(field):
                        errors.append(f"{label}.{name}: verified signal missing {field}")
                if signal.get("observed_at"):
                    try:
                        age = (run_day - parse_day(signal["observed_at"])).days
                        if age < 0 or age > freshness:
                            errors.append(f"{label}.{name}: evidence age {age} days exceeds freshness window {freshness}")
                    except (TypeError, ValueError) as exc:
                        errors.append(f"{label}.{name}: invalid observed_at: {exc}")
        activity = signals["reddit_activity"]
        if activity.get("status") == "verified":
            values = activity.get("values", {})
            for field in ("votes", "comments", "locked", "removed"):
                if field not in values:
                    errors.append(f"{label}.reddit_activity: verified values missing {field}")
        demand = signals["external_demand"]
        if demand.get("status") == "verified":
            if not demand.get("method"):
                errors.append(f"{label}.external_demand: verified signal missing method")
            values = demand.get("values")
            if not isinstance(values, dict) or not any(value is not None for value in values.values()):
                errors.append(f"{label}.external_demand: verified signal needs at least one measured value")
        competition = signals["competition"]
        if competition.get("status") == "verified" and not competition.get("rationale"):
            errors.append(f"{label}.competition: verified signal missing rationale")
        fit = signals["business_fit"]
        if fit.get("level") not in {"strong", "medium", "weak"}:
            errors.append(f"{label}.business_fit: invalid level {fit.get('level')!r}")
        intent = signals["commercial_intent"]
        if intent.get("level") not in {"high", "medium", "low"}:
            errors.append(f"{label}.commercial_intent: invalid level {intent.get('level')!r}")
        entry = signals["entry_feasibility"]
        if entry.get("level") not in {"open", "constrained", "blocked"}:
            errors.append(f"{label}.entry_feasibility: invalid level {entry.get('level')!r}")
        for name in ("business_fit", "commercial_intent", "entry_feasibility"):
            signal = signals[name]
            if signal.get("status") == "verified" and not signal.get("rationale"):
                errors.append(f"{label}.{name}: verified signal missing rationale")
        if entry.get("status") == "verified" and not entry.get("source_url"):
            errors.append(f"{label}.entry_feasibility: verified signal missing rules source_url")
        expected = expected_classification(candidate)
        claimed = candidate.get("classification")
        if claimed != expected:
            errors.append(f"{label}: classification {claimed!r} violates hard gates; expected {expected!r}")
        if claimed == "confirmed" and candidate.get("missing_data"):
            errors.append(f"{label}: confirmed candidate must not list missing_data")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("report", type=Path)
    args = parser.parse_args()
    payload = json.loads(args.report.read_text(encoding="utf-8"))
    errors = validate(payload)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print(f"OK: validated {len(payload['candidates'])} candidate(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
