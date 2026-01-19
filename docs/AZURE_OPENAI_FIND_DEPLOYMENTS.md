# How to Find Deployments in Azure OpenAI Portal

## Where to Find Deployments

### Option 1: Left Sidebar Menu

Look in the **left sidebar** for one of these:
- **"Deployments"** (most common)
- **"Model deployments"**
- **"Deployments and models"**
- **"Deploy models"**

### Option 2: If You Don't See Deployments

**You might need to create a deployment first!**

If you're seeing:
- Overview
- Model catalog
- Keys and Endpoint
- Usage
- etc.

But **no "Deployments"** → You haven't created any deployments yet.

---

## How to Create a Deployment

### Step 1: Go to Model Catalog

1. In Azure OpenAI Portal, click **"Model catalog"** (or "Models")
2. You'll see available models:
   - `gpt-4o`
   - `gpt-4o-mini`
   - `gpt-4-turbo`
   - `text-embedding-ada-002`
   - etc.

### Step 2: Deploy a Model

1. **Click on a model** (e.g., `gpt-4o`)
2. Click **"Deploy"** or **"Create deployment"** button
3. Fill in the form:
   - **Deployment name**: `gpt-4o-prod` (your choice - this is what goes in Vercel!)
   - **Model**: `gpt-4o` (pre-selected)
   - **Version**: Latest (usually auto-selected)
   - **Capacity**: Choose based on your needs
4. Click **"Create"** or **"Deploy"**

### Step 3: Repeat for GPT-4o Mini

1. Go back to Model catalog
2. Click on `gpt-4o-mini`
3. Click **"Deploy"**
4. **Deployment name**: `gpt-4o-mini-prod` (your choice)
5. Click **"Create"**

### Step 4: Find Your Deployment Names

After creating deployments, you should see:
- **"Deployments"** option in the left menu
- Or go to **"Overview"** → Scroll down → See "Deployments" section

---

## Alternative: Check Overview Page

1. Click **"Overview"** in left menu
2. Scroll down to see **"Deployments"** section
3. You'll see your deployments listed there

---

## If You Still Can't Find It

### Check Your Azure OpenAI Resource Type

Make sure you're in:
- **Azure OpenAI** resource (not Cognitive Services)
- The correct subscription
- The correct resource group

### Try This:

1. Go to Azure Portal: https://portal.azure.com
2. Search for **"Azure OpenAI"** in top search bar
3. Click on your Azure OpenAI resource
4. Look for **"Deployments"** in left menu
5. If not there, try **"Model deployments"** or check **"Overview"** page

---

## Quick Setup: Create Your First Deployment

### For GPT-4o:

1. **Model catalog** → Click `gpt-4o` → **"Deploy"**
2. **Deployment name**: `gpt-4o-prod`
3. Click **"Create"**
4. Wait 1-2 minutes for deployment

### For GPT-4o Mini:

1. **Model catalog** → Click `gpt-4o-mini` → **"Deploy"**
2. **Deployment name**: `gpt-4o-mini-prod`
3. Click **"Create"**
4. Wait 1-2 minutes for deployment

### For Embeddings:

1. **Model catalog** → Click `text-embedding-ada-002` → **"Deploy"**
2. **Deployment name**: `embeddings-prod`
3. Click **"Create"**

---

## After Creating Deployments

You'll see them in:
- **"Deployments"** section (now visible in left menu)
- **Overview** page → Deployments section

**Copy the deployment names** and use them in Vercel!

---

## What to Put in Vercel (After Creating)

```
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-prod
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=embeddings-prod
```

(Use the exact names you gave when creating deployments)

---

**If you don't see "Deployments", you need to create them first from Model catalog!** 🚀
