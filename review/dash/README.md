# DASH local completion ledger

Status: bounded native local acceptance complete for the supported scope. Live public data and controlled lifecycle/search cases are distinguished below. No production request, push, or registration.

## Provenance and source choices

Isolated worktree `/home/lukee/dev/dash-taxi`, branch `codex/dash-local`, ancestor LTC `6ba310edebe7fa33f4643ff4eecdbca3d1041fc7`. No earlier DASH checkout/branch existed in the shared repository. Parent reconciles BTC/LTC deployed ownership. Literal native components are inherited; hub extraction derives from LTC export `2519326f9`. The old inherited `review/` files outside `review/dash` are LTC provenance, not DASH verification. Kit source `0086d236ca6533120525c60b23e55d6d5d68d3d6` plus the parent-owned current router contract.

Candidate uses an approved-geometry taxi logo recolored Dash blue; palette is a local candidate. Native coin icon is distinct. Parent integrates hub only in isolated local router.

## Observed/provider evidence

`provider.json` records real historical block100000 and transaction, exact duff calculations, indexed address pages25+25 with no overlap, full latest-block summary cardinality, ascending native stream ordering and nonnegative fees. `adapter/dash-provider.test.cjs` is a narrow behavioral test for a demonstrated provider mismatch: Insight reports negative vin-minus-vout fees for type9 Platform withdrawals. DIP2 payload bytes9–12 supply the actual little-endian fee (190 duffs for recorded `8fe24888...`). Missing payload returns unavailable, never a guessed fee.

Official Insight supplies current/historical blocks/transactions, indexed address balance/history, per-block pool labels and coinbase output totals, current USD, and an `inv` socket notification stream. A directly observed txlock notification was `202403a185372a12279476ec01a31a5f966e5e04178a697b80f5023a5fe7e1b0`. The adapter maintains a bounded observed pending sample, removes mined observations, and explicitly does not represent a complete pool or confirmation forecast. Socket close retries and snapshot requests retain native Offline/reconnection presentation. Global pool metrics/fee estimates remain unavailable.

Raw official sources: https://docs.dash.org/en/stable/docs/core/reference/transactions-special-transactions.html ; https://docs.dash.org/en/22.0.0/docs/core/reference/block-chain-serialized-blocks.html ; https://github.com/dashpay/insight-api/blob/master/lib/index.js . All historical/API probes were read-only. API calls identify themselves as `tx.taxi Dash explorer/0.1`; default Node User-Agent received403 while explicitly identified public API calls returned200.

Blockchair public stats initially returned200; its pending endpoint returned430 and no further requests were made. BlockCypher pending returned200 but is excluded from ongoing use to preserve the shared unauthenticated rate budget needed by DOGE. These are not full fallbacks.

## Adaptations

100,000,000 duffs per DASH; byte-based fees; no SegWit discount. Native internal weight compatibility is bytes×4; visible block weight removed. Dash target157.5sec, per-block Dark Gravity Wave, ~7.1% annual subsidy reduction. Mining uses actual recent10 blocks; no invented historical hashrate. No complete pending projection: native mined strip retains its geometry and starts at viewport edge, and the pending sample uses the existing transaction-list component. Unknown UTXO counts explicitly unavailable; P2PKH X/P2SH7 detection; no fabricated bech32 addresses. Native direct routing replaces inherited /cab flow; dropdown continuity retained. Local registry origin is gated to exact router4340 and exact approved loopback origins.

## Earlier checkpoint (superseded by final acceptance)

`browser.json` and screenshots record bounded native desktop1440×900/mobile390×844, transaction, block, address, and theme checks. Earlier failed screenshot findings were compiler-overlay replacement, negative provider fees and oldest-first blocks; those prompted concrete fixes. Screenshots must be inspected again after affected fixes. Parent owns final native/hub parity evidence. Full secondary-route docs/API examples/tools pruning, full search matrix, prolonged failure/recovery and detailed special-transaction UI require completion. Historical mining ranges and independent full-indexer fallback remain unsupported. Fiat is current USD only, not historical price-at-block. No blanket completion claim.

## Run

`cd /home/lukee/dev/dash-taxi && ./scripts/local-start.sh` keeps Angular and adapter watch mode alive; `./scripts/local-stop.sh` stops only stored per-chain PIDs. Gateway http://127.0.0.1:4370, Angular4371. Logs/PIDs `.local/`. Hub rebuild: `node hub/build.cjs`. Provider verification: `node scripts/verify-dash-provider.cjs`; semantic regression: `node adapter/dash-provider.test.cjs`; bounded browser capture: `node scripts/review-dash.mjs`.

