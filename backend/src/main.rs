use std::{env, sync::Arc};

use anyhow::Context;
use async_trait::async_trait;
use axum::{
    body::Body,
    extract::{FromRef, FromRequestParts, Path, State},
    http::{header::AUTHORIZATION, request::Parts, HeaderValue, Method, Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
    Json, Router,
};
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{sqlite::SqlitePoolOptions, FromRow, SqlitePool};
use thiserror::Error;
use tokio::net::TcpListener;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;
use uuid::Uuid;

const DEFAULT_BIND: &str = "0.0.0.0:3000";
const TOKEN_TTL_SECS: i64 = 60 * 60 * 24;

#[derive(Clone)]
pub struct AppState {
    inner: Arc<AppStateInner>,
}

struct AppStateInner {
    pool: SqlitePool,
}

impl AppState {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            inner: Arc::new(AppStateInner { pool }),
        }
    }

    fn pool(&self) -> &SqlitePool {
        &self.inner.pool
    }
}

impl FromRef<AppState> for AppState {
    fn from_ref(input: &AppState) -> Self {
        input.clone()
    }
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: &'static str,
}

#[derive(Debug, Deserialize)]
struct RegisterRequest {
    email: String,
    password: String,
}

#[derive(Debug, Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Debug, Serialize)]
struct AuthResponse {
    token: String,
    user: PublicUser,
}

#[derive(Debug, Serialize, Clone)]
struct PublicUser {
    id: String,
    email: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, FromRow)]
struct User {
    id: String,
    email: String,
    password_hash: String,
    password_salt: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, FromRow)]
struct Session {
    token: String,
    user_id: String,
    expires_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
struct Screenplay {
    id: String,
    user_id: String,
    title: String,
    description: String,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct ScreenplayRequest {
    title: String,
    description: String,
}

#[derive(Debug, Clone)]
struct AuthUser {
    user_id: String,
}

#[derive(Debug, Error)]
enum AppError {
    #[error("validation error: {0}")]
    Validation(String),
    #[error("unauthorized")]
    Unauthorized,
    #[error("conflict: {0}")]
    Conflict(String),
    #[error("not found")]
    NotFound,
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("internal error: {0}")]
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, msg).into_response(),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "unauthorized").into_response(),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg).into_response(),
            AppError::NotFound => (StatusCode::NOT_FOUND, "not found").into_response(),
            AppError::Database(err) => {
                tracing::error!(error = %err, "database error");
                (StatusCode::INTERNAL_SERVER_ERROR, "database error").into_response()
            }
            AppError::Internal(msg) => {
                tracing::error!(message = %msg, "internal error");
                (StatusCode::INTERNAL_SERVER_ERROR, "internal server error").into_response()
            }
        }
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let state = AppState::from_ref(state);
        let header_value = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .ok_or(AppError::Unauthorized)?;

        let token = header_value
            .strip_prefix("Bearer ")
            .ok_or(AppError::Unauthorized)?;

        let session = sqlx::query_as::<_, Session>(
            "SELECT token, user_id, expires_at FROM sessions WHERE token = ?1",
        )
        .bind(token)
        .fetch_optional(state.pool())
        .await?;

        let session = session.ok_or(AppError::Unauthorized)?;
        if session.expires_at < Utc::now() {
            sqlx::query("DELETE FROM sessions WHERE token = ?1")
                .bind(&session.token)
                .execute(state.pool())
                .await?;
            return Err(AppError::Unauthorized);
        }

        Ok(AuthUser {
            user_id: session.user_id,
        })
    }
}

#[tokio::main]
async fn main() {
    if let Err(err) = run().await {
        eprintln!("backend failed: {err:?}");
    }
}

