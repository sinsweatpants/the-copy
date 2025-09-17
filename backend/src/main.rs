use axum::{
    extract::State,
    routing::get,
    Router,
};
use sqlx::postgres::{PgPool, PgPoolOptions};
use std::env;
use tokio::net::TcpListener;

#[derive(Clone)]
struct AppState {
    db_pool: PgPool,
}

#[tokio::main]
async fn main() {
    // Load environment variables from .env file
    dotenvy::dotenv().expect("Failed to read .env file");
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Create a database connection pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to create database pool");

    println!("Database pool created.");

    let state = AppState { db_pool: pool };

    let app = Router::new()
        .route("/", get(root_handler))
        .route("/health", get(health_handler))
        .with_state(state);

    let listener = TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

async fn root_handler() -> &'static str {
    "Hello, from Axum!"
}

async fn health_handler(State(state): State<AppState>) -> &'static str {
    // Check database connection
    match sqlx::query("SELECT 1").execute(&state.db_pool).await {
        Ok(_) => "OK",
        Err(_) => "Database connection error",
    }
}
