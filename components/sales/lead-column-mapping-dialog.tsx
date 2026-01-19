'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

// Standard database fields for leads
export const LEAD_STANDARD_FIELDS = [
  { value: 'firstName', label: 'First Name', required: true },
  { value: 'lastName', label: 'Last Name', required: true },
  { value: 'email', label: 'Email', required: true },
  { value: 'company', label: 'Company', required: false },
  { value: 'phone', label: 'Phone', required: false },
  { value: 'mobile', label: 'Mobile', required: false },
  { value: 'title', label: 'Title', required: false },
  { value: 'industry', label: 'Industry', required: false },
  { value: 'leadSource', label: 'Lead Source', required: false },
  { value: 'status', label: 'Status', required: false },
  { value: 'rating', label: 'Rating', required: false },
  { value: 'description', label: 'Description', required: false },
] as const

// Standard database fields for accounts
export const ACCOUNT_STANDARD_FIELDS = [
  { value: 'name', label: 'Name', required: true },
  { value: 'type', label: 'Type', required: false },
  { value: 'industry', label: 'Industry', required: false },
  { value: 'website', label: 'Website', required: false },
  { value: 'phone', label: 'Phone', required: false },
  { value: 'email', label: 'Email', required: false },
  { value: 'annualRevenue', label: 'Annual Revenue', required: false },
  { value: 'numberOfEmployees', label: 'Number of Employees', required: false },
  { value: 'description', label: 'Description', required: false },
  { value: 'status', label: 'Status', required: false },
  { value: 'rating', label: 'Rating', required: false },
] as const

// Standard database fields for contacts
export const CONTACT_STANDARD_FIELDS = [
  { value: 'firstName', label: 'First Name', required: true },
  { value: 'lastName', label: 'Last Name', required: true },
  { value: 'email', label: 'Email', required: false },
  { value: 'phone', label: 'Phone', required: false },
  { value: 'mobile', label: 'Mobile', required: false },
  { value: 'title', label: 'Title', required: false },
  { value: 'department', label: 'Department', required: false },
  { value: 'accountName', label: 'Account Name', required: false },
  { value: 'leadSource', label: 'Lead Source', required: false },
  { value: 'description', label: 'Description', required: false },
  { value: 'status', label: 'Status', required: false },
] as const

// Standard database fields for opportunities
export const OPPORTUNITY_STANDARD_FIELDS = [
  { value: 'name', label: 'Name', required: true },
  { value: 'accountName', label: 'Account Name', required: false },
  { value: 'stage', label: 'Stage', required: false },
  { value: 'amount', label: 'Amount', required: false },
  { value: 'probability', label: 'Probability', required: false },
  { value: 'expectedCloseDate', label: 'Expected Close Date', required: true },
  { value: 'type', label: 'Type', required: false },
  { value: 'leadSource', label: 'Lead Source', required: false },
  { value: 'nextStep', label: 'Next Step', required: false },
  { value: 'description', label: 'Description', required: false },
  { value: 'competitorInfo', label: 'Competitor Info', required: false },
] as const

// Standard database fields for products
export const PRODUCT_STANDARD_FIELDS = [
  { value: 'name', label: 'Name', required: true },
  { value: 'code', label: 'Code', required: false },
  { value: 'description', label: 'Description', required: false },
  { value: 'family', label: 'Family', required: false },
  { value: 'category', label: 'Category', required: false },
  { value: 'unitPrice', label: 'Unit Price', required: false },
  { value: 'cost', label: 'Cost', required: false },
  { value: 'isActive', label: 'Is Active', required: false },
] as const

interface ColumnMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: string[]
  sampleRows: Record<string, any>[]
  onConfirm: (mapping: Record<string, string>) => void
  loading?: boolean
  standardFields?: Array<{ value: string; label: string; required: boolean }>
}

