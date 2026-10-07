# 🚀 Render (render.com) Deployment Guide

This guide explains how to deploy **Aura Botanica** to [Render](https://render.com) using the included `Dockerfile` and `render.yaml` Blueprint.

---

## 🌟 Why Render?
- **Zero Cloud Infrastructure Hassle:** No service account keys, no IAM permission binding, no manual CLI configuration.
- **Automated CI/CD:** Every `git push` to your GitHub repository automatically triggers a fresh build and zero-downtime deployment.
- **Free Tier Included:** Includes free web service hosting, automatic SSL/TLS certificates, and a custom domain manager.

---

## ⚡ Option 1: 1-Click Blueprint Deploy (Recommended)

Because your repository includes `render.yaml`, you can deploy everything automatically:

1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and log in (or sign up with your GitHub account).
2. Click the **New +** button in the top navigation and select **Blueprint**.
3. Connect your GitHub repository:
   👉 **`aditya1055441/herbal_spa_salon`**
4. Render will detect `render.yaml` and configure:
   - **Service Type:** Web Service (Docker)
   - **Environment Variables:** `NODE_ENV=production`, `PORT=10000`, `SQUARE_ENVIRONMENT=sandbox`
   - **Health Check Path:** `/api/health`
5. Click **Apply**. Render will immediately start the build and provide you with your live URL (e.g., `https://aura-botanica-spa.onrender.com`).

---

## 🛠️ Option 2: Manual Web Service Setup (Alternative)

If you prefer to configure the Web Service manually:

1. In the Render Dashboard, click **New +** > **Web Service**.
2. Select **Build and deploy from a Git repository** and pick `aditya1055441/herbal_spa_salon`.
3. Configure the following settings:
   - **Name:** `aura-botanica-spa`
   - **Region:** Any preferred region (e.g., `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch:** `master`
   - **Runtime:** `Docker`
   - **Instance Type:** `Free`
4. Expand **Advanced** and set:
   - **Health Check Path:** `/api/health`
   - **Docker Context:** `.`
   - **Dockerfile Path:** `Dockerfile`
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `SQUARE_ENVIRONMENT` = `sandbox`
   - `SQUARE_LOCATION_ID` = `L_AURA_SANCTUARY_01`
6. Click **Create Web Service**.

---

## 🔄 Automated CI/CD on Every Push

Render automatically connects to your GitHub repository webhook:
- Any time you run `git push origin master`, Render pulls the latest commit.
- Executes the multi-stage Docker build:
  1. Compiles the Angular 18 production client.
  2. Sets up Node.js Express static server & APIs.
  3. Launches the service on port `10000`.
- Health check verifies `/api/health` returns `200 OK`.
- Switches traffic seamlessly without downtime.

---

## 🌐 Custom Domain & Free SSL Setup
To connect your custom domain (e.g. `aurabotanica.com`):
1. In the Render dashboard, navigate to your `aura-botanica-spa` web service.
2. Click **Settings** > **Custom Domains**.
3. Click **Add Custom Domain** and enter your domain name.
4. Add the `CNAME` or `A` DNS records shown by Render to your domain registrar (GoDaddy, Namecheap, Cloudflare, Google Domains).
5. Render automatically issues and auto-renews a free Let's Encrypt SSL/TLS certificate.
