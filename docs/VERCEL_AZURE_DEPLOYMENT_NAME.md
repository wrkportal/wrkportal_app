# Vercel Environment Variable: Azure OpenAI Deployment Name

## Quick Answer

**Put the exact deployment name you created in Azure OpenAI Portal.**

It's **NOT** the model name (gpt-4o, gpt-4o-mini).  
It's the **deployment name** you gave it when creating the deployment in Azure.

---

## How to Find Your Deployment Name

### Step 1: Go to Azure Portal

1. Go to https://portal.azure.com
2. Navigate to: **Azure OpenAI** → Your Resource → **Deployments**

### Step 2: Look at the "Deployment Name" Column

You'll see something like:
```
┌─────────────────────────────────────────────┐
│ Deployment Name    │ Model        │ Status   │
├─────────────────────────────────────────────┤
│ gpt-4o-prod       │ gpt-4o       │ Active   │
│ gpt-4o-mini-prod  │ gpt-4o-mini  │ Active   │
└─────────────────────────────────────────────┘
```

**The "Deployment Name" column** = What to put in Vercel

---

## What to Put in Vercel

### If You Have ONE Deployment (Handles Both Models)

```
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-deployment
```

**Example:**
- If your deployment is named `gpt-4o-prod` → Use `gpt-4o-prod`
- If your deployment is named `my-ai-deployment` → Use `my-ai-deployment`

---

### If You Have SEPARATE Deployments (Recommended)

You'll need to update the code to support multiple deployment names, or use:

```
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-prod
```

And the code will route to the correct deployment based on the model selected.

**For now, use the GPT-4o deployment name** (we'll add GPT-4o Mini support in code later).

---

## Complete Vercel Environment Variables

### Required:

```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name-from-azure
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=your-embedding-deployment-name
```

### Example:

```
AZURE_OPENAI_ENDPOINT=https://myresource.openai.azure.com
AZURE_OPENAI_API_KEY=abc123xyz789
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-prod
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=embeddings-prod
```

---

## Common Deployment Names

People often name their deployments like:
- `gpt-4o-prod`
- `gpt-4o-production`
- `gpt-4o-deployment`
- `gpt-4`
- `chat-gpt-4o`
- `my-ai-deployment`

**Use whatever you named it in Azure!**

---

## If You Haven't Created a Deployment Yet

### Create in Azure:

1. Go to Azure Portal → Your OpenAI Resource
2. Click **"Deployments"** → **"Create"**
3. **Deployment name**: `gpt-4o-prod` (your choice)
4. **Model**: Select `gpt-4o` (or `gpt-4o-mini`)
5. Click **"Create"**

### Then in Vercel:

```
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-prod
```

---

## Important Notes

1. **Deployment Name ≠ Model Name**
   - ❌ Don't use: `gpt-4o` or `gpt-4o-mini` (these are model names)
   - ✅ Use: `gpt-4o-prod` or whatever you named it (deployment name)

2. **Case Sensitive**
   - Use exact case from Azure Portal
   - `gpt-4o-prod` ≠ `GPT-4O-PROD`

3. **No Spaces**
   - Deployment names usually don't have spaces
   - If yours does, use it exactly as shown

---

## Quick Checklist

- [ ] Go to Azure Portal → Deployments
- [ ] Find your deployment name (first column)
- [ ] Copy it exactly
- [ ] Paste into Vercel: `AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name`
- [ ] Save and redeploy

---

**Use the exact deployment name from Azure Portal, not the model name!** 🎯