async fn run() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    if tracing::subscriber::set_global_default(
        FmtSubscriber::builder()
            .with_max_level(Level::INFO)
            .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
            .finish(),
    )
    .is_err()
    {
        // Ignore if already set
    }

    let database_url =
        env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite://backend.db".to_string());
    let bind_address = env::var("BIND_ADDRESS").unwrap_or_else(|_| DEFAULT_BIND.to_string());

    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await
        .context("failed to connect to database")?;

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .context("failed to run migrations")?;

    let state = AppState::new(pool);

    let app = build_router(state);

    let listener = TcpListener::bind(&bind_address)
        .await
        .with_context(|| format!("failed to bind to {bind_address}"))?;

    info!("listening on {}", listener.local_addr()?);

    axum::serve(listener, app).await?;
    Ok(())
}

pub fn build_router(state: AppState) -> Router<AppState> {
    Router::new()
        .route("/health", get(health_check))
        .nest("/auth", auth_router())
        .nest("/screenplays", screenplay_router())
        .layer(axum::middleware::from_fn(cors_middleware))
        .with_state(state)
}

fn auth_router() -> Router<AppState> {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/me", get(me))
}

fn screenplay_router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_screenplays).post(create_screenplay))
        .route(
            "/:id",
            get(get_screenplay)
                .put(update_screenplay)
                .delete(delete_screenplay),
        )
}

async fn cors_middleware<B>(req: Request<B>, next: Next<B>) -> Response {
    let mut response = if req.method() == Method::OPTIONS {
        Response::builder()
            .status(StatusCode::NO_CONTENT)
            .body(Body::empty())
            .unwrap()
    } else {
        next.run(req).await
    };

    let headers = response.headers_mut();
    headers.insert("Access-Control-Allow-Origin", HeaderValue::from_static("*"));
    headers.insert(
        "Access-Control-Allow-Headers",
        HeaderValue::from_static("Authorization, Content-Type"),
    );
    headers.insert(
        "Access-Control-Allow-Methods",
        HeaderValue::from_static("GET, POST, PUT, DELETE, OPTIONS"),
    );
    response
}

async fn health_check(State(state): State<AppState>) -> Result<Json<HealthResponse>, AppError> {
    sqlx::query_scalar::<_, i64>("SELECT 1")
        .fetch_one(state.pool())
        .await
        .map_err(AppError::from)?;
    Ok(Json(HealthResponse { status: "ok" }))
}

async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<AuthResponse>), AppError> {
    if !payload.email.contains('@') {
        return Err(AppError::Validation("email must contain '@'".into()));
    }

    if payload.password.len() < 8 {
        return Err(AppError::Validation(
            "password must be at least 8 characters".into(),
        ));
    }

    let user_id = Uuid::new_v4().to_string();
    let password_salt = Uuid::new_v4().to_string();
    let password_hash = hash_password(&payload.password, &password_salt);
    let created_at = Utc::now();

    let result = sqlx::query(
        "INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
    )
    .bind(&user_id)
    .bind(&payload.email)
    .bind(&password_hash)
    .bind(&password_salt)
    .bind(&created_at)
    .execute(state.pool())
    .await;

    if let Err(sqlx::Error::Database(err)) = &result {
        if err.message().contains("UNIQUE") {
            return Err(AppError::Conflict("email already registered".into()));
        }
    }

    result?;

    let token = create_session(&state, &user_id).await?;
    let user = PublicUser {
        id: user_id,
        email: payload.email,
        created_at,
    };

    Ok((StatusCode::CREATED, Json(AuthResponse { token, user })))
}

async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, email, password_hash, password_salt, created_at FROM users WHERE email = ?1",
    )
    .bind(&payload.email)
    .fetch_optional(state.pool())
    .await?;

    let user = match user {
        Some(user) => user,
        None => return Err(AppError::Unauthorized),
    };

    if !verify_password(&payload.password, &user.password_salt, &user.password_hash) {
        return Err(AppError::Unauthorized);
    }

    let token = create_session(&state, &user.id).await?;
    let public_user = PublicUser {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
    };

    Ok(Json(AuthResponse {
        token,
        user: public_user,
    }))
}