## Final bounded checkpoint (2026-09-25)

Verified provider semantic checks passed, including special withdrawal fee=190duffs, historical100000, indexed25+25 distinct IDs and summary completeness. `browser.json`: root/block/tx/address no JavaScript errors or viewport overflow; optional CPFP/RBF/address-summary calls initially returned503; final acceptance prunes these unsupported callers. Opened desktop/mobile screenshots for root, historical tx/block, indexed address, special withdrawal, recent fee graph, search dropdown, offline/recovered, silent-first and both theme mobile views. Findings fixed: negative withdrawal fee, inherited Taproot/RBF classification and weight metrics, incomplete summary, expired cursor silently returning first page, native block wire order, viewport blank strip, chart unsupported fiat legend/clipping, stale source errors. Final strip snapshot10, native KEEP_BLOCKS_AMOUNT10 and hub facade10 align; normal historical panning is preserved.

`extra.json` proves18sec historical focus stability during real live snapshots; `lifecycle.json` proves controlled incoming-height stability, clean transport close/recovery, silent-first Offline/reconnection after40sec, theme persistence, deep metadata then in-app root reset with OG/Twitter equality. `provider-outage.json` is an isolated95sec failure: first visit healthy, 503 outage, stale/degraded after95sec, recovery healthy. It is not a public upstream failure. `search.json` proves delayed-tip height submit, actual registry Dash-only Opened, validated local DOGE new-tab destination, dropdown typing continuity/Escape and mobile fit. The subsequent controlled matrix below completes cross-chain ambiguity and failure checks.

Official live feed collected9 pending observations at a bounded checkpoint; observation sample remains explicit and updates. Live tx tracking and incremental address notifications are implemented, and a faithful controlled pending→confirmed transition is verified below; no naturally occurring confirmation during this bounded run is claimed. `review/dash/provider.json` captures real data; no test fixture is served as current provider output. Native fee graph is the inherited block-fees chart with actual recent10 observations, straight segments, only DASH series and no unsupported timespan choices. Mining/graph/docs/calculator adaptation is now implemented; no multi-year chart support is implied. Selected fiat other than current USD remains explicitly unavailable.

Root and block1200×630 social PNGs opened; inherited selected taxi/artwork composition retained. No overlap/clipping was observed. Candidate Dash accents are not a user-approved new brand baseline. Native/hub matching data screenshot evidence is owned by the parent integration worktree.

## Final acceptance and remaining provider limits

`search-routing.json` and `search-extra.json` complete the controlled registry matrix: unique confirmed foreign transaction routes directly; ambiguous EVM and 64-character hash go to choices; explicit Dogecoin selection is authoritative; a delayed obsolete result cannot override fast typing; failed probes fall back to choices. These complement the real local registry and early-height checks in `search.json`.

`confirmation.json` asserts native Unconfirmed → confirmations using a real historical transaction payload with a simulated preceding pending status, preserving identical ID, amounts and fees. The final screenshot was opened and inspected, with no compiler overlay or JavaScript errors. Actual live notification freshness is separately observed in `live-feed.json`. `optional.json` proves no unsupported CPFP/RBF/summary requests on transaction/address visits, no JavaScript errors, and healthy non-stale provider status afterward.

Remaining provider scope: the pending list is a bounded node notification sample, not a complete global pool or forecast. Mining charts are the latest 10 real blocks, not multi-year estimates. Fiat is current USD only. No independent equivalent indexed fallback is available. Full block summaries above the bounded 500-transaction limit explicitly report unavailable. These limits are not represented as zero-valued metrics. Local review is ready; production and new brand approval remain outside this task.

## Owner wrapper refinement

The router owner's final “Chain identity and fade refinement” explicitly permits hub-only divider centering, fade and identity decorations. The DASH export now implements its `setStatus` contract using actual native master-page Offline/Reconnecting badge fragments; useful loaded blocks persist during disconnects. Only `hub/entry.ts` and its build boundary change. Native explorer components/templates retain their own no-pending layout. `hub-wrapper.json` uses a real snapshot and controlled connection states: divider centers at720/195px on1440/390px, stays centered after direction toggle, Offline → Reconnecting → live clears the badge, and no JavaScript errors occur. Desktop offline and mobile flipped screenshots were opened and inspected. Owner integration supplies fade/wordmark/icon decorations separately.
