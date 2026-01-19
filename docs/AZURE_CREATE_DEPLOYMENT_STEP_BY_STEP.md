# Step-by-Step: Create Azure OpenAI Deployments

## You're in the Right Place!

If you see **"Model catalog"**, you're in the correct location. You need to **create deployments** from there.

---

## Step-by-Step Instructions

### Step 1: Go to Model Catalog

1. In Azure OpenAI Portal, click **"Model catalog"** (you already see this!)
2. You'll see a list of available models:
   - `gpt-4o`
   - `gpt-4o-mini`
   - `gpt-4-turbo`
   - `text-embedding-ada-002`
   - etc.

### Step 2: Create GPT-4o Deployment

1. **Find `gpt-4o`** in the model list
2. **Click on it** (or look for a "Deploy" button)
3. You should see options like:
   - **"Deploy"** button
   - **"Create deployment"** button
   - Or a deployment form

4. **Fill in the form:**
   - **Deployment name**: `gpt-4o-prod` ← **This is what goes in Vercel!**
     - (You can name it anything: `gpt-4o-deployment`, `my-gpt4o`, etc.)
   - **Model**: `gpt-4o` (usually pre-selected)
   - **Version**: Latest (usually auto-selected)
   - **Capacity/SKU**: Choose based on your needs (start with smallest)

5. **Click "Create"** or **"Deploy"**
6. **Wait 1-2 minutes** for deployment to complete

### Step 3: Create GPT-4o Mini Deployment

1. Go back to **"Model catalog"**
2. **Find `gpt-4o-mini`**
3. **Click on it** → **"Deploy"**
4. **Deployment name**: `gpt-4o-mini-prod` ← **This is what goes in Vercel!**
5. **Click "Create"**
6. **Wait 1-2 minutes**

### Step 4: Create Embedding Deployment

1. Go to **"Model catalog"**
2. **Find `text-embedding-ada-002`**
3. **Click on it** → **"Deploy"**
4. **Deployment name**: `embeddings-prod` ← **This is what goes in Vercel!**
5. **Click "Create"**

---

## After Creating Deployments

### Option 1: Check Overview Page

1. Click **"Overview"** in left menu
2. Scroll down
3. You should see a **"Deployments"** section showing your deployments

### Option 2: "Deployments" Menu Appears

After creating your first deployment, **"Deployments"** should appear in the left menu.

---

## What You'll See

After creating deployments, you'll see:

```
Deployments:
┌─────────────────────────────────────────┐
│ gpt-4o-prod       │ gpt-4o       │ ✅   │
│ gpt-4o-mini-prod  │ gpt-4o-mini  │ ✅   │
│ embeddings-prod   │ ada-002      │ ✅   │
└─────────────────────────────────────────┘
```

---

## What to Put in Vercel

After creating deployments, use the **deployment names** you created:

```
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-prod
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=embeddings-prod
```

**Use the exact names you gave when creating!**

---

## If You Don't See "Deploy" Button

### Try These:

1. **Click directly on the model name** (might open deployment page)
2. **Look for "Create" or "Add" button** near the model
3. **Check if you need to select a region first**
4. **Try "Go to AI Studio" or "AI Foundry"** link (if available)

---

## Alternative: Azure AI Studio

If you can't find deployments in Azure Portal:

1. Look for **"Go to AI Studio"** or **"Azure AI Studio"** link
2. Click it (opens in new tab/window)
3. In AI Studio, you should see **"Deployments"** in left menu
4. Create deployments there

---

## Quick Summary

1. ✅ You're in the right place (Model catalog)
2. ⏳ **Create deployments** from Model catalog
3. ⏳ **Name them** (e.g., `gpt-4o-prod`)
4. ⏳ **Wait for deployment** to complete
5. ✅ **Use those names** in Vercel

---

**Create deployments from Model catalog, then use those names in Vercel!** 🚀
