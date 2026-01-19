# AWS Pricing Clarification

## Important: Base Costs vs Usage-Based Costs

### ❌ Not Fully Pay-Per-Use

**AWS Aurora Serverless v2 has a minimum capacity that runs 24/7**, even with zero users. This means you'll have **base costs** even when no one is using the app.

---

## Cost Breakdown

### 1. AWS Aurora Serverless v2 (Database)

**Minimum Capacity: 0.5 ACU (Aurora Capacity Unit)**
- **Runs 24/7** regardless of usage
- **Cost: ~$45/month** (0.5 ACU × $90/ACU/month)
- Scales up automatically when users connect/use the database
- Scales down to 0.5 ACU during low/no usage

**What this means:**
- ✅ You pay a **minimum of ~$45/month** even with 0 users
- ✅ Scales up automatically when users start using the app
- ✅ Scales down to minimum during idle periods
- ❌ **Not free when no users** (unlike some serverless services)

**Additional Costs:**
- Storage: $0.10/GB/month (first 100 GB free)
- I/O requests: $0.20 per million requests
- Data transfer: $0.09/GB out (first 1 GB free)

---

### 2. AWS S3 (File Storage)

**Truly Pay-Per-Use:**
- Storage: $0.023/GB/month (first 5 GB free)
- Requests: $0.005 per 1,000 PUT requests
- Data transfer: $0.09/GB out (first 1 GB free)

**What this means:**
- ✅ **Minimal cost** if no files are stored
- ✅ Only pay for what you use
- ✅ First 5 GB storage is free

**Estimated cost with 0 users: ~$0-1/month**

---

### 3. AWS Amplify (Hosting)

**Mixed Pricing:**
- Build minutes: $0.01/minute (first 1,000 minutes/month free)
- Hosting: Free for static sites, $0.15/GB for serverless functions
- Data transfer: $0.15/GB (first 5 GB free)

**What this means:**
- ✅ **Free tier available** (1,000 build minutes/month)
- ✅ Minimal cost if no traffic
- ⚠️ Costs increase with builds and traffic

**Estimated cost with 0 users: ~$0-10/month** (mostly free tier)

---

### 4. AWS RDS Proxy (Optional but Recommended)

**Base Cost:**
- $0.015 per vCPU-hour
- Minimum: ~$10-15/month

**What this means:**
- ⚠️ **Additional base cost** even with no users
- ✅ Improves connection pooling and performance
- ⚠️ Can be skipped initially to save costs

---

## Total Minimum Monthly Cost (With 0 Users)

| Service | Minimum Cost (0 Users) |
|---------|------------------------|
| Aurora Serverless v2 (0.5 ACU) | ~$45/month |
| S3 (no files) | ~$0/month |
| Amplify (free tier) | ~$0/month |
| RDS Proxy (optional) | ~$10-15/month |
| CloudWatch (basic) | ~$0-5/month |
| **TOTAL** | **~$45-65/month** |

---

## Cost Scaling with Users

### Example: 10 Active Users

| Service | Cost |
|---------|------|
| Aurora (scales to ~1 ACU) | ~$90/month |
| S3 (10 GB storage) | ~$0.23/month |
| Amplify (moderate traffic) | ~$5-20/month |
| RDS Proxy | ~$10-15/month |
| CloudWatch | ~$5-10/month |
| **TOTAL** | **~$110-135/month** |

### Example: 100 Active Users

| Service | Cost |
|---------|------|
| Aurora (scales to ~2 ACU) | ~$180/month |
| S3 (50 GB storage) | ~$1.15/month |
| Amplify (higher traffic) | ~$20-50/month |
| RDS Proxy | ~$10-15/month |
| CloudWatch | ~$10-20/month |
| **TOTAL** | **~$220-275/month** |

---

## Options to Reduce Initial Costs

### Option 1: Skip RDS Proxy Initially
- **Save: ~$10-15/month**
- **Trade-off**: Slightly worse connection pooling
- **Recommendation**: Add later when you have users

