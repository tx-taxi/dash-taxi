# Distinct DASH native palette — 2026-09-25

User requested complete chain customization instead of inherited LTC surfaces. Kept native component geometry, conventional DASH/taxi branding, yellow fee range and status semantics. Used colorize/impeccable guidance with existing user-approved native explorer design context; no redesign.

DASH palette: page `#031320`; navbar/cards `#071f35`; raised boxes `#09283f`; hover `#103753`; empty block body `#10334d`; mined top/side `#164461` / `#0b2b44`; pending top/side/loading `#145779` / `#0b3755` / `#1b6f99`; links/info `#8fd8ff`; primary `#49baff`; existing branded action `#008ce7`. Fee/WebGL ramp now `#0078bf`→`#83d7ff`, replacing LTC muted blue/silver. Borders tint blue; placeholders, alerts, statistics backgrounds and fee tiers use the same family.

Paths: `frontend/src/styles.scss` owns native surface tokens, Bootstrap build colors and two inherited percentage-bar backgrounds; `frontend/src/app/app.constants.ts` owns the chart/WebGL fee ramp; `frontend/src/resources/mempool-original.css` explicitly restores Original navbar/link/border/fee-tier tokens; `frontend/src/app/services/theme.service.ts` versions that stylesheet.

Verification: running Angular watch compiled successfully. Actual desktop1440/mobile390 screenshots opened and inspected (default and Original). Browser captures in `browser.json` confirm distinct page/nav/card values, default→Original→default switching, default persistence after reload, zero page errors and no horizontal document overflow at either width. Screenshots show native block faces, network graph and live transaction canvas repaint in blue, and Original returns to purple/green. This is bounded live visual verification, not a full accessibility certification.

Local review remains http://127.0.0.1:4370. No deployment. Shared transition script/index and hub exports intentionally belong to integrator: set DASH initial background to `#031320` and recapture native default loading template using these tokens. Original loading template keeps its established colors. `hub/source.json` was dirty before work and remains outside this commit.
