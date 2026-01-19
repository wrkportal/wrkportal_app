
# AWS Aurora Serverless v2 Setup Guide

## Overview

This guide walks you through setting up AWS Aurora Serverless v2 for Business and Enterprise tier users. Aurora Serverless v2 provides automatic scaling, high availability, and enterprise-grade security.

**Estimated Time**: 4-5 days  
**Cost**: $1,621/year ($135/month for 475 users)  
**Security**: ✅ HIPAA, FedRAMP available

---

## Prerequisites

- AWS account with appropriate permissions
- AWS CLI installed and configured
- Terraform (optional, for infrastructure as code)
- Database access credentials

---

## Step 1: Create Aurora Serverless v2 Cluster

### Option A: AWS Console

1. **Navigate to RDS Console**
   - Go to AWS Console → RDS → Databases
   - Click "Create database"

2. **Choose Engine**
   - Engine type: **PostgreSQL**
   - Version: **15.4 or later** (recommended for Prisma compatibility)
   - Templates: **Production** (for multi-AZ)

3. **Settings**
   - DB cluster identifier: `wrkportal-business-prod`
   - Master username: `wrkportal_admin` (or your preference)
   - Master password: Generate strong password (save securely)
   - Enable "Manage master credentials in AWS Secrets Manager" (recommended)

4. **Instance Configuration**
   - **Serverless v2**: Select this option
   - **Min ACU (Aurora Capacity Unit)**: `0.5` (minimum for Business tier)
   - **Max ACU**: `4` (adjust based on expected load)
   - ACU = ~2 GB RAM + compute capacity

5. **Storage**
   - Storage type: **Aurora** (automatic scaling)
   - Storage autoscaling: **Enabled**
   - Maximum storage threshold: `1000` GB (250 GB per user × 475 users)

6. **Connectivity**
   - VPC: Choose your application VPC
   - Subnet group: Create or select multi-AZ subnet group
   - **Public access**: **No** (for security)
   - VPC security group: Create new or select existing
   - Availability Zone: **Multi-AZ** (for high availability)
   - Database port: `5432` (PostgreSQL default)

7. **Database Authentication**
   - Database authentication: **Password authentication**
   - Initial database name: `wrkportal` (or your preference)

8. **Backup**
   - Automated backups: **Enabled**
   - Backup retention period: `7` days (minimum, increase for compliance)
   - Backup window: Choose low-traffic window
   - Enable encryption: **Yes**
   - Encryption key: Use AWS managed key or KMS customer key

9. **Monitoring**
   - Enable Enhanced monitoring: **Yes**
   - Granularity: `60` seconds
   - Enable Performance Insights: **Yes** (recommended)
   - Retention period: `7` days (or as needed)

10. **Maintenance**
    - Enable auto minor version upgrade: **Yes**
    - Maintenance window: Choose low-traffic window

11. **Create Database**
    - Review settings
    - Click "Create database"
    - Wait 10-15 minutes for cluster creation

### Option B: AWS CLI

```bash
# Create DB subnet group (if not exists)
aws rds create-db-subnet-group \
  --db-subnet-group-name wrkportal-subnet-group \
  --db-subnet-group-description "Subnet group for WorkPortal Aurora" \
  --subnet-ids subnet-xxxxx subnet-yyyyy \
  --tags Key=Name,Value=wrkportal-subnet-group

# Create Aurora Serverless v2 cluster
aws rds create-db-cluster \
  --db-cluster-identifier wrkportal-business-prod \
  --engine aurora-postgresql \
  --engine-version 15.4 \
  --master-username wrkportal_admin \
  --manage-master-user-password \
  --serverless-v2-scaling-configuration \
    MinCapacity=0.5,MaxCapacity=4 \
  --database-name wrkportal \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --storage-encrypted \
  --kms-key-id alias/aws/rds \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name wrkportal-subnet-group \
  --enable-cloudwatch-logs-exports postgresql \
  --tags Key=Environment,Value=Production Key=Tier,Value=Business
```

---

## Step 2: Set Up RDS Proxy (Recommended)

RDS Proxy improves connection pooling and failover handling.

1. **Create RDS Proxy**
   - Go to RDS Console → Proxies → Create proxy
   - Proxy identifier: `wrkportal-proxy`
   - Target RDS DB instances: Select your Aurora cluster
   - Secrets Manager: Select your database secret

2. **Network Configuration**
   - VPC: Same as Aurora cluster
   - Subnets: Select multiple subnets (multi-AZ)
   - VPC security group: Create new or select existing

