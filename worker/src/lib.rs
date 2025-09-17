use std::{collections::VecDeque, sync::Arc};

use async_trait::async_trait;
use chromiumoxide::{browser::BrowserConfig, Browser};
use futures::StreamExt;
use redis::aio::MultiplexedConnection;
use redis::AsyncCommands;
use shared::{RenderJob, RenderedJob};
use thiserror::Error;
use tokio::sync::{Mutex, Notify};
use tracing::{error, warn};

/// Shared result type used across the worker.
pub type Result<T> = std::result::Result<T, WorkerError>;

/// Errors that can be emitted while running the worker runtime.
#[derive(Debug, Error)]
pub enum WorkerError {
    #[error("redis error: {0}")]
    Redis(#[from] redis::RedisError),
    #[error("chromium error: {0}")]
    Chromium(String),
    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

impl From<chromiumoxide::error::CdpError> for WorkerError {
    fn from(value: chromiumoxide::error::CdpError) -> Self {
        WorkerError::Chromium(value.to_string())
    }
}

impl From<chromiumoxide::error::BrowserError> for WorkerError {
    fn from(value: chromiumoxide::error::BrowserError) -> Self {
        WorkerError::Chromium(value.to_string())
    }
}

/// Abstraction over a queue that provides [`RenderJob`] instances for processing.
#[async_trait]
pub trait JobQueue: Send + Sync {
    /// Fetches the next job, awaiting until one becomes available.
    async fn next_job(&self) -> Result<RenderJob>;

    /// Persists the result of processing a job.
    async fn acknowledge(&self, result: RenderedJob) -> Result<()>;
}

/// Trait representing an automation backend capable of processing [`RenderJob`] items.
#[async_trait]
pub trait BrowserAutomation: Send {
    /// Processes a [`RenderJob`] and returns a simplified [`RenderedJob`].
    async fn render(&self, job: &RenderJob) -> Result<RenderedJob>;
}

/// Queue backed by Redis lists. One list is used for incoming work and another for results.
pub struct RedisJobQueue {
    connection: Arc<Mutex<MultiplexedConnection>>,
    input_key: String,
    result_key: String,
}

impl RedisJobQueue {
    /// Creates a new [`RedisJobQueue`] from an established connection and queue names.
    pub fn new(
        connection: MultiplexedConnection,
        input_key: impl Into<String>,
        result_key: impl Into<String>,
    ) -> Self {
        Self {
            connection: Arc::new(Mutex::new(connection)),
            input_key: input_key.into(),
            result_key: result_key.into(),
        }
    }
}

#[async_trait]
impl JobQueue for RedisJobQueue {
    async fn next_job(&self) -> Result<RenderJob> {
        let mut conn = self.connection.lock().await;
        let (_queue, payload): (String, String) = redis::cmd("BLPOP")
            .arg(&self.input_key)
            .arg(0)
            .query_async(&mut *conn)
            .await?;

        let job = serde_json::from_str(&payload)?;
        Ok(job)
    }

    async fn acknowledge(&self, result: RenderedJob) -> Result<()> {
        let payload = serde_json::to_string(&result)?;
        let mut conn = self.connection.lock().await;
        conn.rpush(&self.result_key, payload).await?;
        Ok(())
    }
}

/// In-memory queue used for tests and local development without Redis.
#[derive(Default)]
pub struct InMemoryQueue {
    jobs: Mutex<VecDeque<RenderJob>>,
    results: Mutex<Vec<RenderedJob>>,
    notify: Notify,
}

impl InMemoryQueue {
    /// Pushes a new job into the queue.
    pub async fn push(&self, job: RenderJob) {
        let mut jobs = self.jobs.lock().await;
        jobs.push_back(job);
        drop(jobs);
        self.notify.notify_one();
    }

    /// Returns all processed job results collected so far.
    pub async fn results(&self) -> Vec<RenderedJob> {
        self.results.lock().await.clone()
    }
}

#[async_trait]
impl JobQueue for InMemoryQueue {
    async fn next_job(&self) -> Result<RenderJob> {
        loop {
            if let Some(job) = self.jobs.lock().await.pop_front() {
                return Ok(job);
            }
            self.notify.notified().await;
        }
    }

    async fn acknowledge(&self, result: RenderedJob) -> Result<()> {
        self.results.lock().await.push(result);
        Ok(())
    }
}

/// A Chromium backed automation layer implemented with [`chromiumoxide`].
pub struct ChromiumBrowser {
    browser: Browser,
}

impl ChromiumBrowser {
    /// Launches a new headless Chromium instance and wraps it in a [`ChromiumBrowser`].
    pub async fn launch() -> Result<Self> {
        let config = BrowserConfig::builder()
            .build()
            .map_err(|err| WorkerError::Chromium(err.to_string()))?;
        let (browser, mut handler) = Browser::launch(config).await?;
        tokio::spawn(async move {
            while let Some(event) = handler.next().await {
                if let Err(err) = event {
                    error!(error = %err, "chromium handler error");
                }
            }
        });
        Ok(Self { browser })
    }
}

#[async_trait]
impl BrowserAutomation for ChromiumBrowser {
    async fn render(&self, job: &RenderJob) -> Result<RenderedJob> {
        let page = self
            .browser
            .new_page("about:blank")
            .await
            .map_err(WorkerError::from)?;

        page.set_content(job.html.clone())
            .await
            .map_err(WorkerError::from)?;

        let content = page.content().await.map_err(WorkerError::from)?;
        if let Err(err) = page.close().await {
            warn!(error = %err, "failed to close chromium page");
        }

        Ok(RenderedJob {
            id: job.id.clone(),
            text_content: content,
        })
    }
}

/// Lightweight fallback processor that does not require a browser. Used when Chromium is unavailable.
#[derive(Default, Debug, Clone)]
pub struct FallbackBrowser;

#[async_trait]
impl BrowserAutomation for FallbackBrowser {
    async fn render(&self, job: &RenderJob) -> Result<RenderedJob> {
        let text = extract_text(&job.html);

        Ok(RenderedJob {
            id: job.id.clone(),
            text_content: text,
        })
    }
}

fn extract_text(html: &str) -> String {
    let mut result = String::new();
    let mut in_tag = false;
    let mut previous_was_space = false;
    for ch in html.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => in_tag = false,
            c if !in_tag => {
                let to_push = if c.is_whitespace() {
                    if previous_was_space {
                        None
                    } else {
                        previous_was_space = true;
                        Some(' ')
                    }
                } else {
                    previous_was_space = false;
                    Some(c)
                };
                if let Some(ch) = to_push {
                    result.push(ch);
                }
            }
            _ => {}
        }
    }
    result.trim().to_string()
}

