from datetime import datetime, timedelta, timezone

from report_utils import (
    calculate_pricing_metrics,
    is_report_fresh,
    normalize_product_key,
    attach_report_metadata,
)


def test_normalize_product_key_collapses_case_and_whitespace():
    assert normalize_product_key("  Smart  WATCH ") == "smart watch"


def test_pricing_math_is_deterministic_and_rounds_values():
    result = calculate_pricing_metrics({
        "import_price_est": 600,
        "customs_duty_pct": 20,
        "gst_pct": 18,
        "shipping_cost_est": 80,
        "clearance_fees_est": 30,
        "suggested_msrp": 1499,
        "avg_price": 1499,
    })
    assert result["customs_amount"] == 120.0
    assert result["gst_amount"] == 129.6
    assert result["landed_cost_est"] == 959.6
    assert result["net_profit_est"] == 539.4
    assert result["gross_margin_pct"] == 35.98
    assert result["roi_pct"] == 56.21
    assert result["breakeven_units"] == 927  # ceil(500000 / 539.4)


def test_pricing_handles_zero_values_without_division_errors():
    result = calculate_pricing_metrics({
        "import_price_est": 0,
        "customs_duty_pct": 0,
        "gst_pct": 0,
        "shipping_cost_est": 0,
        "clearance_fees_est": 0,
        "suggested_msrp": 0,
    })
    assert result["landed_cost_est"] == 0
    assert result["gross_margin_pct"] == 0
    assert result["roi_pct"] == 0
    assert result["breakeven_units"] == 0


def test_report_freshness_uses_expiry_timestamp():
    future = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    assert is_report_fresh({"expires_at": future}) is True
    assert is_report_fresh({"expires_at": past}) is False


def test_report_freshness_supports_legacy_generated_at():
    recent = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    stale = (datetime.now(timezone.utc) - timedelta(days=45)).isoformat()
    assert is_report_fresh({"generated_at": recent}, max_age_days=30) is True
    assert is_report_fresh({"generated_at": stale}, max_age_days=30) is False
    assert is_report_fresh({}) is False


def test_metadata_records_trends_provenance_and_generation_timings():
    report = {"pricing": {"import_price_est": 100, "customs_duty_pct": 10,
                           "gst_pct": 18, "shipping_cost_est": 10,
                           "clearance_fees_est": 5, "suggested_msrp": 300}}
    metadata = attach_report_metadata(
        report,
        {"source": "simulated", "fetched_at": "2026-10-31T10:00:00+00:00", "values": {"Oct": 50}},
        "2026-10-31T10:01:00+00:00",
        1234,
        {"data_collection": 500, "gemini_and_validation": 700},
        "generated",
    )
    assert metadata["trends_source"] == "simulated"
    assert metadata["generation_time_ms"] == 1234
    assert metadata["generation_stages_ms"]["data_collection"] == 500
    assert metadata["report_source"] == "generated"
    assert metadata["pricing"]["customs_amount"] == 10
