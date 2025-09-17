use std::env;
use std::sync::Arc;

use dotenvy::dotenv;
use tracing::{info, warn};
use worker::{
    BrowserAutomation, ChromiumBrowser, FallbackBrowser, JobProcessor, JobQueue, RedisJobQueue,
    WorkerError,
};

#[tokio::main]
async fn main() {
    if let Err(err) = run().await {
        eprintln!("worker failed: {err:?}");
    }
}

async fn run() -> Result<(), WorkerError> {
    dotenv().ok();
    tracing_subscriber::fmt::try_init().ok();

    let redis_url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379/".to_string());
    let queue_name = env::var("REDIS_QUEUE").unwrap_or_else(|_| "pdf-jobs".to_string());
    let result_queue =
        env::var("REDIS_RESULTS").unwrap_or_else(|_| format!("{queue_name}:results"));

    let client = redis::Client::open(redis_url)?;
    let connection = client.get_multiplexed_async_connection().await?;
    let queue: Arc<dyn JobQueue> = Arc::new(RedisJobQueue::new(
        connection,
        queue_name.clone(),
        result_queue,
    ));

    let browser: Box<dyn BrowserAutomation + Send> = match ChromiumBrowser::launch().await {
        Ok(browser) => {
            info!("chromium launched successfully");
            Box::new(browser)
        }
        Err(err) => {
            warn!(error = %err, "failed to launch chromiumoxide, falling back to HTML scraper");
            Box::new(FallbackBrowser::default())
        }
    };

    let processor = JobProcessor::new(queue, browser);
    info!(queue = %queue_name, "worker ready to process jobs");
    processor.run().await
}
