
# Deploying to Render

This guide will walk you through deploying your application to Render. Render is a modern PaaS that makes it easy to build, deploy, and scale your applications.

## Why Render?

*   **Easy to use:** Render has a simple and intuitive interface that makes it easy to get started.
*   **Fully managed:** Render manages your infrastructure, so you can focus on your code.
*   **Great for full-stack apps:** Render is well-suited for deploying full-stack applications like this one, with support for web services, databases, and more.
*   **Automatic deploys:** Render can automatically deploy your application whenever you push to your Git repository.

## 1. Create a new Web Service

1.  Go to the [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
2.  Connect your GitHub account and select your repository.
3.  Give your service a name (e.g., `ara-screenplay-ide`).
4.  For the **Environment**, select **Docker**.
5.  Render will automatically detect your `Dockerfile` and build your application.

## 2. Create a PostgreSQL Database

1.  Go to the [Render Dashboard](https://dashboard.render.com/) and click **New +** > **PostgreSQL**.
2.  Give your database a name (e.g., `ara-screenplay-db`).
3.  Choose a region that is close to your web service.
4.  Click **Create Database**.
5.  Render will provide you with a **Connection String**. You will use this to connect to your database.

## 3. Create a Redis Instance

1.  Go to the [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Redis**.
2.  Give your Redis instance a name (e.g., `ara-screenplay-redis`).
3.  Choose a region that is close to your web service.
4.  Click **Create Redis**.
5.  Render will provide you with a **Redis URL**. You will use this to connect to your Redis instance.

## 4. Configure Environment Variables

In the settings for your web service, go to the **Environment** tab and add the following environment variables:

*   `DATABASE_URL`: The connection string for your PostgreSQL database.
*   `REDIS_URL`: The URL for your Redis instance.
*   `JWT_SECRET`: A long, random string for signing JWTs.
*   `REFRESH_TOKEN_SECRET`: A long, random string for signing refresh tokens.
*   `GEMINI_API_KEY`: Your Gemini API key.
*   `NODE_ENV`: `production`

## 5. Set up Automatic Deploys

In the settings for your web service, go to the **Build & Deploy** tab and make sure that **Auto-Deploy** is set to **Yes**. This will automatically deploy your application whenever you push to your `main` branch.

## 6. Execute Deployment

Once you have configured your web service, database, and environment variables, you can manually trigger a deployment by clicking **Manual Deploy** > **Deploy latest commit**.

## 7. Verify Deployment

Once the deployment is complete, you can access your application at the URL provided by Render (e.g., `https://originals-know-what-to-copy.kesug.com/`).

You can monitor the logs for your web service in the **Logs** tab to ensure that everything is running correctly.
