import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * GitHub Actions Webhook Handler
 * Receives CI/CD events from GitHub Actions and processes them
 * 
 * Webhook URL: POST /api/developer/webhooks/github
 * Configure in GitHub: Settings → Webhooks → Add webhook
 */

interface GitHubWebhookPayload {
  action?: string
  workflow_run?: {
    id: number
    name: string
    status: 'queued' | 'in_progress' | 'completed' | 'cancelled'
    conclusion: 'success' | 'failure' | 'cancelled' | 'neutral' | null
    created_at: string
    updated_at: string
    head_branch: string
    head_sha: string
    run_number: number
    workflow_id: number
    repository: {
      id: number
      name: string
      full_name: string
      html_url: string
    }
  }
  repository?: {
    id: number
    name: string
    full_name: string
    html_url: string
  }
  pusher?: {
    name: string
    email: string
  }
  commits?: Array<{
    id: string
    message: string
    author: {
      name: string
      email: string
    }
    timestamp: string
  }>
}

// Verify GitHub webhook signature
function verifyGitHubSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false
  
  const hmac = crypto.createHmac('sha256', secret)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.text()
    const signature = req.headers.get('x-hub-signature-256')
    const event = req.headers.get('x-github-event')
    
    // Verify webhook signature (use your GitHub webhook secret)
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || ''
    if (webhookSecret && !verifyGitHubSignature(body, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload: GitHubWebhookPayload = JSON.parse(body)

    // Process workflow_run events (CI/CD pipeline executions)
    if (event === 'workflow_run' && payload.workflow_run) {
      const workflowRun = payload.workflow_run
      const repository = payload.repository || payload.workflow_run.repository

      // Map GitHub status to our status format
      let status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | 'CANCELLED' = 'IN_PROGRESS'
      if (workflowRun.status === 'completed') {
        status = workflowRun.conclusion === 'success' ? 'SUCCESS' : 'FAILED'
      } else if (workflowRun.status === 'cancelled') {
        status = 'CANCELLED'
      }

      // Create timeline event for pipeline execution
      // TODO: Store in database - create TimelineEvent model if needed
      // For now, log the event
      console.log('[GitHub Webhook] Pipeline Event:', {
        pipelineId: `github-${workflowRun.id}`,
        status,
        workflowName: workflowRun.name,
        repository: repository?.full_name,
        branch: workflowRun.head_branch,
        commitSha: workflowRun.head_sha,
        runNumber: workflowRun.run_number,
        createdAt: workflowRun.created_at,
        updatedAt: workflowRun.updated_at,
      })

      // TODO: Store pipeline execution in database
      // await prisma.pipelineExecution.create({
      //   data: {
      //     id: `github-${workflowRun.id}`,
      //     tenantId: session.user.tenantId,
      //     provider: 'github',
      //     status,
      //     workflowName: workflowRun.name,
      //     repository: repository?.full_name || '',
      //     branch: workflowRun.head_branch,
      //     commitSha: workflowRun.head_sha,
      //     runNumber: workflowRun.run_number,
      //     startedAt: new Date(workflowRun.created_at),
      //     completedAt: workflowRun.status === 'completed' ? new Date(workflowRun.updated_at) : null,
      //   }
      // })

      return NextResponse.json({ 
        success: true, 
        message: 'Webhook processed',
        pipelineId: `github-${workflowRun.id}`
      })
    }

    // Process push events (code changes)
    if (event === 'push' && payload.commits) {
      const repository = payload.repository
      
      // Create timeline events for code changes
      for (const commit of payload.commits) {
        console.log('[GitHub Webhook] Code Change Event:', {
          commitHash: commit.id,
          message: commit.message,
          author: commit.author.name,
          repository: repository?.full_name,
          timestamp: commit.timestamp,
        })

        // TODO: Store code change in timeline
      }

      return NextResponse.json({ success: true, message: 'Push event processed' })
    }

    return NextResponse.json({ success: true, message: 'Webhook received (not processed)' })
  } catch (error) {
    console.error('Error processing GitHub webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// GET - Webhook verification (GitHub sends GET request to verify webhook)
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'GitHub webhook endpoint',
    instructions: 'Configure this URL in GitHub repository webhooks settings'
  })
}
