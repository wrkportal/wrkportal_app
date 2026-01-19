import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb } from 'pdf-lib'
// @ts-ignore - pptxgenjs doesn't have proper types
import PptxGenJS from 'pptxgenjs'

interface Slide {
  id: string
  number: number
  title: string
  items: Array<{
    id: string
    type: 'visualization' | 'text'
    name: string
    order: number
    exportImage?: string // High-resolution image for individual item (base64 data URL)
    position?: { x: number; y: number; w: number; h: number } // Grid position
  }>
  exportImage?: string // High-resolution image for entire slide (base64 data URL, fallback)
}

// POST: Export dashboard as PDF or PPT
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: dashboardId } = await params
    const body = await request.json()
    const { format, slides }: { format: 'pdf' | 'ppt'; slides: Slide[] } = body

    if (!format || !['pdf', 'ppt'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use "pdf" or "ppt"' },
        { status: 400 }
      )
    }

    // Fetch dashboard with visualizations
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
      include: {
        visualizations: {
          include: {
            visualization: {
              include: {
                query: {
                  include: {
                    dataSource: {
                      select: {
                        id: true,
                        name: true,
                        type: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // Check access
    const share = await prisma.dashboardShare.findFirst({
      where: {
        dashboardId,
        userId: session.user.id,
        permission: { in: ['VIEW', 'EDIT', 'ADMIN'] },
      },
    })

    if (dashboard.createdById !== session.user.id && !share) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (format === 'pdf') {
      return await exportPDF(dashboard, slides)
    } else {
      return await exportPPT(dashboard, slides)
    }
  } catch (error: any) {
    console.error('Error exporting dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to export dashboard', details: error.message },
      { status: 500 }
    )
  }
}

async function exportPDF(dashboard: any, slides: Slide[]): Promise<NextResponse> {
  try {
    // Parse dashboard layout to get page thumbnails
    const dashboardLayout = typeof dashboard.layout === 'string'
      ? (() => { try { return JSON.parse(dashboard.layout) } catch (_) { return {} } })()
      : (dashboard.layout || {})
    
    const pages = (dashboardLayout.pages || []) as Array<{ id: string; name: string; order: number; thumbnail?: string }>

    // Create PDF document using pdf-lib (no font loading issues)
    const pdfDoc = await PDFDocument.create()
    
    // Landscape A4 dimensions in points (1 inch = 72 points)
    // A4 landscape: 842 x 595 points
    const pageWidth = 842
    const pageHeight = 595
    const margin = 50

    // Add header page
    const headerPage = pdfDoc.addPage([pageWidth, pageHeight])
    const { width: headerWidth, height: headerHeight } = headerPage.getSize()
    
    // Add title
    headerPage.drawText(dashboard.name, {
      x: margin,
      y: headerHeight - margin - 30,
      size: 24,
      color: rgb(0, 0, 0),
    })
    
    if (dashboard.description) {
      headerPage.drawText(dashboard.description, {
        x: margin,
        y: headerHeight - margin - 60,
        size: 12,
        color: rgb(0, 0, 0),
      })
    }
    
    headerPage.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: margin,
      y: headerHeight - margin - 80,
      size: 10,
      color: rgb(0.5, 0.5, 0.5),
    })

    // Export each slide as a page
    for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
      const slide = slides[slideIndex]
      const page = pdfDoc.addPage([pageWidth, pageHeight])
      const { width, height } = page.getSize()

      // Slide title
      const titleText = slide.title || `Slide ${slide.number}`
      page.drawText(titleText, {
        x: margin,
        y: height - margin - 30,
        size: 18,
        color: rgb(0, 0, 0),
      })
      // Draw underline manually
      page.drawLine({
        start: { x: margin, y: height - margin - 35 },
        end: { x: margin + titleText.length * 10, y: height - margin - 35 },
        thickness: 1,
        color: rgb(0, 0, 0),
      })

      // Fallback: use full slide image
      const matchingPage = pages.find(p => p.id === slide.id || p.order === slide.number - 1)
      const imageData = slide.exportImage || matchingPage?.thumbnail

      if (imageData) {
        try {
          const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
          const imageBytes = Uint8Array.from(Buffer.from(base64Data, 'base64'))
          const image = await pdfDoc.embedPng(imageBytes)

          // Calculate dimensions - reduce height by 15% (increased size)
          const maxWidth = width - (margin * 2)
          const maxHeight = (height - margin - 100) * 0.85 // Reduce height by 15%, leave space for title
          
          const imageDims = image.scaleToFit(maxWidth, maxHeight)
          
          // Center the image
          const x = (width - imageDims.width) / 2
          const y = height - margin - 100 - imageDims.height

          page.drawImage(image, {
            x,
            y,
            width: imageDims.width,
            height: imageDims.height,
          })
        } catch (error) {
          console.error('Error adding image to PDF:', error)
          page.drawText('Dashboard content preview', {
            x: margin,
            y: height - margin - 100,
            size: 12,
            color: rgb(0.5, 0.5, 0.5),
          })
        }
      } else {
        // No thumbnail available, show items list as fallback
        let yPos = height - margin - 100
        page.drawText('Items on this page:', {
          x: margin,
          y: yPos,
          size: 12,
          color: rgb(0, 0, 0),
        })
        yPos -= 20
        
        slide.items.forEach((item) => {
          page.drawText(`• ${item.name} (${item.type === 'visualization' ? 'Chart' : 'Text Widget'})`, {
            x: margin + 20,
            y: yPos,
            size: 10,
            color: rgb(0, 0, 0),
          })
          yPos -= 15
        })
      }
    }

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save()
    const filename = `${dashboard.name.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.pdf`

    // Convert Uint8Array to Buffer for NextResponse
    const pdfBuffer = Buffer.from(pdfBytes)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error in PDF generation:', error)
    return NextResponse.json(
      { error: 'Failed to export dashboard', details: error.message },
      { status: 500 }
    )
  }
}

async function exportPPT(dashboard: any, slides: Slide[]): Promise<NextResponse> {
  const pptx = new PptxGenJS()

  // Set presentation properties
  pptx.author = dashboard.createdBy?.name || 'Dashboard Export'
  pptx.company = 'Dashboard System'
  pptx.title = dashboard.name
  pptx.subject = dashboard.description || 'Dashboard Export'

  // Parse dashboard layout to get page thumbnails
  const dashboardLayout = typeof dashboard.layout === 'string'
    ? (() => { try { return JSON.parse(dashboard.layout) } catch { return {} } })()
    : (dashboard.layout || {})
  
  const pages = (dashboardLayout.pages || []) as Array<{ id: string; name: string; order: number; thumbnail?: string }>

  // Add each slide
  slides.forEach((slide) => {
    const pptSlide = pptx.addSlide()

    // Find matching page by ID or order
    const matchingPage = pages.find(p => p.id === slide.id || p.order === slide.number - 1)

    // Slide title
    pptSlide.addText(slide.title || `Slide ${slide.number}`, {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: '363636',
    })

    // Check if we have individual item images with positions
    const itemsWithImages = slide.items.filter(item => item.exportImage && item.position)
    
    // For now, always use full slide image as fallback is more reliable
    // Individual item capture may fail if DOM elements aren't found
    // Check if we have individual item images with positions AND if they're valid
    const validItemsWithImages = itemsWithImages.filter(item => {
      const hasValidImage = item.exportImage && item.exportImage.length > 100 // Basic validation - base64 images are long strings
      return hasValidImage && item.position
    })
    
    // Debug: log what we have
    console.log(`Slide ${slide.number}: ${validItemsWithImages.length} valid items with images, ${slide.items.length} total items`)
    
    if (validItemsWithImages.length > 0 && validItemsWithImages.length === slide.items.length) {
      // Export individual items with their positions
      // Grid uses 12 columns, PPT slide width is 10" (9" usable after margins)
      // Available space: x=0.5, y=1.0, w=9, h=6.0
      const usableWidth = 9 // inches
      const usableHeight = 6.0 // inches
      const gridColumns = 12
      const gridColumnWidth = usableWidth / gridColumns // ~0.75 inches per column
      
      // Find max dimensions to normalize positions
      let maxX = 0
      let maxY = 0
      validItemsWithImages.forEach(item => {
        if (item.position) {
          maxX = Math.max(maxX, item.position.x + item.position.w)
          maxY = Math.max(maxY, item.position.y + item.position.h)
        }
      })
      
      // Normalize factor if items extend beyond standard grid
      const scaleX = maxX > gridColumns ? gridColumns / maxX : 1
      const scaleY = maxY > 10 ? 10 / maxY : 1 // Assume ~10 rows max
      
      // Calculate row height (estimate: if maxY rows fit in usableHeight)
      const estimatedRowHeight = maxY > 0 ? usableHeight / (maxY * scaleY) : usableHeight / 10
      
      validItemsWithImages.forEach(item => {
        if (!item.exportImage || !item.position) return
        
        try {
          // Convert grid position to PPT inches
          const x = 0.5 + (item.position.x * gridColumnWidth * scaleX)
          const y = 1.0 + (item.position.y * estimatedRowHeight * scaleY)
          const w = item.position.w * gridColumnWidth * scaleX
          const h = item.position.h * estimatedRowHeight * scaleY
          
          pptSlide.addImage({
            data: item.exportImage,
            x: Math.max(0.5, x), // Ensure within bounds
            y: Math.max(1.0, y),
            w: Math.min(w, 9), // Don't exceed available width
            h: Math.min(h, 6.0), // Don't exceed available height
            sizing: {
              type: 'contain',
              w: Math.min(w, 9),
              h: Math.min(h, 6.0),
            },
          })
        } catch (error) {
          console.error(`Error adding item ${item.id} to PPT:`, error)
        }
      })
    } else {
      // Fallback: use full slide image or thumbnail
      const imageData = slide.exportImage || matchingPage?.thumbnail

      console.log(`Slide ${slide.number}: Using fallback full slide image - has exportImage: ${!!slide.exportImage}, has thumbnail: ${!!matchingPage?.thumbnail}, imageData length: ${imageData?.length || 0}`)

      if (imageData && imageData.length > 100) { // Ensure it's a valid base64 string
        try {
          const slideWidth = 9 // inches
          const slideHeight = 5.5 * 0.7 // inches - reduce height by 30%
          
          pptSlide.addImage({
            data: imageData,
            x: 0.5,
            y: 1.0,
            w: slideWidth,
            h: slideHeight,
            sizing: {
              type: 'contain',
              w: slideWidth,
              h: slideHeight,
            },
          })
        } catch (error) {
          console.error('Error adding image to PPT:', error)
          // Fallback to text if image fails
          pptSlide.addText('Dashboard content preview', {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 4,
            fontSize: 14,
            color: '999999',
            align: 'center',
            valign: 'middle',
          })
        }
      } else {
        // No thumbnail available, show items list as fallback
        let currentY = 1.5
        slide.items.forEach((item, itemIndex) => {
          if (itemIndex > 0 && itemIndex % 4 === 0) {
            currentY += 0.3
          }

          pptSlide.addText(`• ${item.name} (${item.type === 'visualization' ? 'Chart' : 'Text Widget'})`, {
            x: 0.5,
            y: currentY,
            w: 9,
            h: 0.3,
            fontSize: 12,
            color: '666666',
          })
          currentY += 0.4

          if (currentY > 6.5) {
            return // Stop if we run out of space
          }
        })
      }
    }
  })

  // Generate the PPTX file
  const buffer = await pptx.write({ outputType: 'nodebuffer' })
  const filename = `${dashboard.name.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.pptx`

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