3. **Connection Settings**
   - Session pinning: **Disable** (for better connection pooling)
   - Connection pool maximum connections: `100` (adjust based on load)

4. **Authentication**
   - IAM authentication: **Disable** (unless using IAM roles)
   - Secrets Manager: Use existing secret or create new

5. **Tags**: Add tags (Environment, Tier, etc.)

6. **Create Proxy** and wait for creation (5-10 minutes)

7. **Get Proxy Endpoint**
   - Note the proxy endpoint: `wrkportal-proxy.proxy-xxxxx.us-east-1.rds.amazonaws.com`
   - Use this endpoint instead of cluster endpoint in connection string

---

## Step 3: Configure Connection String

### Get Connection Details

1. **Cluster Endpoint** (or use RDS Proxy endpoint)
   - Go to RDS Console → Databases → Your cluster
   - Copy "Endpoint" (writer endpoint)

2. **Master Credentials**
   - If using Secrets Manager: Retrieve secret from Secrets Manager
   - Otherwise: Use credentials you set during creation

### Connection String Format

```
DATABASE_URL_AURORA="postgresql://username:password@endpoint:5432/database?sslmode=require"
```

**With RDS Proxy**:
```
DATABASE_URL_AURORA="postgresql://username:password@proxy-endpoint:5432/database?sslmode=require"
```

### Environment Variables

Add to your `.env` or environment configuration:

```bash
# AWS Aurora Serverless v2 (Business/Enterprise tier)
DATABASE_URL_AURORA="postgresql://wrkportal_admin:password@wrkportal-business-prod.cluster-xxxxx.us-east-1.rds.amazonaws.com:5432/wrkportal?sslmode=require"

# Or with RDS Proxy
DATABASE_URL_AURORA="postgresql://wrkportal_admin:password@wrkportal-proxy.proxy-xxxxx.us-east-1.rds.amazonaws.com:5432/wrkportal?sslmode=require"
```

---

## Step 4: Run Prisma Migrations

### Test Connection

```bash
# Test connection to Aurora
psql "$DATABASE_URL_AURORA"
# Or
npx prisma db pull
```

### Run Migrations

```bash
# Set DATABASE_URL to Aurora temporarily
export DATABASE_URL="$DATABASE_URL_AURORA"

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Or for development
npx prisma migrate dev --name init_aurora
```

### Verify Schema

```bash
# Open Prisma Studio to verify
npx prisma studio
```

---

## Step 5: Configure Security Groups

### Inbound Rules

Allow connections from your application:

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| PostgreSQL | TCP | 5432 | Your application security group |
| PostgreSQL | TCP | 5432 | Your VPC CIDR (for internal access) |

### Outbound Rules

Default (all traffic allowed to VPC)

### Example: AWS CLI

```bash
# Get your application security group ID
APP_SG_ID="sg-xxxxx"

# Allow PostgreSQL from application
aws ec2 authorize-security-group-ingress \
  --group-id sg-aurora-cluster \
  --protocol tcp \
  --port 5432 \
  --source-group $APP_SG_ID
```

---

## Step 6: Set Up Multi-AZ Failover

Aurora Serverless v2 automatically handles multi-AZ failover, but verify:

1. **Check Availability Zones**
   - Go to RDS Console → Your cluster → Connectivity & security
   - Verify multiple AZs are configured

2. **Test Failover** (Optional, during maintenance window)
   - Go to RDS Console → Your cluster → Actions → Failover
   - Monitor failover time (typically 30-60 seconds)

---

## Step 7: Enable Monitoring

### CloudWatch Logs

Already enabled if you selected during creation. Check:

1. Go to RDS Console → Your cluster → Logs & events
2. Verify logs are being written to CloudWatch

### Performance Insights

Already enabled if you selected during creation. View:

1. Go to RDS Console → Your cluster → Monitoring → Performance Insights
2. Monitor database performance metrics

### CloudWatch Alarms (Recommended)

Set up alarms for:
- CPU utilization > 80%
- Database connections > 80% of max
- Freeable memory < 1 GB
- Replica lag > 5 seconds (if using read replicas)

Example:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name aurora-cpu-high \
  --alarm-description "Aurora CPU utilization high" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBClusterIdentifier,Value=wrkportal-business-prod \
  --evaluation-periods 2
```

---

## Step 8: Migrate Business/Enterprise Users

### Option A: Database Migration Script

```typescript
// scripts/migrate-to-aurora.ts
import { PrismaClient } from '@prisma/client'

const sourcePrisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_NEON }, // Source: Neon
  },
})

const targetPrisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_AURORA }, // Target: Aurora
  },
})

async function migrateBusinessUsers() {
  try {
    // Get Business/Enterprise tenants
    const businessTenants = await sourcePrisma.tenant.findMany({
      where: {
        plan: {
          in: ['BUSINESS', 'ENTERPRISE'],
        },
      },
      include: {
        users: true,
        projects: true,
        // ... other related data
      },
    })

    console.log(`Found ${businessTenants.length} Business/Enterprise tenants`)

    // Migrate each tenant
    for (const tenant of businessTenants) {
      console.log(`Migrating tenant: ${tenant.id}`)
      
      // Migrate tenant
      await targetPrisma.tenant.create({
        data: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          // ... other fields
          users: {
            create: tenant.users.map(user => ({
              id: user.id,
              // ... user fields
            })),
          },
          projects: {
            create: tenant.projects.map(project => ({
              id: project.id,
              // ... project fields
            })),
          },
          // ... other related data
        },
      })

      console.log(`✓ Migrated tenant: ${tenant.id}`)
    }

    console.log('Migration complete!')
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  } finally {
    await sourcePrisma.$disconnect()
    await targetPrisma.$disconnect()
  }
}

migrateBusinessUsers()
```

### Option B: Use Prisma Migrate

If both databases share the same schema:

```bash
# Migrate data using pg_dump/pg_restore
pg_dump "$DATABASE_URL_NEON" --schema-only > schema.sql
pg_restore "$DATABASE_URL_AURORA" < schema.sql

# Migrate data (tenant-specific)
pg_dump "$DATABASE_URL_NEON" --data-only --table=Tenant \
  --where="plan IN ('BUSINESS', 'ENTERPRISE')" > business_tenants.sql
pg_restore "$DATABASE_URL_AURORA" < business_tenants.sql
```

---

## Step 9: Update Infrastructure Routing

The code already supports tier-based routing. Update environment variables:

```bash
# .env or AWS Secrets Manager / Parameter Store
DATABASE_URL_AURORA="postgresql://..."
```

The application will automatically route Business/Enterprise users to Aurora via `lib/infrastructure/routing.ts`.

---

## Step 10: Test and Verify

### Connection Test

```bash
# Test Aurora connection
psql "$DATABASE_URL_AURORA" -c "SELECT version();"
```

### Performance Test

```bash
# Run performance test
npx prisma studio --browser none &
# Navigate to http://localhost:5555 and test queries
```

### Load Test

Use a load testing tool (e.g., Apache Bench, k6) to test Aurora under load.

---

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to Aurora  
**Solution**: 
- Check security group rules (allow port 5432 from application)
- Verify VPC configuration
- Check RDS Proxy endpoint (if using proxy)

### Performance Issues

**Problem**: Slow queries  
**Solution**:
- Check Performance Insights
- Verify ACU scaling (increase Max ACU if needed)
- Optimize queries
- Use read replicas for read-heavy workloads

### Migration Issues

**Problem**: Data migration fails  
**Solution**:
- Verify schema compatibility
- Check foreign key constraints
- Migrate in smaller batches
- Use transaction rollback on errors

---

## Cost Optimization

### Monitor ACU Usage

- Check CloudWatch metrics for ACU utilization
- Adjust Min/Max ACU based on actual usage
- Use auto-scaling to reduce costs during low-traffic periods

### Backup Retention

- Adjust backup retention period based on compliance needs
- Use snapshot exports for long-term archival
- Delete old snapshots if not needed

---

## Security Best Practices

1. **Encryption**: Always enable encryption at rest and in transit
2. **Secrets Management**: Use AWS Secrets Manager for credentials
3. **Network Isolation**: Use VPC and security groups
4. **Access Control**: Use IAM roles and least privilege
5. **Audit Logging**: Enable CloudWatch Logs and Performance Insights
6. **Backup**: Regular backups with point-in-time recovery
7. **Compliance**: Enable HIPAA/FedRAMP features if required

---

## Next Steps

1. ✅ Complete Aurora setup
2. ⏳ Test connection and migrations
3. ⏳ Migrate Business/Enterprise users
4. ⏳ Update application configuration
5. ⏳ Monitor performance and costs
6. ⏳ Set up alerts and monitoring

---

**Aurora Serverless v2 setup is complete!** 🎉

Your Business and Enterprise tier users now have access to enterprise-grade database infrastructure with automatic scaling, high availability, and premium security features.
