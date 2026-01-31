import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const budgetId = formData.get('budgetId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!['.csv', '.xlsx', '.xls'].includes(fileExt)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV and Excel files are allowed.' },
        { status: 400 }
      )
    }

    // Read file content
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse file
    let rows: any[] = []
    if (fileExt === '.csv') {
      const content = buffer.toString('utf-8')
      rows = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } else {
      // Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json(firstSheet)
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'File is empty or has no data' },
        { status: 400 }
      )
    }

    // Build hierarchical category structure
    const categoryMap = new Map<string, {
      name: string
      code?: string
      allocatedAmount: number
      subCategories: Map<string, {
        name: string
        code?: string
        allocatedAmount: number
        subSubCategories: Map<string, {
          name: string
          code?: string
          allocatedAmount: number
        }>
      }>
    }>()

    // Process rows and build hierarchy
    for (const row of rows) {
      // Normalize column names (case-insensitive, handle spaces/dashes)
      const categoryName = (row.Category || row.category || row['Category'] || '').toString().trim()
      const subCategoryName = (row['Sub-Category'] || row['Sub Category'] || row.subCategory || row['sub-category'] || '').toString().trim()
      const subSubCategoryName = (row['Sub-Sub-Category'] || row['Sub Sub Category'] || row.subSubCategory || row['sub-sub-category'] || '').toString().trim()
      const amount = parseFloat((row.Amount || row.amount || row['Amount'] || 0).toString().replace(/[^0-9.-]/g, ''))

      if (!categoryName || isNaN(amount) || amount <= 0) continue

      // Get or create category
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          allocatedAmount: 0,
          subCategories: new Map(),
        })
      }
      const category = categoryMap.get(categoryName)!

      // If there's a sub-category
      if (subCategoryName) {
        if (!category.subCategories.has(subCategoryName)) {
          category.subCategories.set(subCategoryName, {
            name: subCategoryName,
            allocatedAmount: 0,
            subSubCategories: new Map(),
          })
        }
        const subCategory = category.subCategories.get(subCategoryName)!

        // If there's a sub-sub-category
        if (subSubCategoryName) {
          if (!subCategory.subSubCategories.has(subSubCategoryName)) {
            subCategory.subSubCategories.set(subSubCategoryName, {
              name: subSubCategoryName,
              allocatedAmount: 0,
            })
          }
          const subSubCategory = subCategory.subSubCategories.get(subSubCategoryName)!
          subSubCategory.allocatedAmount += amount
        } else {
          subCategory.allocatedAmount += amount
        }
      } else {
        category.allocatedAmount += amount
      }
    }

    // Calculate totals and percentages
    const totalAmount = Array.from(categoryMap.values()).reduce((sum, cat) => {
      const catTotal = cat.allocatedAmount + Array.from(cat.subCategories.values()).reduce((subSum, sub) => {
        const subTotal = sub.allocatedAmount + Array.from(sub.subSubCategories.values()).reduce((subSubSum, subSub) => {
          return subSubSum + subSub.allocatedAmount
        }, 0)
        return subSum + subTotal
      }, 0)
      return sum + catTotal
    }, 0)

    // Convert to database format
    const categories = Array.from(categoryMap.entries()).map(([catName, cat]) => {
      const catTotal = cat.allocatedAmount + Array.from(cat.subCategories.values()).reduce((sum, sub) => {
        return sum + sub.allocatedAmount + Array.from(sub.subSubCategories.values()).reduce((subSubSum, subSub) => subSubSum + subSub.allocatedAmount, 0)
      }, 0)

      return {
        name: catName,
        code: cat.code,
        allocatedAmount: catTotal,
        percentage: totalAmount > 0 ? (catTotal / totalAmount) * 100 : 0,
        subCategories: Array.from(cat.subCategories.entries()).map(([subName, sub]) => {
          const subTotal = sub.allocatedAmount + Array.from(sub.subSubCategories.values()).reduce((sum, subSub) => sum + subSub.allocatedAmount, 0)
          return {
            name: subName,
            code: sub.code,
            allocatedAmount: subTotal,
            percentage: catTotal > 0 ? (subTotal / catTotal) * 100 : 0,
            subSubCategories: Array.from(sub.subSubCategories.entries()).map(([subSubName, subSub]) => ({
              name: subSubName,
              code: subSub.code,
              allocatedAmount: subSub.allocatedAmount,
              percentage: subTotal > 0 ? (subSub.allocatedAmount / subTotal) * 100 : 0,
            })),
          }
        }),
      }
    })

    const tenantId = (session.user as any).tenantId

    // Create or update budget
    if (budgetId) {
      // Update existing budget
      const existingBudget = await prisma.budget.findFirst({
        where: { id: budgetId, tenantId },
      })

      if (!existingBudget) {
        return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
      }

      // Delete existing categories
      await prisma.budgetCategory.deleteMany({
        where: { budgetId },
      })

      // Create new categories with hierarchy
      for (const cat of categories) {
        const category = await prisma.budgetCategory.create({
          data: {
            budgetId,
            name: cat.name,
            code: cat.code,
            allocatedAmount: cat.allocatedAmount,
            percentage: cat.percentage,
            level: 1,
          },
        })

        // Create sub-categories
        for (const subCat of cat.subCategories) {
          const subCategory = await prisma.budgetCategory.create({
            data: {
              budgetId,
              name: subCat.name,
              code: subCat.code,
              allocatedAmount: subCat.allocatedAmount,
              percentage: subCat.percentage,
              parentCategoryId: category.id,
              level: 2,
            },
          })

          // Create sub-sub-categories
          for (const subSubCat of subCat.subSubCategories) {
            await prisma.budgetCategory.create({
              data: {
                budgetId,
                name: subSubCat.name,
                code: subSubCat.code,
                allocatedAmount: subSubCat.allocatedAmount,
                percentage: subSubCat.percentage,
                parentCategoryId: subCategory.id,
                level: 3,
              },
            })
          }
        }
      }

      // Update budget total
      await prisma.budget.update({
        where: { id: budgetId },
        data: { totalAmount: totalAmount },
      })

      const updatedBudget = await prisma.budget.findUnique({
        where: { id: budgetId },
        include: {
          categories: {
            where: { parentCategoryId: null },
            include: {
              subCategories: {
                include: {
                  subCategories: true,
                },
              },
            },
          },
        },
      })

      return NextResponse.json({ budget: updatedBudget }, { status: 200 })
    } else {
      // Create new budget
      const budget = await prisma.budget.create({
        data: {
          tenantId,
          name: `Budget from ${file.name}`,
          description: `Imported from ${file.name}`,
          totalAmount: totalAmount,
          currency: 'USD',
          fiscalYear: new Date().getFullYear(),
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          status: 'DRAFT',
          createdById: session.user.id,
          categories: {
            create: categories.map((cat) => ({
              name: cat.name,
              code: cat.code,
              allocatedAmount: cat.allocatedAmount,
              percentage: cat.percentage,
              level: 1,
              subCategories: {
                create: cat.subCategories.map((subCat) => ({
                  name: subCat.name,
                  code: subCat.code,
                  allocatedAmount: subCat.allocatedAmount,
                  percentage: subCat.percentage,
                  level: 2,
                  subCategories: {
                    create: subCat.subSubCategories.map((subSubCat) => ({
                      name: subSubCat.name,
                      code: subSubCat.code,
                      allocatedAmount: subSubCat.allocatedAmount,
                      percentage: subSubCat.percentage,
                      level: 3,
                    })),
                  },
                })) as any,
              },
            })) as any,
          },
        },
        include: {
          categories: {
            include: {
              subCategories: {
                include: {
                  subCategories: true,
                },
              },
            },
          },
        },
      })

      return NextResponse.json({ budget }, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error uploading budget file:', error)
    return NextResponse.json(
      { error: 'Failed to upload budget file', details: error.message },
      { status: 500 }
    )
  }
}

