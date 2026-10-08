# AURA BOTANICA — Deployment & Operations Guide

## 🌿 Overview
Aura Botanica is a full-stack, chemical-free herbal spa & salon platform built with:
- **Frontend:** Angular 18 (Standalone Components, Signals, Vanilla CSS Luxury Design System, Square Web Payments SDK)
- **Backend:** Node.js (Express, Square Payments API, Bookings API, Static SPA Server)
- **Hosting Compatibility:** Google Cloud Platform (Cloud Run) or Amazon Web Services (AWS App Runner / ECS)

---

## ☁️ Google Cloud Platform (GCP) Deployment

### Option A: Google Cloud Run (Recommended Containerized Deployment)
Google Cloud Run automatically manages scaling, SSL certificates, custom domains, and zero-downtime deployments.

1. **Prerequisites:**
   - Install the Google Cloud SDK (`gcloud`).
   - Authenticate with your GCP project:
     ```bash
     gcloud auth login
     gcloud config set project YOUR_GCP_PROJECT_ID
     ```

2. **One-Command Build & Deploy:**
   Run from the repository root:
   ```bash
   gcloud builds submit --config=cloudbuild.yaml
   ```
   Or deploy directly from source:
   ```bash
   gcloud run deploy aura-botanica-spa \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --port 8080 \
     --set-env-vars SQUARE_ENVIRONMENT=sandbox,SQUARE_LOCATION_ID=L_AURA_SANCTUARY_01
   ```

3. **Custom Domain & SSL:**
   - In GCP Console, go to **Cloud Run** > **Custom Domains**.
   - Map `yourdomain.com` and `www.yourdomain.com`. GCP automatically provisions a free Google-managed SSL certificate.

---

## ⛅ Amazon Web Services (AWS) Deployment

### Option A: AWS App Runner (Easiest Managed Container)
1. Build and push the Docker image to AWS Elastic Container Registry (ECR):
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
   docker build -t aura-botanica-spa .
   docker tag aura-botanica-spa:latest YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/aura-botanica-spa:latest
   docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/aura-botanica-spa:latest
   ```
2. In AWS Console > **App Runner**, click **Create Service** and select the container image from ECR on Port 8080.

---

## 💳 Razorpay Payment Gateway Integration

### 1. Backend Key Security (Zero Secret Exposure)
The Razorpay credentials are maintained **exclusively on the backend server** (`server.js` or environment variables) and are never exposed in Angular client bundles:
- **Test Key ID:** `rzp_test_TlHmBY5CY5RsrT`
- **Test Key Secret:** `uhonCePTSwHWV7nvWpwHlhrU`

Environment variables on Render, GCP, or AWS:
- `RAZORPAY_KEY_ID`: `rzp_test_TlHmBY5CY5RsrT`
- `RAZORPAY_KEY_SECRET`: `uhonCePTSwHWV7nvWpwHlhrU`

### 2. Card Checkout Flow (`/checkout`):
- When a customer adds remedies to their bag, they can click **Proceed to Checkout**.
- The customer selects **Credit Card** or **Debit Card** and provides:
  - Cardholder Name
  - Card Number (16-19 digits, formatted)
  - Expiry Date (`MM/YY`)
  - CVV (`3-4 digits`)
- The frontend requests the backend to create an official Razorpay Order (`/api/razorpay/create-order`).
- The payment is authorized and validated using **cryptographic HMAC-SHA256 signature verification** on the backend (`/api/razorpay/verify-payment`) using the secret key.
- The order is recorded in the customer's dashboard and the bag is cleared.

---

## 💳 Square POS Integration Walk-Through

### 1. Square Developer Portal
1. Visit [developer.squareup.com](https://developer.squareup.com/) and log in or create your account.
2. Under **Applications**, open your Application (or create "Aura Botanica Spa").
3. Note your credentials:
   - **Application ID** (Sandbox: `sandbox-sq0idb-...`, Production: `sq0idp-...`)
   - **Access Token** (Sandbox: `sandbox-sq0atb-...`, Production: `EAAA...`)
   - **Location ID** (Found under Locations tab: `L_...`)

### 2. Updating Frontend & Backend Credentials
- **Backend:** Update your environment variables (`SQUARE_APPLICATION_ID`, `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_ENVIRONMENT=production`).
- **Frontend:** Located in `frontend/src/app/services/square.service.ts` or provided dynamically via the `/api/health` configuration endpoint.

---

## 🌸 Customer Portal & Email Verification System
The website provides a dedicated **Sanctuary Circle Member Portal** accessible via `/customer/auth` and `/account`:

### ✉️ Registration & Email Verification Workflow:
1. **Email Submission:**
   - Guest provides their email address and clicks **Send Email Verification Code**.
2. **Verification Code Dispatch (OTP):**
   - The backend server generates a cryptographically random **6-digit verification code** valid for 10 minutes.
   - Dispatches code to user's email address and logs to the email service dispatch queue.
   - For demo/development testing, a visual indicator displays the active code for instant convenience.
3. **Email Verification & Account Setup:**
   - Guest enters the 6-digit code received in their email, along with their name, phone number, and password.
   - Passwords are encrypted using one-way salted **SHA-256**.
   - Upon verification, the user receives an active customer session and is granted access to `/account`.
4. **Member Dashboard (`/account`):**
   - View upcoming & past synchronized appointments with Square POS payment reference and practitioner assignment.
   - Pre-fills guest contact information in the booking checkout flow for friction-free reservations.
   - Fast access to holistic diagnostic prescriptions and botanical apothecary remedies.

---

## 👩‍💼 Practitioner CMS & Admin Panel Walk-Through
The built-in CMS is protected behind a strict Angular Route Guard and backend session validator:

### 🛡️ Route Protection & Cross-Browser Isolation:
1. **Restricted Direct URL Access:**
   - Attempting to directly open `http://localhost:4200/admin` in any unauthenticated browser, incognito window, or new session is **automatically blocked by `adminAuthGuard` (`CanActivateFn`)** and immediately redirected to `/login`.
   - The `/admin` URL and management dashboard are inaccessible until a verified session token is active in that specific browser session (`sessionStorage`).