export function ColumnMappingDialog({
  open,
  onOpenChange,
  columns,
  sampleRows,
  onConfirm,
  loading = false,
  standardFields = LEAD_STANDARD_FIELDS,
}: ColumnMappingDialogProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [usedFields, setUsedFields] = useState<Set<string>>(new Set())

  // Auto-detect mappings on mount
  useEffect(() => {
    if (columns.length === 0) return

    const autoMapping: Record<string, string> = {}
    const normalizedColumns = columns.map((col) => col.toLowerCase().trim().replace(/\s+/g, ''))

    columns.forEach((col, index) => {
      const normalized = normalizedColumns[index]
      
      // Try to match common variations
      if (normalized.includes('firstname') || normalized.includes('first') || normalized === 'fname') {
        autoMapping[col] = 'firstName'
      } else if (normalized.includes('lastname') || normalized.includes('last') || normalized === 'lname') {
        autoMapping[col] = 'lastName'
      } else if (normalized === 'email' || normalized === 'e-mail' || normalized.includes('email')) {
        autoMapping[col] = 'email'
      } else if (normalized === 'company' || normalized === 'organization' || normalized === 'org') {
        autoMapping[col] = 'company'
      } else if (normalized === 'phone' || normalized.includes('phonenumber') || normalized === 'telephone') {
        autoMapping[col] = 'phone'
      } else if (normalized === 'mobile' || normalized === 'cell' || normalized.includes('mobilenumber')) {
        autoMapping[col] = 'mobile'
      } else if (normalized === 'title' || normalized === 'jobtitle' || normalized === 'position') {
        autoMapping[col] = 'title'
      } else if (normalized === 'industry') {
        autoMapping[col] = 'industry'
      } else if (normalized.includes('source') || normalized.includes('leadsource')) {
        autoMapping[col] = 'leadSource'
      } else if (normalized === 'status') {
        autoMapping[col] = 'status'
      } else if (normalized === 'rating') {
        autoMapping[col] = 'rating'
      } else if (normalized === 'description' || normalized === 'notes' || normalized === 'comments') {
        autoMapping[col] = 'description'
      }
      // Everything else defaults to unmapped (user must choose)
    })

    setMapping(autoMapping)
    updateUsedFields(autoMapping)
  }, [columns])

  const updateUsedFields = (currentMapping: Record<string, string>) => {
    const used = new Set<string>()
    Object.values(currentMapping).forEach((field) => {
      if (field && field !== 'custom' && field !== 'skip') {
        used.add(field)
      }
    })
    setUsedFields(used)
  }

  const handleMappingChange = (column: string, field: string) => {
    const newMapping = { ...mapping, [column]: field }
    setMapping(newMapping)
    updateUsedFields(newMapping)
  }

  const handleConfirm = () => {
    // Validate required fields are mapped
    const mappedFields = Object.values(mapping).filter(f => f && f !== 'skip')
    const requiredFields = standardFields.filter(f => f.required).map(f => f.value)
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field))

    if (missingFields.length > 0) {
      const fieldLabels = missingFields.map(f => {
        const field = standardFields.find(sf => sf.value === f)
        return field?.label || f
      })
      alert(`Please map the required fields: ${fieldLabels.join(', ')}`)
      return
    }

    onConfirm(mapping)
  }

  const requiredFieldsMapped = () => {
    const mappedFields = Object.values(mapping).filter(f => f && f !== 'skip')
    const requiredFields = standardFields.filter(f => f.required).map(f => f.value)
    return requiredFields.every(field => mappedFields.includes(field))
  }

  const getSampleValue = (column: string) => {
    if (sampleRows.length === 0) return '—'
    const firstRow = sampleRows[0]
    const value = firstRow[column]
    if (value === null || value === undefined) return '—'
    const strValue = String(value).trim()
    return strValue.length > 30 ? strValue.substring(0, 30) + '...' : strValue
  }

  const getFieldLabel = (fieldValue: string) => {
    if (fieldValue === 'custom') return 'Custom Field'
    if (fieldValue === 'skip') return 'Skip Column'
    const field = standardFields.find((f) => f.value === fieldValue)
    return field ? field.label : fieldValue
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map Columns to Database Fields</DialogTitle>
          <DialogDescription>
            Map each column from your file to a database field. Unmapped columns will be stored as custom fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!requiredFieldsMapped() && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please map the required fields: <strong>
                  {standardFields.filter(f => f.required).map(f => f.label).join(', ')}
                </strong>
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Tip:</strong> Select a standard database field to map your column, or choose "Custom Field" to store it as a custom field.
              You can also select "Skip Column" to ignore a column.
            </AlertDescription>
          </Alert>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">File Column</TableHead>
                  <TableHead className="w-[200px]">Map To</TableHead>
                  <TableHead>Sample Data</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((column) => {
                  const selectedField = mapping[column] || ''
                  const field = standardFields.find((f) => f.value === selectedField)
                  const isRequired = field?.required || false
                  const isMapped = selectedField && selectedField !== 'skip'

                  return (
                    <TableRow key={column}>
                      <TableCell>
                        <div className="font-medium">{column}</div>
                        {field?.required && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Required
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={selectedField || 'unmapped'}
                          onValueChange={(value) => handleMappingChange(column, value === 'unmapped' ? '' : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unmapped">
                              <span className="text-muted-foreground">— Not mapped —</span>
                            </SelectItem>
                            <SelectItem value="skip">
                              <span className="text-muted-foreground">Skip Column</span>
                            </SelectItem>
                            {standardFields.map((f) => {
                              const isUsed = usedFields.has(f.value) && mapping[column] !== f.value
                              return (
                                <SelectItem
                                  key={f.value}
                                  value={f.value}
                                  disabled={isUsed}
                                >
                                  {f.label}
                                  {f.required && <span className="text-red-500 ml-1">*</span>}
                                  {isUsed && <span className="text-muted-foreground text-xs ml-2">(already used)</span>}
                                </SelectItem>
                              )
                            })}
                            <SelectItem value="custom">
                              <span className="font-medium">Custom Field</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {getSampleValue(column)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isMapped ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Mapped
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unmapped</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Note:</strong> Each database field can only be mapped once. Duplicate mappings are disabled.</p>
            <p>Columns marked as "Custom Field" will be stored in the customFields JSON column.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!requiredFieldsMapped() || loading}>
            {loading ? 'Processing...' : 'Continue Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

