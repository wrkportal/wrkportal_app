import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const emailTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  type: z.enum([
    'APPLICATION_RECEIVED',
    'SCREENING_INVITE',
    'INTERVIEW_INVITE',
    'OFFER_LETTER',
    'REJECTION',
    'ONBOARDING_WELCOME',
    'CUSTOM',
  ]),
  variables: z.array(z.string()).optional(),
  isDefault: z.boolean().default(false),
})

// GET /api/recruitment/email-templates - Get all email templates
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    // For now, return default templates
    // In a full implementation, these would be stored in a database
    const defaultTemplates = [
      {
        id: 'application-received',
        name: 'Application Received',
        subject: 'Thank You for Your Application - {{companyName}}',
        body: `Dear {{candidateName}},

Thank you for your interest in the {{positionName}} position at {{companyName}}. We have received your application and our team will review it shortly.

We appreciate your time and interest in joining our team. We will be in touch within the next few business days.

Best regards,
{{recruiterName}}
{{companyName}}`,
        type: 'APPLICATION_RECEIVED',
        variables: ['candidateName', 'companyName', 'positionName', 'recruiterName'],
        isDefault: true,
      },
      {
        id: 'screening-invite',
        name: 'Screening Invite',
        subject: 'Next Steps: Screening Call - {{companyName}}',
        body: `Dear {{candidateName}},

Thank you for your application for the {{positionName}} position. We were impressed with your background and would like to schedule a brief screening call.

Please let us know your availability for a 30-minute call. We're flexible and can work around your schedule.

Best regards,
{{recruiterName}}
{{companyName}}`,
        type: 'SCREENING_INVITE',
        variables: ['candidateName', 'companyName', 'positionName', 'recruiterName'],
        isDefault: true,
      },
      {
        id: 'interview-invite',
        name: 'Interview Invite',
        subject: 'Interview Invitation - {{positionName}} at {{companyName}}',
        body: `Dear {{candidateName}},

We are pleased to invite you for an interview for the {{positionName}} position.

Interview Details:
- Date: {{interviewDate}}
- Time: {{interviewTime}}
- Type: {{interviewType}}
{{#if interviewLocation}}
- Location: {{interviewLocation}}
{{/if}}
{{#if interviewLink}}
- Video Link: {{interviewLink}}
{{/if}}

Interviewer: {{interviewerName}}

Please confirm your availability or let us know if you need to reschedule.

Best regards,
{{recruiterName}}
{{companyName}}`,
        type: 'INTERVIEW_INVITE',
        variables: [
          'candidateName',
          'companyName',
          'positionName',
          'interviewDate',
          'interviewTime',
          'interviewType',
          'interviewLocation',
          'interviewLink',
          'interviewerName',
          'recruiterName',
        ],
        isDefault: true,
      },
      {
        id: 'offer-letter',
        name: 'Offer Letter',
        subject: 'Job Offer - {{positionName}} at {{companyName}}',
        body: `Dear {{candidateName}},

We are delighted to extend an offer for the {{positionName}} position at {{companyName}}.

Offer Details:
- Position: {{positionName}}
- Start Date: {{startDate}}
- Salary: {{salary}}
{{#if benefits}}
- Benefits: {{benefits}}
{{/if}}

We are excited about the possibility of you joining our team. Please review the attached offer letter and let us know if you have any questions.

We look forward to hearing from you.

Best regards,
{{recruiterName}}
{{companyName}}`,
        type: 'OFFER_LETTER',
        variables: [
          'candidateName',
          'companyName',
          'positionName',
          'startDate',
          'salary',
          'benefits',
          'recruiterName',
        ],
        isDefault: true,
      },
      {
        id: 'rejection',
        name: 'Rejection Letter',
        subject: 'Update on Your Application - {{companyName}}',
        body: `Dear {{candidateName}},

Thank you for your interest in the {{positionName}} position at {{companyName}} and for taking the time to interview with us.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.

We appreciate your interest in {{companyName}} and wish you the best in your job search.

Best regards,
{{recruiterName}}
{{companyName}}`,
        type: 'REJECTION',
        variables: ['candidateName', 'companyName', 'positionName', 'recruiterName'],
        isDefault: true,
      },
      {
        id: 'onboarding-welcome',
        name: 'Onboarding Welcome',
        subject: 'Welcome to {{companyName}}!',
        body: `Dear {{candidateName}},

Welcome to {{companyName}}! We are thrilled to have you join our team as {{positionName}}.

Your first day will be on {{startDate}}. Here's what to expect:
- Arrival time: {{arrivalTime}}
- Location: {{officeLocation}}
- Contact: {{contactPerson}}

Please review the attached onboarding materials and don't hesitate to reach out if you have any questions.

We're excited to have you on board!

Best regards,
{{recruiterName}}
{{companyName}}`,
        type: 'ONBOARDING_WELCOME',
        variables: [
          'candidateName',
          'companyName',
          'positionName',
          'startDate',
          'arrivalTime',
          'officeLocation',
          'contactPerson',
          'recruiterName',
        ],
        isDefault: true,
      },
    ]

    // Filter by type if provided
    let templates = defaultTemplates
    if (type) {
      templates = defaultTemplates.filter((t) => t.type === type)
    }

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email templates', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/recruitment/email-templates - Create a new email template
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const body = await request.json()
    const validatedData = emailTemplateSchema.parse(body)

    // In a full implementation, save to database
    // For now, return the created template
    const template = {
      id: `template-${Date.now()}`,
      ...validatedData,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating email template:', error)
    return NextResponse.json(
      { error: 'Failed to create email template', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/recruitment/email-templates/[id]/send - Send email using template
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const sendSchema = z.object({
      templateId: z.string(),
      candidateId: z.string(),
      variables: z.record(z.string()),
    })

    const validatedData = sendSchema.parse(body)

    // Get template
    const defaultTemplates = [
      {
        id: 'application-received',
        name: 'Application Received',
        subject: 'Thank You for Your Application - {{companyName}}',
        body: `Dear {{candidateName}}, ...`,
        type: 'APPLICATION_RECEIVED',
      },
      // ... other templates
    ]

    const template = defaultTemplates.find((t) => t.id === validatedData.templateId)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Get candidate
    const tenantId = (session.user as any).tenantId
    const candidate = await prisma.user.findFirst({
      where: {
        id: validatedData.candidateId,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Replace variables in template
    let subject = template.subject
    let body = template.body
    const allVariables = {
      candidateName: `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.email,
      candidateEmail: candidate.email,
      ...validatedData.variables,
    }

    Object.entries(allVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, String(value))
      body = body.replace(regex, String(value))
    })

    // TODO: Actually send email using email service
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      email: {
        to: candidate.email,
        subject,
        body,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    )
  }
}

