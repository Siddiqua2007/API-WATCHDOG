# Results Summary (auto-generated from DetectorLog)

Generated on: 2026-07-24T09:38:33.121Z
Study endpoints included: Study - Normal, Study - Latency, Study - Failure, Study - Schema
Total labeled checks scored: 175

## Table 1 — Detector Comparison (Precision / Recall / F1)

| Metric | Your Detector (p95 threshold) | Baseline (z-score) |
|---|---|---|
| Precision | 57.7% | 51.4% |
| Recall | 31.9% | 40.4% |
| F1 Score | 41.1% | 45.2% |
| Accuracy | 75.4% | 73.7% |

## Table 2 — Confusion Matrix

| | Your Detector | Baseline Detector |
|---|---|---|
| True Positives | 15 | 19 |
| False Positives | 11 | 18 |
| False Negatives | 32 | 28 |
| True Negatives | 117 | 110 |

## Table 3 — Per-Fault-Type Recall

| Fault Type | Sample Count | Your Detector Caught | Baseline Caught |
|---|---|---|---|
| latency_spike | 10 | 2/10 (20.0%) | 4/10 (40.0%) |
| hard_failure | 16 | 12/16 (75.0%) | 12/16 (75.0%) |
| schema_drift | 21 | 1/21 (4.8%) | 3/21 (14.3%) |

---
*Remember to also report the LLM diagnosis accuracy (human-rated, from your rubric) separately — that number isn't in DetectorLog and needs to come from your manual rating spreadsheet.*
