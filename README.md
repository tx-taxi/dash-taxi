<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="frontend/src/resources/branding/dash-dark-full.svg">
    <img src="frontend/src/resources/branding/dash-light-full.svg" width="360" alt="dash.tx.taxi banner logo">
  </picture>
</p>

<h1 align="center">Dash Explorer · dash.tx.taxi</h1>

<p align="center">
  A public Dash block explorer and API.<br>
  <a href="https://dash.tx.taxi">Open dash.tx.taxi</a>
</p>

## Overview

Dash Explorer is the Dash mainnet explorer in the [tx.taxi](https://tx.taxi) network. It presents public chain data through a Dash-specific interface and a read-only API gateway.

## Features

- Search and inspect Dash blocks, transactions, and transparent-address history.
- Browse recent blocks, transaction fees, mining data, and the current USD conversion supplied by the configured provider.
- Show Dash-native values in DASH and duffs, including supported special-transaction details.
- Surface a bounded sample of transactions observed by the connected Dash node feed; it is not a complete mempool or a confirmation forecast.
- Provide a Dash-branded explorer, entity metadata, and public read-only API responses.

## Development

The checked local review commands start Angular on `127.0.0.1:4371`, the Dash adapter and gateway on `127.0.0.1:4370`, and expose the explorer at [http://127.0.0.1:4370](http://127.0.0.1:4370).

```sh
npm ci --prefix frontend
npm ci --prefix adapter
./scripts/local-start.sh
```

Stop only this checkout's local processes with:

```sh
./scripts/local-stop.sh
```

Build the checked-in container configuration locally with:

```sh
docker build -t dash-explorer .
```

The Docker image uses Node.js 24. The application does not bundle a Dash node or an indexer: the adapter uses `https://explorer.dash.org/insight-api` by default and needs outbound access to that compatible REST and WebSocket service. Set `DASH_PROVIDER` to use another compatible provider. A self-managed provider must supply synchronized Dash network data and the Insight-compatible transaction, block, address, and notification endpoints used by the adapter.

## Attribution and license

This repository adapts the [Mempool Open Source Project](https://github.com/mempool/mempool) for Dash in the tx.taxi network. The inherited root README is retained in [UPSTREAM_README.md](UPSTREAM_README.md) for provenance.

The code is distributed under the terms in [LICENSE](LICENSE) and [COPYING.md](COPYING.md), including the GNU Affero General Public License v3 text and applicable trademark notices.

Original tx.taxi modifications and documentation are credited to tx.taxi contributors (2026). Upstream copyright and license notices are preserved in [`LICENSE`](LICENSE) and [`COPYING.md`](COPYING.md).

The software license does not grant trademark rights to the tx.taxi name or logos. Independent deployments should use their own branding and must not imply they are operated or endorsed by tx.taxi.

## Links

- [Live explorer](https://dash.tx.taxi)
- [tx.taxi hub](https://tx.taxi)
- [Telegram channel](https://t.me/txtaxi)