async fn me(
    AuthUser { user_id }: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<PublicUser>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, email, password_hash, password_salt, created_at FROM users WHERE id = ?1",
    )
    .bind(&user_id)
    .fetch_optional(state.pool())
    .await?;

    let user = user.ok_or(AppError::Unauthorized)?;

    Ok(Json(PublicUser {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
    }))
}

async fn list_screenplays(
    AuthUser { user_id }: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<Screenplay>>, AppError> {
    let screenplays = sqlx::query_as::<_, Screenplay>(
        "SELECT id, user_id, title, description, created_at, updated_at FROM screenplays WHERE user_id = ?1 ORDER BY created_at DESC",
    )
    .bind(&user_id)
    .fetch_all(state.pool())
    .await?;

    Ok(Json(screenplays))
}

async fn create_screenplay(
    AuthUser { user_id }: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<ScreenplayRequest>,
) -> Result<(StatusCode, Json<Screenplay>), AppError> {
    validate_screenplay(&payload)?;

    let now = Utc::now();
    let screenplay = Screenplay {
        id: Uuid::new_v4().to_string(),
        user_id,
        title: payload.title,
        description: payload.description,
        created_at: now,
        updated_at: now,
    };

    sqlx::query(
        "INSERT INTO screenplays (id, user_id, title, description, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )
    .bind(&screenplay.id)
    .bind(&screenplay.user_id)
    .bind(&screenplay.title)
    .bind(&screenplay.description)
    .bind(&screenplay.created_at)
    .bind(&screenplay.updated_at)
    .execute(state.pool())
    .await?;

    Ok((StatusCode::CREATED, Json(screenplay)))
}

async fn get_screenplay(
    AuthUser { user_id }: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Screenplay>, AppError> {
    let screenplay = sqlx::query_as::<_, Screenplay>(
        "SELECT id, user_id, title, description, created_at, updated_at FROM screenplays WHERE id = ?1 AND user_id = ?2",
    )
    .bind(&id)
    .bind(&user_id)
    .fetch_optional(state.pool())
    .await?;

    let screenplay = screenplay.ok_or(AppError::NotFound)?;

    Ok(Json(screenplay))
}

async fn update_screenplay(
    AuthUser { user_id }: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<ScreenplayRequest>,
) -> Result<Json<Screenplay>, AppError> {
    validate_screenplay(&payload)?;
    let now = Utc::now();

    let result = sqlx::query(
        "UPDATE screenplays SET title = ?1, description = ?2, updated_at = ?3 WHERE id = ?4 AND user_id = ?5",
    )
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&now)
    .bind(&id)
    .bind(&user_id)
    .execute(state.pool())
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }

    let screenplay = sqlx::query_as::<_, Screenplay>(
        "SELECT id, user_id, title, description, created_at, updated_at FROM screenplays WHERE id = ?1 AND user_id = ?2",
    )
    .bind(&id)
    .bind(&user_id)
    .fetch_one(state.pool())
    .await?;

    Ok(Json(screenplay))
}

async fn delete_screenplay(
    AuthUser { user_id }: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    let result = sqlx::query("DELETE FROM screenplays WHERE id = ?1 AND user_id = ?2")
        .bind(&id)
        .bind(&user_id)
        .execute(state.pool())
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}

fn validate_screenplay(payload: &ScreenplayRequest) -> Result<(), AppError> {
    if payload.title.trim().is_empty() {
        return Err(AppError::Validation("title cannot be empty".into()));
    }

    if payload.description.trim().is_empty() {
        return Err(AppError::Validation("description cannot be empty".into()));
    }

    Ok(())
}

fn hash_password(password: &str, salt: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(salt.as_bytes());
    hasher.update(password.as_bytes());
    let digest = hasher.finalize();
    let mut encoded = String::new();
    for byte in digest {
        encoded.push_str(&format!("{byte:02x}"));
    }
    encoded
}

fn verify_password(password: &str, salt: &str, expected: &str) -> bool {
    hash_password(password, salt) == expected
}

async fn create_session(state: &AppState, user_id: &str) -> Result<String, AppError> {
    let token = Uuid::new_v4().to_string();
    let now = Utc::now();
    let expires_at = now
        .checked_add_signed(Duration::seconds(TOKEN_TTL_SECS))
        .ok_or_else(|| AppError::Internal("failed to compute expiration".into()))?;

    sqlx::query(
        "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)",
    )
    .bind(&token)
    .bind(user_id)
    .bind(&now)
    .bind(&expires_at)
    .execute(state.pool())
    .await?;

    Ok(token)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode as HttpStatusCode;
    use reqwest::Client;
    use std::sync::Arc;
    use tokio::task::JoinHandle;
    use tokio::time::{sleep, Duration};
    use worker::{FallbackBrowser, InMemoryQueue, JobProcessor};

    #[test]
    fn screenplay_validation_rejects_empty_fields() {
        let payload = ScreenplayRequest {
            title: "".into(),
            description: "".into(),
        };

        assert!(validate_screenplay(&payload).is_err());
    }

    #[tokio::test]
    async fn authentication_and_screenplay_crud_flow() {
        let (base_url, handle) = spawn_app().await;
        let client = Client::new();

        let register_response = client
            .post(format!("{}/auth/register", base_url))
            .json(&RegisterRequest {
                email: "user@example.com".into(),
                password: "super-secret".into(),
            })
            .send()
            .await
            .unwrap();

        assert_eq!(register_response.status(), HttpStatusCode::CREATED);
        let register_body: AuthResponse = register_response.json().await.unwrap();
        assert_eq!(register_body.user.email, "user@example.com");

        let token = register_body.token.clone();
        let auth_header = format!("Bearer {}", token);

        let create_response = client
            .post(format!("{}/screenplays", base_url))
            .header(AUTHORIZATION, auth_header.clone())
            .json(&ScreenplayRequest {
                title: "First".into(),
                description: "Opening act".into(),
            })
            .send()
            .await
            .unwrap();
        assert_eq!(create_response.status(), HttpStatusCode::CREATED);
        let created: Screenplay = create_response.json().await.unwrap();

        let list_response = client
            .get(format!("{}/screenplays", base_url))
            .header(AUTHORIZATION, auth_header.clone())
            .send()
            .await
            .unwrap();
        assert_eq!(list_response.status(), HttpStatusCode::OK);
        let list: Vec<Screenplay> = list_response.json().await.unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].title, "First");

        let update_response = client
            .put(format!("{}/screenplays/{}", base_url, created.id))
            .header(AUTHORIZATION, auth_header.clone())
            .json(&ScreenplayRequest {
                title: "Updated".into(),
                description: "Revised description".into(),
            })
            .send()
            .await
            .unwrap();
        assert_eq!(update_response.status(), HttpStatusCode::OK);
        let updated: Screenplay = update_response.json().await.unwrap();
        assert_eq!(updated.title, "Updated");

        let delete_response = client
            .delete(format!("{}/screenplays/{}", base_url, created.id))
            .header(AUTHORIZATION, auth_header.clone())
            .send()
            .await
            .unwrap();
        assert_eq!(delete_response.status(), HttpStatusCode::NO_CONTENT);

        let queue = Arc::new(InMemoryQueue::default());
        queue
            .push(shared::RenderJob {
                id: "render-1".into(),
                label: "Preview".into(),
                html: "<p>Sample</p>".into(),
            })
            .await;
        let processor = JobProcessor::new(queue.clone(), Box::new(FallbackBrowser::default()));
        processor.process_once().await.unwrap();
        let results = queue.results().await;
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "render-1");
        assert!(results[0].text_content.contains("Sample"));

        handle.abort();
    }

    async fn spawn_app() -> (String, JoinHandle<()>) {
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();
        let state = AppState::new(pool);
        let app = build_router(state);
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let server = tokio::spawn(async move {
            if let Err(err) = axum::serve(listener, app).await {
                eprintln!("server error: {err:?}");
            }
        });
        sleep(Duration::from_millis(50)).await;
        (format!("http://{}", addr), server)
    }
}
