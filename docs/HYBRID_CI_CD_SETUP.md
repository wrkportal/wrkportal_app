# Hybrid CI/CD Setup Guide

This guide explains how to set up the hybrid CI/CD approach for the Developer Dashboard, integrating both GitHub Actions and self-hosted Jenkins.

## Overview

The hybrid approach provides:
- **GitHub Actions**: For public repositories (free, unlimited minutes)
- **Jenkins**: For private/enterprise repositories (self-hosted, full control)
- **Unified Dashboard**: Single view of all CI/CD events across both providers

## Architecture

```
┌─────────────────────┐
│  Public Repos       │
│  (GitHub Actions)   │────┐
└─────────────────────┘    │
                           │ Webhooks
┌─────────────────────┐    │
│  Private Repos      │    │
│  (Jenkins)          │────┼──→┌──────────────────────┐
└─────────────────────┘    │   │  Developer Dashboard │
                           │   │  Webhook Endpoints   │
┌─────────────────────┐    │   └──────────────────────┘
│  Enterprise Repos   │    │              │
│  (Jenkins)          │────┘              │
└─────────────────────┘                   │
                                          │
                                          ↓
                                 ┌──────────────────┐
                                 │  Activity        │
                                 │  Timeline        │
                                 │  (Unified View)  │
                                 └──────────────────┘
```

## Part 1: GitHub Actions Integration

### Step 1: Set Up GitHub Actions Webhook

1. **Go to GitHub Repository Settings**
   - Navigate to: `Settings → Webhooks → Add webhook`

2. **Configure Webhook**
   - **Payload URL**: `https://your-domain.com/api/developer/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Generate a secret token (save this!)
   - **Events**: Select `workflow_run` and `push`

3. **Add Secret to Environment**
   ```bash
   # Add to .env.local
   GITHUB_WEBHOOK_SECRET=your-generated-secret-token
   ```

4. **Test Webhook**
   - GitHub will send a test payload
   - Check your dashboard logs to verify receipt

### Step 2: Create GitHub Actions Workflow

Create `.github/workflows/ci.yml` in your repository:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  workflow_dispatch: # Allow manual trigger

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Dev
      if: github.ref == 'refs/heads/develop'
      run: |
        echo "Deploying to dev environment..."
        # Your deployment script here
    
    - name: Deploy to Production
      if: github.ref == 'refs/heads/main'
      run: |
        echo "Deploying to production..."
        # Your deployment script here
```

### Step 3: Verify Integration

1. **Push code to repository**
   ```bash
   git push origin main
   ```

2. **Check GitHub Actions**
   - Go to repository → Actions tab
   - See pipeline running

3. **Check Developer Dashboard**
   - Go to Deployments → Activity Timeline
   - Should see pipeline execution events

## Part 2: Jenkins Integration

### Step 1: Install Jenkins

1. **Requirements**
   - Server/VM with Java 8+
   - Minimum 1GB RAM (4GB+ recommended)

2. **Install Jenkins**
   ```bash
   # Ubuntu/Debian
   wget -q -O - https://pkg.jenkins.io/debian/jenkins.io.key | sudo apt-key add -
   sudo sh -c 'echo deb http://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
   sudo apt-get update
   sudo apt-get install jenkins

   # Start Jenkins
   sudo systemctl start jenkins
   sudo systemctl enable jenkins
   ```

3. **Access Jenkins**
   - Open: `http://your-server:8080`
   - Get initial admin password: `sudo cat /var/lib/jenkins/secrets/initialAdminPassword`
   - Install suggested plugins

### Step 2: Install Webhook Plugin

1. **Install Generic Webhook Trigger Plugin**
   - Go to: `Manage Jenkins → Manage Plugins → Available`
   - Search: "Generic Webhook Trigger"
   - Install and restart Jenkins

### Step 3: Create Jenkins Pipeline

1. **Create New Pipeline Job**
   - Go to: `New Item → Pipeline → OK`

2. **Configure Pipeline**
   - **Pipeline Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: Your repository URL
   - **Credentials**: Add Git credentials if needed
   - **Script Path**: `Jenkinsfile`

3. **Create Jenkinsfile** in your repository root:

