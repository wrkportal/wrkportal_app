import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { WorkflowType, MethodologyType } from '@/types/index'
import { TaskStatus, Priority } from '@prisma/client'
import { getTaskTemplates } from '@/lib/workflows/task-templates'

// GET - Get task templates for a workflow and methodology
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const workflowType = searchParams.get('workflowType') as WorkflowType | null
    const methodologyType = searchParams.get('methodologyType') as MethodologyType | null

    // If workflowType is provided, use library templates
    // Otherwise, fetch from database
    if (workflowType) {
      const templates = getTaskTemplates(workflowType, methodologyType || undefined)
      return NextResponse.json({ templates })
    }

    // Fetch from database (for custom templates)
    const templates = await prisma.taskTemplate.findMany({
      where: {
        workflowType: workflowType || undefined,
        methodologyType: methodologyType || undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching task templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create custom task template
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create custom templates
    const isAdmin = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN', 'PMO_LEAD'].includes(session.user.role)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const createTemplateSchema = z.object({
      workflowType: z.nativeEnum(WorkflowType),
      methodologyType: z.nativeEnum(MethodologyType).optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.string().optional(),
      fields: z.any(), // JSON schema for fields
      defaultStatus: z.nativeEnum(TaskStatus).optional(),
      defaultPriority: z.nativeEnum(Priority).optional(),
      workflowFields: z.any().optional(),
    })

    const validatedData = createTemplateSchema.parse(body)

    const template = await prisma.taskTemplate.create({
      data: {
        workflowType: validatedData.workflowType,
        methodologyType: validatedData.methodologyType || null,
        name: validatedData.name,
        description: validatedData.description || null,
        category: validatedData.category || null,
        fields: validatedData.fields,
        defaultStatus: validatedData.defaultStatus || null,
        defaultPriority: validatedData.defaultPriority || null,
        workflowFields: validatedData.workflowFields || null,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating task template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

