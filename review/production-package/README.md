# DASH production packaging, 2026-09-25

Dockerfile now uses DASH origins/env, copies DASH social-card logo and fallback pool asset, binds 0.0.0.0 in production, and provisions a node-owned `/data/dash` cache directory. Local default remains loopback and local watch configuration was not regenerated.

Coolify: Dockerfile build, port 8080, `/healthz`, hostname `https://dash.tx.taxi`, named persistent volume mounted at `/data/dash`, writable by UID 1000. Default upstream is `https://explorer.dash.org/insight-api`; `DASH_PROVIDER` may override it. Do not deploy multiple independent collectors merely for capacity.

Production config uses https://dash.tx.taxi and https://tx.taxi, 8,000,000 weight units (2MB block), retained block count 10. Unknown transaction fees remain unavailable in generated metadata/cards, rather than zero.

Verification: isolated copy at `/tmp/dash-production-check/frontend`; production Angular compilation and asynchronous stylesheet postprocessing passed. Initial bundle 1.83MB, existing SCSS budget warnings only. Docker daemon unavailable locally, so this is a package/runtime smoke, not a container certification. Runtime on port 4417 used a Docker-equivalent filesystem layout and a separate temporary SQLite directory. Root, config, DASH logo, pool fallback, OG PNG, health and live init-data returned 200. Browser loaded live blocks/pending without page errors or broken images; desktop screenshot inspected. Production-container and public TLS validation remain integrator responsibilities.

The initial screenshot exposes a pending-cube fullness concern (one tiny transaction appeared as a full cube); reported to integrator for UI follow-up. It is not evidence that fullness passed.

A second production compilation included the integrator's enabled BCH/DASH transition profiles. Inspected final built profile list: BTC, ETH, XMR, LTC, BCH, DASH; no DOGE and no `localOnly` gates. `build.log` records that successful build. Subsequent pending-fullness style changes require final rebuild before deploying.

Final follow-up: rebuilt after native pending empty-region fix and exact target-interval correction to 150 seconds (provider snapshot target field, dashboard target label, documentation). Inspected updated screenshot: tiny observed pending sample now has a dark empty face, while actual recent block interval remains measured (146 seconds in this capture). Production browser has no page errors or broken images. Final compile passed. Temporary production port4417 collector stopped after this check; existing local4370 watch retained.
