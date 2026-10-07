# 🚀 Google Cloud Platform (GCP) CI/CD Setup Guide

This guide provides the complete setup for automated continuous integration and continuous deployment (CI/CD) from your GitHub repository ([herbal_spa_salon](https://github.com/aditya1055441/herbal_spa_salon.git)) to **Google Cloud Run**.

---

## 📋 Architecture Overview
Every time you push to the `master` or `main` branch, the GitHub Actions pipeline (`.github/workflows/deploy-gcp.yml`) automatically:
1. **Installs & Tests:** Runs backend unit tests and 21 Angular Karma tests in headless Chrome.
2. **Builds:** Compiles the Angular frontend production bundle.
3. **Containerizes:** Builds the multi-stage production Docker container.
4. **Pushes:** Authenticates and pushes the container image to Google Container Registry / Artifact Registry.
5. **Deploys:** Deploys the container to **Google Cloud Run** on port `8080` with auto-scaling, SSL, and public access.

---

## 🛠️ Step 1: Enable Required GCP APIs
In your [Google Cloud Console](https://console.cloud.google.com/) (or using the `gcloud` CLI), enable the necessary APIs for your project:

```bash
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com
```

---

## 🔑 Step 2: Create a Service Account for GitHub Actions
Create a dedicated service account with the minimal required permissions to build and deploy to Cloud Run:

```bash
# Set your GCP Project ID
export GCP_PROJECT_ID="YOUR_ACTUAL_GCP_PROJECT_ID"
gcloud config set project $GCP_PROJECT_ID

# 1. Create the Service Account
gcloud iam service-accounts create github-deployer \
  --description="Service account for GitHub Actions CI/CD deployment" \
  --display-name="GitHub Deployer"

# 2. Assign Cloud Run Admin role
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-deployer@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# 3. Assign Storage Admin role (to push images to Container Registry)
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-deployer@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# 4. Assign Service Account User role (to run instances as the compute service account)
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-deployer@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

---

## 📄 Step 3: Generate the Service Account JSON Key
Generate a secure JSON key file for this service account:

```bash
gcloud iam service-accounts keys create gcp-sa-key.json \
  --iam-account=github-deployer@$GCP_PROJECT_ID.iam.gserviceaccount.com
```

> ⚠️ **Important:** Keep `gcp-sa-key.json` safe. Never commit it to git or push it to public repositories.

---

## 🔐 Step 4: Configure GitHub Repository Secrets
1. Navigate to your GitHub repository in your browser:  
   👉 **`https://github.com/aditya1055441/herbal_spa_salon/settings/secrets/actions`**
2. Click **New repository secret** and add the following two secrets:

| Secret Name | Value |
|---|---|
| `GCP_PROJECT_ID` | Your Google Cloud project ID (e.g., `aura-botanica-production`) |
| `GCP_SA_KEY` | The entire content of `gcp-sa-key.json` (open the file and paste everything from `{` to `}`) |

---

## 🚀 Step 5: Triggering the Pipeline
Once the secrets are saved:
1. Commit and push the new `.github/workflows/deploy-gcp.yml` workflow:
   ```bash
   git add .github/ karma.conf.js frontend/package.json GCP_CICD_SETUP.md
   git commit -m "Configure GitHub Actions CI/CD for Google Cloud Run"
   git push origin master
   ```
2. In GitHub, go to the **Actions** tab:  
   👉 **`https://github.com/aditya1055441/herbal_spa_salon/actions`**
3. Watch the workflow execute:
   - `ci-test-and-build` runs and validates all 21 tests and production compilation.
   - `cd-deploy-to-gcp` builds the container, pushes to GCP, and deploys to Cloud Run.
4. When finished, the live Cloud Run URL (e.g. `https://aura-botanica-spa-xxxxxx-uc.a.run.app`) will be printed in the **Job Summary**!

---

## 🌐 Step 6: Custom Domain Mapping (Optional)
To map your own domain (e.g. `aurabotanica.com`):
1. In GCP Console, go to **Cloud Run** > **Custom Domains**.
2. Click **Add Mapping**, select your service `aura-botanica-spa`, and enter your domain.
3. GCP will provide standard DNS `CNAME` / `A` records to add to your DNS registrar (GoDaddy, Namecheap, Cloudflare, Route53).
4. Google automatically provisions and renews a free SSL certificate.
