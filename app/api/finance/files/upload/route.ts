import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import * as XLSX from 'xlsx'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const uploadSchema = z.object({
  uploadType: z.enum(['BUDGET', 'COST', 'INVOICE', 'TIMESHEET', 'RATE_CARD', 'FORECAST']),
  budgetId: z.string().optional(), // Required for COST uploads
  mappingConfig: z.record(z.string()).optional(), // Column mapping
})

// POST /api/finance/files/upload - Upload and process Excel/CSV file
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = (session.user as any).role
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN', 'PROJECT_MANAGER']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadType = formData.get('uploadType') as string
    const budgetId = formData.get('budgetId') as string | null
    const mappingConfigStr = formData.get('mappingConfig') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate upload type
    const uploadTypeEnum = z.enum(['BUDGET', 'COST', 'INVOICE', 'TIMESHEET', 'RATE_CARD', 'FORECAST']).parse(uploadType)
    
    // Validate budgetId for cost uploads
    if (uploadTypeEnum === 'COST' && !budgetId) {
      return NextResponse.json({ error: 'budgetId is required for cost uploads' }, { status: 400 })
    }

    // Parse mapping config if provided
    let mappingConfig: Record<string, string> = {}
    if (mappingConfigStr) {
      try {
        mappingConfig = JSON.parse(mappingConfigStr)
      } catch {
        // Ignore parse errors, use auto-detection
      }
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are supported' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'finance')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}-${file.name}`
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // Create file record
    const financialFile = await prisma.financialFile.create({
      data: {
        tenantId: (session.user as any).tenantId,
        fileName: fileName,
        originalFileName: file.name,
        fileType: fileExtension || '',
        fileSize: file.size,
        filePath: filePath,
        uploadType: uploadTypeEnum,
        status: 'PROCESSING',
        mappingConfig: mappingConfig || undefined,
        createdById: (session.user as any).id,
      },
    })

    // Process file asynchronously (in production, use a job queue)
    processFileAsync(financialFile.id, filePath, uploadTypeEnum, budgetId, mappingConfig, (session.user as any).id)
      .catch((error) => {
        console.error('Error processing file:', error)
        // Update file status to failed
        prisma.financialFile.update({
          where: { id: financialFile.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        }).catch(console.error)
      })

    return NextResponse.json({
      file: {
        id: financialFile.id,
        fileName: financialFile.fileName,
        originalFileName: financialFile.originalFileName,
        uploadType: financialFile.uploadType,
        status: financialFile.status,
      },
      message: 'File uploaded successfully. Processing in background...',
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    )
  }
}

// Async file processing function
async function processFileAsync(
  fileId: string,
  filePath: string,
  uploadType: string,
  budgetId: string | null,
  mappingConfig: Record<string, string>,
  userId: string
) {
  try {
    // Read Excel/CSV file
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false })

    if (data.length === 0) {
      throw new Error('File is empty or has no data')
    }

    // Auto-detect column mapping if not provided
    const headers = Object.keys(data[0] as any)
    const detectedMapping = detectColumnMapping(headers, uploadType)

    // Use provided mapping or detected mapping
    const finalMapping = Object.keys(mappingConfig).length > 0 ? mappingConfig : detectedMapping

    // Validate required columns
    const requiredColumns = getRequiredColumns(uploadType)
    const missingColumns = requiredColumns.filter((col) => !Object.values(finalMapping).includes(col))
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`)
    }

    // Process rows
    const results = {
      success: [] as any[],
      errors: [] as any[],
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any
      try {
        const processedRow = processRow(row, finalMapping, uploadType, budgetId, userId)
        results.success.push(processedRow)
      } catch (error: any) {
        results.errors.push({
          row: i + 2, // +2 because Excel rows start at 1 and we skip header
          data: row,
          error: error.message,
        })
      }
    }

    // Update file record
    await prisma.financialFile.update({
      where: { id: fileId },
      data: {
        status: results.errors.length > 0 ? 'PARTIALLY_PROCESSED' : 'COMPLETED',
        recordCount: data.length,
        successCount: results.success.length,
        failureCount: results.errors.length,
        validationResults: {
          success: results.success,
          errors: results.errors,
        },
        processedAt: new Date(),
        processedBy: userId,
      },
    })

    return results
  } catch (error: any) {
    await prisma.financialFile.update({
      where: { id: fileId },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
        processedAt: new Date(),
        processedBy: userId,
      },
    })
    throw error
  }
}

// Auto-detect column mapping
function detectColumnMapping(headers: string[], uploadType: string): Record<string, string> {
  const mapping: Record<string, string> = {}
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim())

  // Common mappings
  const commonMappings: Record<string, string[]> = {
    name: ['name', 'description', 'item', 'title'],
    amount: ['amount', 'cost', 'price', 'value', 'total'],
    date: ['date', 'transaction date', 'posted date', 'invoice date'],
    category: ['category', 'type', 'class', 'group'],
  }

  for (const [key, variations] of Object.entries(commonMappings)) {
    const found = lowerHeaders.findIndex((h) => variations.some((v) => h.includes(v)))
    if (found !== -1) {
      mapping[headers[found]] = key
    }
  }

  // Type-specific mappings
  if (uploadType === 'COST') {
    const costMappings: Record<string, string[]> = {
      projectId: ['project', 'project id', 'project code'],
      taskId: ['task', 'task id'],
      costType: ['cost type', 'type', 'direct/indirect'],
    }

    for (const [key, variations] of Object.entries(costMappings)) {
      const found = lowerHeaders.findIndex((h) => variations.some((v) => h.includes(v)))
      if (found !== -1) {
        mapping[headers[found]] = key
      }
    }
  }

  return mapping
}

// Get required columns for upload type
function getRequiredColumns(uploadType: string): string[] {
  switch (uploadType) {
    case 'COST':
      return ['name', 'amount', 'date']
    case 'BUDGET':
      return ['name', 'totalAmount', 'startDate', 'endDate']
    case 'INVOICE':
      return ['invoiceNumber', 'clientName', 'totalAmount', 'invoiceDate']
    default:
      return ['name', 'amount']
  }
}

// Process a single row
async function processRow(
  row: any,
  mapping: Record<string, string>,
  uploadType: string,
  budgetId: string | null,
  userId: string
) {
  const mappedData: any = {}

  // Map columns
  for (const [excelColumn, systemField] of Object.entries(mapping)) {
    if (row[excelColumn] !== undefined) {
      mappedData[systemField] = row[excelColumn]
    }
  }

  // Process based on upload type
  switch (uploadType) {
    case 'COST':
      if (!budgetId) {
        throw new Error('budgetId is required for cost uploads')
      }

      // Validate required fields
      if (!mappedData.name || !mappedData.amount || !mappedData.date) {
        throw new Error('Missing required fields: name, amount, or date')
      }

      // Create cost entry
      const cost = await prisma.costActual.create({
        data: {
          budgetId: budgetId,
          name: String(mappedData.name),
          description: mappedData.description ? String(mappedData.description) : undefined,
          amount: parseFloat(String(mappedData.amount).replace(/[^0-9.-]/g, '')),
          currency: mappedData.currency || 'USD',
          costType: (mappedData.costType as any) || 'DIRECT',
          source: 'FILE_UPLOAD',
          date: new Date(mappedData.date),
          projectId: mappedData.projectId || undefined,
          taskId: mappedData.taskId || undefined,
          costCenter: mappedData.costCenter || undefined,
          createdById: userId,
          // Auto-approve if amount < threshold
          approvedBy: parseFloat(String(mappedData.amount)) < 1000 ? userId : null,
          approvedAt: parseFloat(String(mappedData.amount)) < 1000 ? new Date() : null,
        },
      })

      // Update budget category if provided
      if (mappedData.categoryId) {
        await prisma.budgetCategory.update({
          where: { id: mappedData.categoryId },
          data: {
            spentAmount: {
              increment: parseFloat(String(mappedData.amount)),
            },
          },
        })
      }

      return { type: 'cost', id: cost.id, data: mappedData }

    case 'BUDGET':
      // Budget upload logic (similar pattern)
      // Implementation depends on your budget structure
      return { type: 'budget', data: mappedData }

    default:
      return { type: uploadType.toLowerCase(), data: mappedData }
  }
}

