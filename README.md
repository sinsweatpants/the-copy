# The Copy

"The Copy" is a full-stack Rust workspace consisting of an [`Axum`](backend/src/main.rs:1) backend, a [`Leptos`](frontend/src/lib.rs:1) client rendered with Trunk, and an asynchronous job worker powered by [`chromiumoxide`](worker/src/lib.rs:1). All crates share strongly typed DTOs defined in [`shared`](shared/src/lib.rs:1).

## Prerequisites

* Rust toolchain (1.74 or newer recommended)
* `trunk` for serving the Leptos client (`cargo install trunk`)
* A running Redis instance for the worker (`redis-server` locally)
* Chromium/Chrome for full browser automation (optional when the fallback HTML scraper is acceptable)

## Building the workspace

```bash
cargo build --workspace
```

## Running the services

### Backend API

```bash
cargo run -p backend
```

Environment variables:

| variable | default | purpose |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite://backend.db` | SQLite location used by [`sqlx`](backend/src/main.rs:229) |
| `JWT_SECRET` | `insecure-development-secret` | Symmetric signing key for JWT tokens |
| `BIND_ADDRESS` | `0.0.0.0:3000` | Socket address for the HTTP server |

### Worker

```bash
cargo run -p worker
```

Environment variables:

| variable | default | purpose |
| --- | --- | --- |
| `REDIS_URL` | `redis://127.0.0.1:6379/` | Redis connection string consumed by [`RedisJobQueue`](worker/src/lib.rs:58) |
| `REDIS_QUEUE` | `pdf-jobs` | Incoming job list |
| `REDIS_RESULTS` | `<queue>:results` | Result list updated after processing |

When Chromium is available the worker launches a headless browser through [`ChromiumBrowser::launch`](worker/src/lib.rs:148). If the launch fails it transparently falls back to the [`FallbackBrowser`](worker/src/lib.rs:190) HTML scraper.

### Frontend

```bash
cd frontend
trunk serve --open
```

Optional compile-time configuration:

| variable | default | purpose |
| --- | --- | --- |
| `BACKEND_URL` | `http://127.0.0.1:3000` | Overrides the API base used by [`backend_base_url`](frontend/src/lib.rs:6) |

## REST API overview

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | none | Health probe backed by a database ping |
| `POST` | `/auth/register` | none | Creates a new account using [`RegisterRequest`](backend/src/main.rs:59) |
| `POST` | `/auth/login` | none | Issues a JWT compatible with the `Authorization: Bearer` header |
| `GET` | `/auth/me` | bearer | Returns the authenticated [`PublicUser`](backend/src/main.rs:77) |
| `GET` | `/screenplays` | bearer | Lists all [`Screenplay`](backend/src/main.rs:100) items belonging to the caller |
| `POST` | `/screenplays` | bearer | Creates a screenplay with [`ScreenplayRequest`](backend/src/main.rs:110) |
| `GET` | `/screenplays/:id` | bearer | Fetches a screenplay by id |
| `PUT` | `/screenplays/:id` | bearer | Updates title and description |
| `DELETE` | `/screenplays/:id` | bearer | Removes a screenplay |

## Testing

Run the full workspace test suite:

```bash
cargo test
```

Execute frontend UI tests (wasm target):

```bash
cargo test -p frontend --target wasm32-unknown-unknown
```

The backend suite (see [`authentication_and_screenplay_crud_flow`](backend/src/main.rs:592)) performs live HTTP requests against an in-memory Axum server and verifies job processing with [`JobProcessor`](worker/src/lib.rs:235). Worker specific logic is unit tested inside [`worker`](worker/src/lib.rs:266). Frontend behaviour is validated with [`wasm-bindgen-test`](frontend/src/lib.rs:268).

## Workflow summary

1. Start the backend to manage authentication and CRUD state.
2. Launch the worker so that queued [`RenderJob`](shared/src/lib.rs:173) payloads are transformed into [`RenderedJob`](shared/src/lib.rs:185) artefacts.
3. Serve the Leptos frontend with Trunk to interact with the REST API from the browser.

The workspace is designed so each crate can be developed independently while sharing common models and integration tests.