/// Coordinates pulling jobs from the queue, sending them through the automation backend and acknowledging the results.
pub struct JobProcessor {
    queue: Arc<dyn JobQueue>,
    browser: Box<dyn BrowserAutomation + Send>,
}

impl JobProcessor {
    /// Creates a new [`JobProcessor`].
    pub fn new(queue: Arc<dyn JobQueue>, browser: Box<dyn BrowserAutomation + Send>) -> Self {
        Self { queue, browser }
    }

    /// Processes a single job if available.
    pub async fn process_once(&self) -> Result<()> {
        let job = self.queue.next_job().await?;
        let result = self.browser.render(&job).await?;
        self.queue.acknowledge(result).await
    }

    /// Runs the processor indefinitely.
    pub async fn run(&self) -> Result<()> {
        loop {
            self.process_once().await?;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn fallback_browser_extracts_text() {
        let browser = FallbackBrowser::default();
        let job = RenderJob {
            id: "job-1".into(),
            label: "test".into(),
            html: "<h1>Hello</h1><p>World</p>".into(),
        };

        let rendered = browser.render(&job).await.unwrap();
        assert!(rendered.text_content.contains("Hello"));
        assert!(rendered.text_content.contains("World"));
    }

    #[tokio::test]
    async fn processor_moves_jobs_from_queue_to_results() {
        let queue = Arc::new(InMemoryQueue::default());
        queue
            .push(RenderJob {
                id: "abc".into(),
                label: "demo".into(),
                html: "<div>content</div>".into(),
            })
            .await;

        let processor = JobProcessor::new(queue.clone(), Box::new(FallbackBrowser::default()));
        processor.process_once().await.unwrap();

        let results = queue.results().await;
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "abc");
    }
}
