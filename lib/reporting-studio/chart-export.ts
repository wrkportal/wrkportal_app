// Chart Export Utilities for Reporting Studio

export type ExportFormat = 'png' | 'svg' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  width?: number
  height?: number
  backgroundColor?: string
  quality?: number // For PNG, 0-1
}

/**
 * Export chart as PNG
 */
export async function exportChartAsPNG(
  element: HTMLElement,
  options: ExportOptions
): Promise<Blob> {
  const html2canvas = (await import('html2canvas')).default

  const canvas = await html2canvas(element, {
    backgroundColor: options.backgroundColor || '#ffffff',
    width: options.width || element.offsetWidth,
    height: options.height || element.offsetHeight,
    scale: 2, // Higher quality
    logging: false,
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to export chart as PNG'))
        }
      },
      'image/png',
      options.quality || 1
    )
  })
}

/**
 * Export chart as SVG
 */
export async function exportChartAsSVG(
  svgElement: SVGElement,
  options: ExportOptions
): Promise<Blob> {
  // Clone the SVG element
  const clonedSvg = svgElement.cloneNode(true) as SVGElement

  // Set dimensions if provided
  if (options.width) {
    clonedSvg.setAttribute('width', String(options.width))
  }
  if (options.height) {
    clonedSvg.setAttribute('height', String(options.height))
  }

  // Serialize to string
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clonedSvg)

  // Add XML declaration and namespace if needed
  const fullSvgString = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${svgString}`

  // Create blob
  return new Blob([fullSvgString], { type: 'image/svg+xml' })
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export chart (wrapper function)
 */
export async function exportChart(
  element: HTMLElement | SVGElement,
  filename: string,
  options: ExportOptions
): Promise<void> {
  let blob: Blob

  switch (options.format) {
    case 'png':
      blob = await exportChartAsPNG(element as HTMLElement, options)
      break

    case 'svg':
      // For Recharts, we need to find the SVG element
      const svgElement = element.querySelector('svg') || (element as SVGElement)
      blob = await exportChartAsSVG(svgElement, options)
      break

    case 'pdf':
      // PDF export requires html2canvas + jsPDF
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(element as HTMLElement, {
        backgroundColor: options.backgroundColor || '#ffffff',
        width: options.width || element.offsetWidth,
        height: options.height || element.offsetHeight,
        scale: 2,
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      blob = pdf.output('blob')
      break

    default:
      throw new Error(`Unsupported export format: ${options.format}`)
  }

  downloadBlob(blob, filename)
}