2. **Dedicated Login Page (`/login`):**
   - Practitioners log in at `/login`.
   - Initial credentials: Username `admin` • Password `system`.
3. **One-Way Cryptographic Hashing:**
   - Passwords are **never stored in plain text**.
   - Input passwords are salted and hashed using one-way **SHA-256** via the native Web Crypto API.
4. **Mandatory First-Time Password Reset:**
   - Upon initial sign-in with the default `system` password, the practitioner is immediately presented with a mandatory password update screen on `/login`.
   - Once the new password has been hashed and updated on both frontend and backend, the practitioner is redirected to `/admin`.
5. **Session Management & Sign Out:**
   - Each browser session holds its own cryptographically secure session token.
   - Clicking **Sign Out** immediately invalidates the session and redirects the user back to `/login`.

### 📋 Management Capabilities:
1. **📅 Bookings & Schedule Tab:**
   - Real-time list of all appointments booked by guests.
   - Shows guest name, contact info, chosen ritual, specialist, allergy/health notes, and Square POS transaction reference.
   - 1-click status updates (`Completed`, `Cancelled`).

2. **🌿 Rituals & Services Tab:**
   - Update ritual prices ($ USD), durations, descriptive narratives, and whole plant ingredients without touching code.
   - Updates propagate in real-time across the website, diagnostic quiz recommendations, and booking flows.

3. **🏺 Apothecary Inventory Tab:**
   - Toggle in-stock status for take-home botanical remedies.
   - Update prices, sizes, and usage directions.

4. **⚙️ Square API & Cloud Settings Tab:**
   - Verifies Square Web Payments SDK connection and displays deployment telemetry.

---

## 🛡️ 30-Day Post-Launch Support Guarantee
Included with this delivery:
- Assistance updating live Square POS Production credentials.
- DNS and Custom Domain record configuration assistance on GCP or AWS.
- Training walkthrough for salon practitioners and receptionists on managing appointments.
