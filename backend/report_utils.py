"""Pure helpers for ProductIQ report freshness, deterministic pricing and metadata."""
import math
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

def normalize_product_key(product_name: str) -> str:
    """Normalize equivalent whitespace/case variants into one stable DB/cache key."""
    return re.sub(r"\s+", " ", product_name.strip().lower())


def is_report_fresh(record: Dict[str, Any], max_age_days: int = 30) -> bool:
    """Check stored report freshness; supports new expires_at and legacy created_at rows."""
    expires_at = record.get("expires_at")
    timestamp = expires_at or record.get("generated_at") or record.get("created_at")
    if not timestamp:
        return False
    try:
        parsed = datetime.fromisoformat(str(timestamp).replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        if expires_at:
            return parsed > now
        return now - parsed <= timedelta(days=max_age_days)
    except (TypeError, ValueError):
        return False


def calculate_pricing_metrics(pricing: Dict[str, Any], capital_budget: float = 500000) -> Dict[str, Any]:
    """Recalculate financial outputs deterministically; AI supplies only assumptions."""
    p = dict(pricing)
    import_price = max(0.0, float(p.get("import_price_est") or 0))
    customs_pct = max(0.0, float(p.get("customs_duty_pct") or 0))
    gst_pct = max(0.0, float(p.get("gst_pct") or 0))
    shipping = max(0.0, float(p.get("shipping_cost_est") or 0))
    clearance = max(0.0, float(p.get("clearance_fees_est") or 0))
    msrp = max(0.0, float(p.get("suggested_msrp") or p.get("avg_price") or 0))

    customs_amount = import_price * customs_pct / 100.0
    gst_amount = (import_price + customs_amount) * gst_pct / 100.0
    landed_cost = import_price + customs_amount + gst_amount + shipping + clearance
    net_profit = msrp - landed_cost
    gross_margin = (net_profit / msrp * 100.0) if msrp > 0 else 0.0
    roi = (net_profit / landed_cost * 100.0) if landed_cost > 0 else 0.0
    # Units needed for cumulative per-unit contribution to recover the stated ₹5L target.
    breakeven_units = math.ceil(capital_budget / net_profit) if net_profit > 0 else 0

    p.update({
        "customs_amount": round(customs_amount, 2),
        "gst_amount": round(gst_amount, 2),
        "landed_cost_est": round(landed_cost, 2),
        "net_profit_est": round(net_profit, 2),
        "gross_margin_pct": round(gross_margin, 2),
        "roi_pct": round(roi, 2),
        "breakeven_units": int(breakeven_units),
    })
    return p


def attach_report_metadata(report_data: Dict[str, Any], trends_meta: Dict[str, Any],
                           generated_at: str, total_ms: int,
                           stage_timings: Dict[str, int], report_source: str) -> Dict[str, Any]:
    report_data["pricing"] = calculate_pricing_metrics(report_data.get("pricing", {}))
    report_data["trends_source"] = trends_meta.get("source", "unknown")
    report_data["trends_fetched_at"] = trends_meta.get("fetched_at")
    report_data["generated_at"] = generated_at
    report_data["generation_time_ms"] = int(total_ms)
    report_data["generation_stages_ms"] = stage_timings
    report_data["report_source"] = report_source
    return report_data

