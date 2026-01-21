# Azure OpenAI Setup Guide

## Is Azure OpenAI Required?

**Short answer:** No, it's **optional** - but needed for AI features.

**Without Azure OpenAI:**
- ✅ App works normally
- ✅ All features work except AI
- ❌ AI Assistant won't work
- ❌ AI-powered features disabled

**With Azure OpenAI:**
- ✅ AI Assistant works
- ✅ AI-powered insights
- ✅ Risk prediction
- ✅ Budget forecasting
- ✅ All AI features enabled

---

## Required Environment Variables

You need **5 variables** for Azure OpenAI:

1. `AI_PROVIDER` - Set to `azure-openai`
2. `AZURE_OPENAI_ENDPOINT` - Your Azure OpenAI endpoint URL
3. `AZURE_OPENAI_API_KEY` - Your Azure API key
4. `AZURE_OPENAI_API_VERSION` - API version (usually `2024-02-15-preview`)
5. `AZURE_OPENAI_DEPLOYMENT_NAME` - Your deployment name
6. `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME` - Embedding deployment name

---

## Step-by-Step Setup

### Step 1: Get Azure OpenAI Credentials

1. **Go to Azure Portal:**
   - https://portal.azure.com
   - Sign in with your Azure account

2. **Find Your Azure OpenAI Resource:**
   - Search for "Azure OpenAI" in top search bar
   - Click on your resource (or create one if you don't have it)

3. **Get Endpoint:**
   - Go to: **Keys and Endpoint** (in left menu)
   - Copy the **Endpoint** URL
   - Example: `https://your-resource.openai.azure.com`
   - This is your `AZURE_OPENAI_ENDPOINT`

4. **Get API Key:**
   - Still in **Keys and Endpoint**
   - Copy **KEY 1** (or KEY 2)
   - This is your `AZURE_OPENAI_API_KEY`

5. **Get Deployment Names:**
   - Go to: **Deployments** (in left menu)
   - If you don't see deployments, you need to create them (see below)
   - Copy the **Deployment Name** (not the model name!)
   - Example: `gpt-4o-prod` (not `gpt-4o`)

---

### Step 2: Create Deployments (If You Don't Have Them)

If you don't see any deployments:

1. **Go to Model Catalog:**
   - Click **Model catalog** in left menu
   - You'll see available models

2. **Deploy GPT-4o:**
   - Click on `gpt-4o`
   - Click **"Deploy"** or **"Create deployment"**
   - **Deployment name**: `gpt-4o-prod` (your choice)
   - **Model**: `gpt-4o` (pre-selected)
   - Click **"Create"**
   - Wait 1-2 minutes

3. **Deploy Embeddings:**
   - Go back to Model catalog
   - Click on `text-embedding-ada-002`
   - Click **"Deploy"**
   - **Deployment name**: `embeddings-prod` (your choice)
   - Click **"Create"**

4. **Note the Names:**
   - Go to **Deployments** to see your deployment names
   - Copy them exactly as shown

---

### Step 3: Add to Vercel

1. **Go to Vercel:**
   - Dashboard → Your Project → Settings → Environment Variables

2. **Add Each Variable:**

   **Variable 1: AI_PROVIDER**
   - Key: `AI_PROVIDER`
   - Value: `azure-openai`
   - Environment: All

   **Variable 2: AZURE_OPENAI_ENDPOINT**
   - Key: `AZURE_OPENAI_ENDPOINT`
   - Value: `https://your-resource.openai.azure.com` (from Step 1)
   - Environment: All
   - **Important:** Include `https://` and no trailing slash

   **Variable 3: AZURE_OPENAI_API_KEY**
   - Key: `AZURE_OPENAI_API_KEY`
   - Value: `your-api-key-here` (from Step 1)
   - Environment: All
   - **Important:** Keep this secret!

   **Variable 4: AZURE_OPENAI_API_VERSION**
   - Key: `AZURE_OPENAI_API_VERSION`
   - Value: `2024-02-15-preview`
   - Environment: All

   **Variable 5: AZURE_OPENAI_DEPLOYMENT_NAME**
   - Key: `AZURE_OPENAI_DEPLOYMENT_NAME`
   - Value: `gpt-4o-prod` (your deployment name from Step 2)
   - Environment: All
   - **Important:** Use the deployment name, not the model name!

   **Variable 6: AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME**
   - Key: `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME`
   - Value: `embeddings-prod` (your embedding deployment name)
   - Environment: All

3. **Save Each Variable:**
   - Click "Save" after each one
   - Verify all 6 are listed

---

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

---

### Step 5: Test AI Features

1. Go to your app
2. Try the AI Assistant feature
3. Verify it works

---

## Quick Reference: All 6 Variables

```
AI_PROVIDER=azure-openai
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-prod
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=embeddings-prod
```

---

## Common Issues

### "Deployment not found"
- ✅ Check deployment name is correct (case-sensitive)
- ✅ Verify deployment exists in Azure Portal
- ✅ Make sure deployment status is "Succeeded"

### "Invalid API key"
- ✅ Check API key is correct (no extra spaces)
- ✅ Try KEY 2 if KEY 1 doesn't work
- ✅ Regenerate keys if needed

### "Endpoint not found"
- ✅ Include `https://` in endpoint
- ✅ No trailing slash
- ✅ Check endpoint URL is correct

### "Model not found"
- ✅ You're using deployment name, not model name
- ✅ Deployment name ≠ Model name
- ✅ Check deployment is active in Azure

---

## Cost Considerations

**Azure OpenAI Pricing:**
- GPT-4o: ~$5-15 per 1M tokens (input)
- GPT-4o Mini: ~$0.15-0.60 per 1M tokens (input)
- Embeddings: ~$0.10 per 1M tokens

**Tips:**
- Start with GPT-4o Mini for cost savings
- Monitor usage in Azure Portal
- Set up spending limits

---

## Optional: GPT-4o Mini Support

If you want to use GPT-4o Mini (cheaper):

1. **Create GPT-4o Mini Deployment:**
   - Model catalog → `gpt-4o-mini` → Deploy
   - Name: `gpt-4o-mini-prod`

2. **Add to Vercel (Optional):**
   - `AZURE_OPENAI_DEPLOYMENT_NAME_GPT4O_MINI=gpt-4o-mini-prod`
   - Code will need to be updated to support this

---

## Checklist

- [ ] Azure OpenAI resource created
- [ ] Endpoint copied
- [ ] API key copied
- [ ] Deployments created (GPT-4o and Embeddings)
- [ ] Deployment names noted
- [ ] All 6 variables added to Vercel
- [ ] App redeployed
- [ ] AI features tested

---

## Need Help?

- Azure Portal: https://portal.azure.com
- Azure OpenAI Docs: https://learn.microsoft.com/azure/ai-services/openai/
- Check Vercel logs if AI features don't work

---

**Note:** If you don't have Azure OpenAI yet, you can skip this for now. Your app will work fine without AI features. You can add it later when ready!
