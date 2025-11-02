# ⚡ Quick AI Setup Guide

Get your AI features running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install openai ai @ai-sdk/openai
```

## Step 2: Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Click "API Keys" in the left sidebar
4. Click "Create new secret key"
5. Copy the key (it starts with `sk-`)

## Step 3: Configure Environment

Create `.env.local` in your project root:

```env
OPENAI_API_KEY="sk-your-actual-key-here"
OPENAI_MODEL="gpt-4o-mini"
```

**Note:** Use `gpt-4o-mini` to start (cheaper). Upgrade to `gpt-4o` for better quality.

## Step 4: Start the App

```bash
npm run dev
```

## Step 5: Test AI Features

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "AI Assistant" in the sidebar
3. Try asking: "Show me all projects"

## 🎉 That's it!

You now have access to all 12 AI features:

- ✅ AI Chat Assistant
- ✅ Project Charter Generator
- ✅ Risk Predictor
- ✅ Auto Status Reports
- ✅ Task Assignment AI
- ✅ Meeting Analyzer
- ✅ Budget Forecasting
- ✅ OKR Analysis
- ✅ Anomaly Detection
- ✅ Smart Notifications
- ✅ Semantic Search
- ✅ AI Insights

## 💰 Cost Information

**OpenAI Pricing (as of Jan 2024):**

- **GPT-4o-mini:** $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **GPT-4o:** $2.50 per 1M input tokens, $10 per 1M output tokens

**Typical usage costs:**
- Chat message: ~$0.001 - $0.01
- Charter generation: ~$0.05 - $0.10
- Risk analysis: ~$0.02 - $0.07

**Budget tip:** Start with $20 credit, monitor usage in OpenAI dashboard.

## 🔧 Troubleshooting

**Problem:** "API key invalid"
- Check your key starts with `sk-`
- Verify it's in `.env.local` (not `.env.template`)
- Restart your dev server

**Problem:** "No AI response"
- Check OpenAI dashboard for API status
- Verify you have credits in your account
- Check browser console for errors

**Problem:** "Slow responses"
- Switch to `gpt-4o-mini` in `.env.local`
- Responses should be 3-5x faster

## 📖 Next Steps

1. Read full guide: `AI_FEATURES_GUIDE.md`
2. Customize prompts: `lib/ai/prompts.ts`
3. Explore all tools: Navigate to `/ai-tools`

## 🚀 Pro Tips

1. **Save Money:** Use `gpt-4o-mini` for most tasks
2. **Best Quality:** Use `gpt-4o` for important charters and reports
3. **Try Everything:** All features work out of the box
4. **Customize:** Edit prompts in `lib/ai/prompts.ts` for your domain

---

**Need help?** Check `AI_FEATURES_GUIDE.md` for detailed documentation.