### Option 2: Use Aurora Serverless v1 (Not Recommended)
- **Minimum: 0 ACU** (truly pay-per-use)
- **Cost: ~$0/month with 0 users**
- **Trade-offs**:
  - ❌ Cold starts (5-30 seconds)
  - ❌ Less control over scaling
  - ❌ Limited to specific regions
  - ❌ Not recommended for production

### Option 3: Use RDS PostgreSQL (Fixed Size)
- **Minimum: db.t3.micro** (~$15/month)
- **Cost: ~$15/month with 0 users**
- **Trade-offs**:
  - ❌ No auto-scaling
  - ❌ Manual scaling required
  - ❌ Less efficient than Serverless v2

### Option 4: Start with Neon.tech (Temporary)
- **Free tier available** (500 MB database)
- **Cost: $0/month with 0 users**
- **Trade-off**: Not AWS, but can migrate later
- **Recommendation**: Use for initial testing, migrate to Aurora when you have paying customers

---

## Recommended Approach: Hybrid Strategy

### Phase 1: Pre-Launch (0-10 Users)
- **Use Neon.tech Free Tier** or **Aurora Serverless v2 (0.5 ACU)**
- **Cost: $0-45/month**
- **Goal**: Test and validate product

### Phase 2: Early Customers (10-50 Users)
- **Migrate to Aurora Serverless v2 (0.5-1 ACU)**
- **Add RDS Proxy**
- **Cost: ~$55-105/month**
- **Goal**: Scale with paying customers

### Phase 3: Growth (50+ Users)
- **Aurora Serverless v2 (1-4 ACU, auto-scaling)**
- **Full AWS stack**
- **Cost: ~$200-360/month**
- **Goal**: Enterprise-grade infrastructure

---

## Cost Optimization Tips

1. **Monitor ACU Usage**
   - Check CloudWatch metrics
   - Adjust Min/Max ACU based on actual usage
   - Scale down during low-traffic periods

2. **Optimize S3 Storage**
   - Delete unused files
   - Use S3 Lifecycle policies for old files
   - Compress files before upload

3. **Minimize Amplify Builds**
   - Use build caching
   - Only build on main branch
   - Optimize build times

4. **Use CloudWatch Efficiently**
   - Set log retention periods
   - Delete old logs
   - Use log groups efficiently

5. **Right-Size from Start**
   - Start with minimum capacity
   - Let auto-scaling handle growth
   - Monitor and adjust monthly

---

## Summary

### ❌ You Will Be Charged Even With 0 Users

**Minimum Monthly Cost: ~$45-65/month**
- Aurora Serverless v2 minimum: ~$45/month
- RDS Proxy (optional): ~$10-15/month
- Other services: ~$0-5/month

### ✅ Costs Scale with Usage

- **Aurora**: Scales up/down automatically (0.5-4 ACU)
- **S3**: Pay only for storage used
- **Amplify**: Pay for builds and traffic
- **All services**: Scale with actual usage

### 💡 Recommendation

1. **Start with Aurora Serverless v2 (0.5 ACU minimum)**
   - Accept ~$45/month base cost
   - Scales automatically with users
   - Enterprise-grade from day one

2. **Or use Neon.tech initially** (if you want $0 cost with 0 users)
   - Free tier available
   - Migrate to Aurora when you have paying customers
   - Saves ~$45/month during pre-launch

3. **Skip RDS Proxy initially**
   - Save ~$10-15/month
   - Add when you have active users

---

## Next Steps

1. **Decide on initial infrastructure:**
   - Option A: Aurora Serverless v2 (accept ~$45/month base cost)
   - Option B: Neon.tech free tier (migrate later)

2. **Set up cost monitoring:**
   - Enable AWS Cost Explorer
   - Set up billing alerts
   - Monitor CloudWatch metrics

3. **Plan migration strategy:**
   - If starting with Neon: Plan Aurora migration at 10-20 users
   - If starting with Aurora: Monitor and optimize from day one

---

**Bottom Line**: Aurora Serverless v2 has a **minimum cost of ~$45/month** even with 0 users, but it scales automatically and provides enterprise-grade infrastructure. If you want to minimize initial costs, consider starting with Neon.tech free tier and migrating to Aurora when you have paying customers.
