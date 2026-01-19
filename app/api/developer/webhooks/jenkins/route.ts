import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * Jenkins Webhook Handler
 * Receives CI/CD events from Jenkins and processes them
 * 
 * Webhook URL: POST /api/developer/webhooks/jenkins
 * Configure in Jenkins: Manage Jenkins → Configure System → GitHub plugin
 * Or use Generic Webhook Trigger plugin
 */

interface JenkinsWebhookPayload {
  build?: {
    number: number
    phase: 'STARTED' | 'COMPLETED' | 'FINISHED'
    status: 'SUCCESS' | 'FAILURE' | 'ABORTED' | 'UNSTABLE'
    url: string
    full_url: string
    scm?: {
      commit: string
      branch: string[]
    }
    parameters?: Record<string, string>
    timestamp: number
    duration?: number
  }
  name?: string
  url?: string
  displayName?: string
  fullName?: string
  duration?: number
  timestamp?: number
  result?: 'SUCCESS' | 'FAILURE' | 'ABORTED' | 'UNSTABLE'
  executor?: {
    number: number
    currentExecutable: {
      number: number
      url: string
    }
  }
}

// Verify Jenkins webhook (if using token-based authentication)
function verifyJenkinsWebhook(
  token: string | null,
  expectedToken: string
): boolean {
  if (!token) return false
  return token === expectedToken
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.text()
    const token = req.headers.get('x-jenkins-token') || req.headers.get('authorization')?.replace('Bearer ', '')
    
    // Verify webhook token (optional but recommended)
    const webhookToken = process.env.JENKINS_WEBHOOK_TOKEN || ''
    if (webhookToken && !verifyJenkinsWebhook(token, webhookToken)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    let payload: JenkinsWebhookPayload
    try {
      payload = JSON.parse(body)
    } catch {
      // Jenkins may send plain text or form data
      payload = body ? { name: body } : {}
    }

    // Process build events
    if (payload.build) {
      const build = payload.build
      const jobName = payload.name || payload.fullName || 'Unknown Job'

      // Map Jenkins status to our status format
      let status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | 'CANCELLED' = 'IN_PROGRESS'
      if (build.phase === 'COMPLETED' || build.phase === 'FINISHED') {
        if (build.status === 'SUCCESS') {
          status = 'SUCCESS'
        } else if (build.status === 'FAILURE' || build.status === 'UNSTABLE') {
          status = 'FAILED'
        } else if (build.status === 'ABORTED') {
          status = 'CANCELLED'
        }
      } else if (build.phase === 'STARTED') {
        status = 'IN_PROGRESS'
      }

      // Extract commit and branch info
      const commitSha = build.scm?.commit || ''
      const branch = build.scm?.branch?.[0] || ''

      // Create timeline event for pipeline execution
      console.log('[Jenkins Webhook] Pipeline Event:', {
        pipelineId: `jenkins-${jobName}-${build.number}`,
        status,
        jobName,
        branch,
        commitSha,
        buildNumber: build.number,
        duration: build.duration,
        url: build.full_url || build.url,
        timestamp: build.timestamp,
      })

      // TODO: Store pipeline execution in database
      // await prisma.pipelineExecution.create({
      //   data: {
      //     id: `jenkins-${jobName}-${build.number}`,
      //     tenantId: session.user.tenantId,
      //     provider: 'jenkins',
      //     status,
      //     workflowName: jobName,
      //     repository: payload.url || '',
      //     branch,
      //     commitSha,
      //     runNumber: build.number,
      //     startedAt: new Date(build.timestamp),
      //     completedAt: build.duration ? new Date(build.timestamp + build.duration) : null,
      //     duration: build.duration,
      //   }
      // })

      return NextResponse.json({ 
        success: true, 
        message: 'Webhook processed',
        pipelineId: `jenkins-${jobName}-${build.number}`
      })
    }

    // Process generic job events
    if (payload.name || payload.fullName) {
      const jobName = payload.name || payload.fullName || 'Unknown Job'
      
      console.log('[Jenkins Webhook] Job Event:', {
        jobName,
        result: payload.result,
        duration: payload.duration,
        timestamp: payload.timestamp,
      })

      return NextResponse.json({ success: true, message: 'Job event processed' })
    }

    return NextResponse.json({ success: true, message: 'Webhook received (not processed)' })
  } catch (error) {
    console.error('Error processing Jenkins webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// GET - Webhook verification/info
export async function GET() {
  return NextResponse.json({ 
    message: 'Jenkins webhook endpoint',
    instructions: 'Configure this URL in Jenkins webhook settings (Generic Webhook Trigger plugin)'
  })
}