```groovy
pipeline {
    agent any
    
    environment {
        WEBHOOK_URL = 'https://your-domain.com/api/developer/webhooks/jenkins'
        WEBHOOK_TOKEN = credentials('webhook-token')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                sh 'echo "Deploying to dev..."'
                // Your deployment script
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                sh 'echo "Deploying to production..."'
                // Your deployment script
            }
        }
    }
    
    post {
        always {
            // Send webhook to dashboard
            sh '''
                curl -X POST ${WEBHOOK_URL} \
                    -H "Content-Type: application/json" \
                    -H "X-Jenkins-Token: ${WEBHOOK_TOKEN}" \
                    -d '{
                        "build": {
                            "number": ${BUILD_NUMBER},
                            "phase": "${BUILD_PHASE}",
                            "status": "${BUILD_STATUS}",
                            "url": "${BUILD_URL}",
                            "full_url": "${BUILD_URL}",
                            "scm": {
                                "commit": "${GIT_COMMIT}",
                                "branch": ["${GIT_BRANCH}"]
                            },
                            "timestamp": '$(date +%s)000',
                            "duration": '${BUILD_DURATION}'
                        },
                        "name": "${JOB_NAME}",
                        "fullName": "${JOB_FULL_NAME}",
                        "url": "${JOB_URL}",
                        "result": "${BUILD_STATUS}"
                    }'
            '''
        }
    }
}
```

### Step 4: Configure Webhook Authentication

1. **Add Webhook Token Credential**
   - Go to: `Manage Jenkins → Manage Credentials`
   - Add: Secret text credential
   - ID: `webhook-token`
   - Secret: Generate a token (save this!)

2. **Add Token to Environment**
   ```bash
   # Add to .env.local
   JENKINS_WEBHOOK_TOKEN=your-generated-token
   ```

### Step 5: Test Jenkins Integration

1. **Run Pipeline**
   - Go to Jenkins → Your Pipeline → Build Now

2. **Check Developer Dashboard**
   - Go to Deployments → Activity Timeline
   - Should see Jenkins pipeline execution events

## Part 3: Dashboard Integration

### Environment Variables

Add to `.env.local`:

```bash
# GitHub Webhook
GITHUB_WEBHOOK_SECRET=your-github-webhook-secret

# Jenkins Webhook
JENKINS_WEBHOOK_TOKEN=your-jenkins-webhook-token
```

### Webhook Endpoints

The following endpoints are already created:

1. **GitHub Webhook**: `POST /api/developer/webhooks/github`
2. **Jenkins Webhook**: `POST /api/developer/webhooks/jenkins`

Both endpoints:
- Verify webhook signatures/tokens
- Process CI/CD events
- Create timeline events
- Support activity timeline integration

### Activity Timeline Integration

The Activity Timeline automatically displays:
- ✅ Pipeline executions from GitHub Actions
- ✅ Pipeline executions from Jenkins
- ✅ Code changes (from GitHub push events)
- ✅ Deployments
- ✅ Configuration changes
- ✅ Manual actions

## Testing the Integration

### Test GitHub Actions Webhook

1. **Push code to repository**
   ```bash
   git push origin main
   ```

2. **Check Activity Timeline**
   - Developer Dashboard → Deployments → Activity Timeline
   - Should see: "Pipeline Started" and "Pipeline Completed" events

### Test Jenkins Webhook

1. **Trigger Jenkins build**
   - Jenkins → Your Pipeline → Build Now

2. **Check Activity Timeline**
   - Developer Dashboard → Deployments → Activity Timeline
   - Should see: Jenkins pipeline execution events

## Troubleshooting

### GitHub Webhook Not Working

1. **Check webhook delivery**
   - GitHub → Settings → Webhooks → Recent Deliveries
   - Look for failed deliveries

2. **Verify secret**
   - Ensure `GITHUB_WEBHOOK_SECRET` matches in both GitHub and `.env.local`

3. **Check logs**
   - Dashboard logs should show webhook receipt
   - Look for "GitHub Webhook" messages

### Jenkins Webhook Not Working

1. **Check Jenkins build logs**
   - Jenkins → Your Pipeline → Console Output
   - Look for curl/webhook command output

2. **Verify token**
   - Ensure `JENKINS_WEBHOOK_TOKEN` matches in both Jenkins credentials and `.env.local`

3. **Test webhook manually**
   ```bash
   curl -X POST https://your-domain.com/api/developer/webhooks/jenkins \
     -H "Content-Type: application/json" \
     -H "X-Jenkins-Token: your-token" \
     -d '{"build": {"number": 1, "phase": "COMPLETED", "status": "SUCCESS"}}'
   ```

## Security Considerations

1. **Webhook Secrets/Tokens**: Always use strong, unique secrets
2. **HTTPS**: Use HTTPS for webhook URLs (not HTTP)
3. **Authentication**: Webhooks verify signatures/tokens before processing
4. **Rate Limiting**: Consider adding rate limiting for webhook endpoints

## Next Steps

1. ✅ Set up GitHub Actions webhook
2. ✅ Set up Jenkins webhook
3. ✅ Configure environment variables
4. ✅ Test integration
5. 🔄 Create database models for storing pipeline events (optional)
6. 🔄 Add real-time updates using WebSockets (optional)

## Support

For issues or questions:
- Check webhook delivery logs in GitHub/Jenkins
- Check dashboard server logs
- Verify environment variables
- Test webhook endpoints manually
