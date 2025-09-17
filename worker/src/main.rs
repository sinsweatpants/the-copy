use chromiumoxide::Browser;
use chromiumoxide::browser::BrowserConfig;
use futures::StreamExt;
use std::env;
use shared::DialogueLine; // Using a real DTO now

#[tokio::main]
async fn main() {
    println!("Worker starting...");

    // --- Load Environment ---
    dotenvy::from_path("./.env").expect("Failed to read .env file in worker");
    let redis_url = env::var("REDIS_URL").expect("REDIS_URL must be set");

    // --- Browser Setup (for later use) ---
    let (browser, mut handler) =
        Browser::launch(BrowserConfig::builder().build().unwrap())
            .await
            .expect("Failed to launch browser");

    let _handle = tokio::spawn(async move {
        while let Some(h) = handler.next().await {
            if h.is_err() {
                break;
            }
        }
    });

    println!("Browser launched successfully.");

    // --- Redis Connection ---
    let redis_client = redis::Client::open(redis_url).expect("Failed to create Redis client");
    // Use the recommended multiplexed connection
    let mut redis_conn = redis_client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    println!("Successfully connected to Redis.");
    println!("Listening for jobs on queue 'pdf-jobs'...");

    let queue_name = "pdf-jobs";

    loop {
        let result: Result<Option<(String, String)>, redis::RedisError> =
            redis::cmd("BRPOP")
                .arg(queue_name)
                .arg(0) // Block indefinitely
                .query_async(&mut redis_conn)
                .await;

        match result {
            Ok(Some((_queue, job_payload))) => {
                println!("Received job!");
                // For now, just deserialize and print.
                let job_data: Result<DialogueLine, _> = serde_json::from_str(&job_payload);
                match job_data {
                    Ok(data) => {
                        println!("Job data: {:?}", data);
                        // Here you would use the 'browser' instance
                    }
                    Err(e) => {
                        eprintln!("Failed to deserialize job payload: {}", e);
                    }
                }
            }
            Ok(None) => {
                continue;
            }
            Err(e) => {
                eprintln!("Error receiving job from Redis: {}", e);
                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
            }
        }
    }
}
