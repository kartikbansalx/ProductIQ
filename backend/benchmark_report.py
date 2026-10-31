"""Small smoke/benchmark client for ProductIQ's /api/analyze endpoint.

Usage: python benchmark_report.py "wireless earbuds" --base-url http://127.0.0.1:8000 --runs 3
The report's generation_time_ms is the backend's measured original generation time;
request_latency_ms includes network time and may be much smaller on cache hits.
"""
import argparse
import statistics
import time

import requests


def main():
    parser = argparse.ArgumentParser(description="Benchmark ProductIQ report generation")
    parser.add_argument("product_name")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--runs", type=int, default=3)
    args = parser.parse_args()

    latencies = []
    for index in range(max(1, args.runs)):
        started = time.perf_counter()
        response = requests.post(
            f"{args.base_url.rstrip('/')}/api/analyze",
            json={"product_name": args.product_name},
            timeout=180,
        )
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        response.raise_for_status()
        report = response.json()
        latencies.append(elapsed_ms)
        print(
            f"Run {index + 1}: HTTP {response.status_code} | "
            f"request={elapsed_ms}ms | "
            f"original_generation={report.get('generation_time_ms')}ms | "
            f"source={report.get('report_source')} | "
            f"trends={report.get('trends_source')}"
        )

    print(f"Average request latency: {int(statistics.mean(latencies))}ms")
    print("Note: after the first successful run, later runs may be Redis/Supabase cache hits.")


if __name__ == "__main__":
    main()
