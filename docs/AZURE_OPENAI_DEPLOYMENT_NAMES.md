# Azure OpenAI Deployment Names for Vercel

## Important: Deployment Name vs Model Name

**Deployment Name** = The name you gave your deployment in Azure OpenAI Portal  
**Model Name** = The actual model (gpt-4o, gpt-4o-mini)

These are **different**!

---

## What to Put in Vercel Environment Variables

### Option 1: Single Deployment (One Deployment for All Models)

If you created **one deployment** in Azure that can handle both GPT-4o and GPT-4o-mini:

```
AZURE_OPENAI_DEPLOYMENT_NAME="your-deployment-name"
```

**Example:**
```
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o-deployment"
```

**Note:** You'll need to specify the model in the API call, not just use the deployment name.

---

### Option 2: Separate Deployments (Recommended)

If you created **separate deployments** for each model:

```
AZURE_OPENAI_DEPLOYMENT_NAME_GPT4O="gpt-4o-deployment"
AZURE_OPENAI_DEPLOYMENT_NAME_GPT4O_MINI="gpt-4o-mini-deployment"
```

**Example:**
```
AZURE_OPENAI_DEPLOYMENT_NAME_GPT4O="gpt-4o-prod"
AZURE_OPENAI_DEPLOYMENT_NAME_GPT4O_MINI="gpt-4o-mini-prod"
```

**Then use:**
- `AZURE_OPENAI_DEPLOYMENT_NAME_GPT4O` for GPT-4o queries
- `AZURE_OPENAI_DEPLOYMENT_NAME_GPT4O_MINI` for GPT-4o Mini queries

---

## How to Find Your Deployment Name

### Step 1: Go to Azure OpenAI Portal

1. Go to https://portal.azure.com
2. Navigate to your Azure OpenAI resource
3. Click "Deployments" in the left menu

### Step 2: Check Your Deployments

You'll see a list like:
```
Deployment Name          Model           Status
─────────────────────────────────────────────
gpt-4o-prod             gpt-4o          Succeeded
gpt-4o-mini-prod        gpt-4o-mini     Succeeded
```

**The "Deployment Name" column** is what you need!

---

## Recommended Setup in Azure

### Create Two Deployments:

1. **GPT-4o Deployment:**
   - Deployment Name: `gpt-4o-prod` (or your choice)
   - Model: `gpt-4o`
   - Purpose: Premium queries

2. **GPT-4o Mini Deployment:**
   - Deployment Name: `gpt-4o-mini-prod` (or your choice)
   - Model: `gpt-4o-mini`
   - Purpose: Cost-effective queries

---

## Vercel Environment Variables (Complete List)

### Required for Azure OpenAI:

```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### For Single Deployment:

```
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-deployment
```

### For Separate Deployments (Recommended):

```
AZURE_OPENAI_DEPLOYMENT_NAME_GPT4O=gpt-4o-prod
AZURE_OPENAI_DEPLOYMENT_NAME_GPT4O_MINI=gpt-4o-mini-prod
```

### Embedding Deployment (Always Required):

```
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002
```

---

## Example: What You'll See in Azure

### Azure OpenAI Portal → Deployments:

```
┌─────────────────────────────────────────────┐
│ Deployment Name    │ Model        │ Status   │
├─────────────────────────────────────────────┤
│ gpt-4o-prod       │ gpt-4o       │ Active   │
│ gpt-4o-mini-prod  │ gpt-4o-mini  │ Active   │
│ embeddings-prod   │ ada-002      │ Active   │
└─────────────────────────────────────────────┘
```

### Then in Vercel:

```
AZURE_OPENAI_DEPLOYMENT_NAME_GPT4O=gpt-4o-prod
AZURE_OPENAI_DEPLOYMENT_NAME_GPT4O_MINI=gpt-4o-mini-prod
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=embeddings-prod
```

---

## Quick Reference

**What to put in Vercel:**
- Use the **exact deployment name** from Azure Portal
- It's **NOT** the model name (gpt-4o, gpt-4o-mini)
- It's the **name you gave the deployment** when creating it

**Common Names:**
- `gpt-4o-prod`
- `gpt-4o-production`
- `gpt-4o-deployment`
- `gpt-4o-mini-prod`
- `gpt-4o-mini-production`

**Whatever you named it in Azure, use that exact name!**

---

## If You Haven't Created Deployments Yet

### Step 1: Create Deployments in Azure

1. Go to Azure Portal → Your OpenAI Resource → Deployments
2. Click "Create" → "Deploy model"
3. **Deployment name**: `gpt-4o-prod` (your choice)
4. **Model**: Select `gpt-4o`
5. Click "Create"
6. Repeat for GPT-4o Mini: `gpt-4o-mini-prod`

### Step 2: Add to Vercel

Use the exact deployment names you created:
```
AZURE_OPENAI_DEPLOYMENT_NAME_GPT4O=gpt-4o-prod
AZURE_OPENAI_DEPLOYMENT_NAME_GPT4O_MINI=gpt-4o-mini-prod
```

---

**Use the exact deployment name from Azure Portal, not the model name!** 🎯
