import { NextRequest, NextResponse } from "next/server"
import { extractStructuredData } from "@/lib/ai/ai-service"

export const runtime = "nodejs"

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const metrics = (formData.get("metrics") as string | null) || ""
    const conditions = (formData.get("conditions") as string | null) || ""

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "PDF file is too large" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!(globalThis as any).DOMMatrix) {
      const { DOMMatrix } = await import("dommatrix")
      ;(globalThis as any).DOMMatrix = DOMMatrix
    }
    const pdfParse = (await import("pdf-parse")).default
    const parsed = await pdfParse(buffer)
    const text = parsed.text?.slice(0, 200000) || ""

    if (!text) {
      return NextResponse.json({ error: "Unable to extract text from PDF" }, { status: 400 })
    }

    const schema = `{
      "summary": "string",
      "metrics": [
        {
          "name": "string",
          "value": "string",
          "unit": "string",
          "context": "string"
        }
      ],
      "conditions": [
        {
          "condition": "string",
          "matched": boolean,
          "evidence": "string"
        }
      ],
      "exposures": [
        {
          "state": "string",
          "exposure": "number or string",
          "unit": "string",
          "evidence": "string"
        }
      ]
    }`

    const instructions = `
You analyze PDF text for metrics and compliance checks.
1) Summarize key metrics listed by the user.
2) Evaluate conditions listed by the user and return match + evidence.
3) Extract exposures by state when present (e.g., CA).
Return concise, factual results.`

    const userContext = `Metrics requested: ${metrics || "None provided"}\nConditions: ${conditions || "None provided"}`

    const result = await extractStructuredData<any>(
      `${userContext}\n\nPDF Text:\n${text}`,
      schema,
      instructions
    )

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error("PDF metrics analysis error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to analyze PDF" },
      { status: 500 }
    )
  }
}
