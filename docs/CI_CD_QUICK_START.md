# CI/CD Quick Start Guide

This is a quick guide to get your hybrid CI/CD setup running in 5 minutes.

## Prerequisites

- ✅ GitHub repository (for GitHub Actions)
- ✅ Jenkins server (for self-hosted Jenkins - optional for now)
- ✅ Developer Dashboard running

## Quick Setup (5 Minutes)

### Step 1: Configure Environment Variables (2 minutes)

Add to your `.env.local` file:

```bash
# GitHub Webhook Secret
GITHUB_WEBHOOK_SECRET=your-random-secret-token-here

# Jenkins Webhook Token (if using Jenkins)
JENKINS_WEBHOOK_TOKEN=your-random-jenkins-token-here
```

**Generate secrets:**
```bash
# Generate GitHub webhook secret
openssl rand -hex 32

# Generate Jenkins webhook token
openssl rand -hex 32
```

### Step 2: Set Up GitHub Actions Webhook (2 minutes)

1. **Go to your GitHub repository**
   - Navigate to: `Settings → Webhooks → Add webhook`

2. **Configure webhook:**
   - **Payload URL**: `https://your-domain.com/api/developer/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Paste your `GITHUB_WEBHOOK_SECRET` value
   - **Events**: Select `workflow_run` and `push`
   - Click **Add webhook**

3. **Test webhook:**
   - GitHub will send a test payload
   - Check your dashboard logs to verify receipt

### Step 3: Add GitHub Actions Workflow (1 minute)

Copy `.github/workflows/ci.yml` to your repository (already created).

The workflow will automatically:
- ✅ Build your code
- ✅ Run tests
- ✅ Deploy to Dev (on `develop` branch)
- ✅ Deploy to Prod (on `main` branch)

### Step 4: Test It! (1 minute)

1. **Push code to repository:**
   ```bash
   git add .
   git commit -m "test: CI/CD integration"
   git push origin main
   ```

2. **Check GitHub Actions:**
   - Go to repository → **Actions** tab
   - See pipeline running

3. **Check Developer Dashboard:**
   - Go to: `Developer Dashboard → Deployments → Activity Timeline`
   - Should see pipeline execution events!

## Jenkins Setup (Optional - 10 minutes)

If you want to use Jenkins for private/enterprise repos:

### Step 1: Install Jenkins

```bash
# Install Jenkins (Ubuntu/Debian)
wget -q -O - https://pkg.jenkins.io/debian/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb http://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
sudo apt-get update
sudo apt-get install jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins
```

### Step 2: Configure Jenkins

1. **Access Jenkins**: `http://your-server:8080`
2. **Get admin password**: `sudo cat /var/lib/jenkins/secrets/initialAdminPassword`
3. **Install plugins**: Install suggested plugins
4. **Install Generic Webhook Trigger**: `Manage Jenkins → Plugins → Generic Webhook Trigger`

### Step 3: Create Jenkins Pipeline

1. **New Item → Pipeline → OK**
2. **Pipeline Definition**: Pipeline script from SCM
3. **SCM**: Git → Your repository
4. **Script Path**: `Jenkinsfile`
5. **Save**

### Step 4: Configure Webhook Credential

1. **Manage Jenkins → Credentials → Add Secret Text**
2. **ID**: `webhook-token`
3. **Secret**: Your `JENKINS_WEBHOOK_TOKEN` value
4. **Save**

### Step 5: Add Jenkinsfile

Copy `Jenkinsfile.example` to `Jenkinsfile` in your repository root.

Update the webhook URL:
```groovy
WEBHOOK_URL = 'https://your-domain.com/api/developer/webhooks/jenkins'
```

### Step 6: Test Jenkins

1. **Jenkins → Your Pipeline → Build Now**
2. **Check Developer Dashboard → Activity Timeline**
3. Should see Jenkins pipeline events!

## What You'll See

### Activity Timeline Events

After setup, you'll see events like:

1. **Pipeline Started** (GitHub Actions/Jenkins)
   - When: Pipeline begins execution
   - Shows: Build number, branch, commit

2. **Pipeline Completed** (GitHub Actions/Jenkins)
   - When: Pipeline finishes
   - Shows: Status (SUCCESS/FAILED), duration

3. **Code Change** (GitHub push)
   - When: Code is pushed to repository
   - Shows: Commit message, author, files changed

4. **Deployment** (Manual or automatic)
   - When: Code is deployed
   - Shows: Environment, version, status

## Troubleshooting

### GitHub Webhook Not Working?

1. **Check webhook delivery:**
   - GitHub → Settings → Webhooks → Recent Deliveries
   - Look for red X (failed) or green checkmark (success)

2. **Verify secret:**
   - Ensure `GITHUB_WEBHOOK_SECRET` in `.env.local` matches GitHub webhook secret

3. **Check logs:**
   - Dashboard server logs should show `[GitHub Webhook]` messages
   - Look for errors or success messages

### Jenkins Webhook Not Working?

1. **Check Jenkins build logs:**
   - Jenkins → Your Pipeline → Console Output
   - Look for curl/webhook command output

2. **Verify token:**
   - Ensure `JENKINS_WEBHOOK_TOKEN` matches Jenkins credential

3. **Test manually:**
   ```bash
   curl -X POST https://your-domain.com/api/developer/webhooks/jenkins \
     -H "Content-Type: application/json" \
     -H "X-Jenkins-Token: your-token" \
     -d '{"build": {"number": 1, "phase": "COMPLETED", "status": "SUCCESS"}}'
   ```

## Next Steps

1. ✅ Configure environment variables
2. ✅ Set up GitHub Actions webhook
3. ✅ Test with code push
4. ⏳ Set up Jenkins (optional)
5. ⏳ Configure deployment scripts
6. ⏳ Set up database models (for storing events)

## Support

For detailed setup instructions, see:
- `docs/HYBRID_CI_CD_SETUP.md` - Complete setup guide
- `docs/DEVELOPER_DASHBOARD_GUIDE.md` - Dashboard documentation

## Quick Test

Test your setup with this command:

```bash
# Test GitHub webhook (replace with your values)
curl -X POST http://localhost:3000/api/developer/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: workflow_run" \
  -H "X-Hub-Signature-256: sha256=your-signature" \
  -d '{"workflow_run": {"id": 123, "status": "completed", "conclusion": "success"}}'

# Test Jenkins webhook (replace with your values)
curl -X POST http://localhost:3000/api/developer/webhooks/jenkins \
  -H "Content-Type: application/json" \
  -H "X-Jenkins-Token: your-token" \
  -d '{"build": {"number": 1, "phase": "COMPLETED", "status": "SUCCESS"}}'
```

You should see events in your Activity Timeline!
