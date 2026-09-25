# DASH UI copy cleanup

2026-09-25. Applies the user's correction: implementation and provider coverage details belong in review documentation, not explorer UI or tooltips.

Removed sampling/node/backend notes from dashboard, full fee graph, mining and About; removed the Mining coverage card. Standard titles remain Pending Transactions, Incoming Transactions, Block Fees, Block Rewards and Recent Transactions. InstantSend now shows Locked/Not reported. Errors use concise unavailable/retrying/delayed states. Native components, real data mapping, current-price qualification, currency units and required upstream attribution remain. Recent-transactions Size uses bytes for DASH.

Bounded verification: Angular watch compiled successfully. `results.json` records twelve real navigations (root, mining, graph, About, recent transactions, historical transaction;1440/390). No browser errors or removed implementation-copy phrases. All eight root/mining/graph/About screenshots were opened and inspected at desktop/mobile. Graphs and tables still show actual data after removing their explanatory subtitles. This copy-only follow-up did not repeat the earlier two-theme functional matrix.

Earlier implementation descriptions and screenshots in `review/design-cleanup` are historical evidence, superseded for visible copy by this folder. Provider completeness is unchanged; removing notes does not create global pending coverage, historical mining series or confirmation estimates.

No hub strip source or shared handoff engine changed. Running http://127.0.0.1:4370 with Angular watch4371. No push/deploy.
