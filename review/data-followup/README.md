# Local provider follow-up — 2026-09-25 UTC

Rechecked real historical block100000, transaction836f0f697b6d3a6283c7c264a5a144c893e7b077ef4aea87dbb4f32d81ac86c5 and addressXw43GxB6uYmGZYwV61vhf46DsPvHY4popZ. These rendered provider data. Current block transaction and batched outspend HTTP200 responses were observed after scrolling into the list. Both transactions are visible in block-settled.png, which was opened for inspection.

Correction to initial investigation: the pre-scroll transaction skeleton is intentional @defer(on viewport), not a frontend defect. A full-page screenshot does not activate it. No unnecessary source change made. Desktop/mobile visible-list results are in visible-block-check.json.

Provider health retained a prior HTTP400 event but subsequently reported websocket live, degraded=false, recentFailures=0 and stale=false. Transient provider failures remain possible; success here is bounded to the observed routes. Original centering and browser-disconnect gateway fixes remain verified in ../centering-followup.
