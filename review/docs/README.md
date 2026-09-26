# DASH documentation review

Source commit before this review: `015f3138c`.

The DASH docs retain the explorer’s Mempool documentation geometry: shared tx.taxi introduction, centered documentation title, Bootstrap tabs, a 330px desktop sticky sidebar at the 80px navbar offset, and secondary-surface section headers. On narrow screens the sidebar becomes an inline in-page index; anchor navigation offsets 120px for the mobile header.

The REST content was checked against `adapter/dash-provider.cjs` and `adapter/server.cjs`. It documents only implemented read-only block, transaction, indexed-address, snapshot, price, health, and observed-pending routes. It explicitly excludes the provider’s unsupported recommended-fee endpoint, global mempool projections, Electrum, Lightning, RBF, enterprise APIs, and authoritative InstantSend or ChainLock status endpoints.

Validation: `frontend/./node_modules/.bin/ngc -p tsconfig.app.json` completed successfully after the content and layout changes. The running DASH service on ports 4370/4371 belongs to a different checkout and returned 404 for docs routes, so no process was restarted or visual capture was claimed from this worktree.
