'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Check, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'

// Category suggestions
const MAIN_CATEGORY_SUGGESTIONS = [
  { name: 'Revenue', code: 'REV', subCategories: ['Product Sales', 'Service Revenue', 'Subscription Revenue', 'Licensing', 'Other Revenue'] },
  { name: 'Employee Cost', code: 'EMP', subCategories: ['Salaries', 'Benefits', 'Bonuses', 'Training', 'Recruitment', 'Contractors'] },
  { name: 'Technologies', code: 'TECH', subCategories: ['Software Licenses', 'Cloud Services', 'Hardware', 'IT Support', 'Development Tools', 'Security'] },
  { name: 'Facilities', code: 'FAC', subCategories: ['Office Rent', 'Utilities', 'Maintenance', 'Insurance', 'Property Taxes', 'Furniture'] },
  { name: 'Travel', code: 'TRAV', subCategories: ['Airfare', 'Hotels', 'Meals', 'Transportation', 'Conferences', 'Training'] },
  { name: 'Marketing', code: 'MKT', subCategories: ['Advertising', 'Events', 'Content Creation', 'SEO/SEM', 'Social Media', 'PR'] },
  { name: 'Operations', code: 'OPS', subCategories: ['Supplies', 'Equipment', 'Logistics', 'Vendor Services', 'Utilities'] },
  { name: 'Professional Services', code: 'PROF', subCategories: ['Legal', 'Accounting', 'Consulting', 'Audit', 'Tax Services'] },
]

interface SubCategory {
  name: string
  code?: string
  selected: boolean
  subSubCategories?: SubSubCategory[]
  metrics?: {
    type?: string
    frequency?: string
    selectedMonths?: string[]
    customMetrics?: Array<{
      name: string
      unit: string
    }>
    namedCalculations?: Array<{
      name: string
      formula: string
      description?: string
    }>
    formula?: string // Formula to calculate total (e.g., "WOIDs * RatePerWOID + (CloseOutPercent / 100) * WOIDs * CloseOutRate")
  }
}

interface SubSubCategory {
  name: string
  code?: string
  selected: boolean
}

interface Category {
  name: string
  code?: string
  selected: boolean
  subCategories: SubCategory[]
  wantsSubSubCategories: boolean
}

interface MonthlyAmount {
  month: string
  amount: number
}

interface BudgetDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  budgetId?: string
  projectId?: string
  programId?: string
}

export function BudgetDialog({ open, onClose, onSuccess, budgetId, projectId, programId }: BudgetDialogProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])

  // Step 1: Basic Info
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectId: projectId || '',
    programId: programId || '',
    fiscalYear: new Date().getFullYear(),
    fiscalQuarter: undefined as number | undefined,
    totalAmount: 0,
    currency: 'USD',
    startDate: '',
    endDate: '',
  })

  // Step 2: Main Categories
  const [categories, setCategories] = useState<Category[]>([])
  const [customCategoryName, setCustomCategoryName] = useState('')

  // Step 3: Sub-Categories
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null)

  // Step 4: Sub-Sub-Categories
  const [wantsSubSubCategories, setWantsSubSubCategories] = useState(false)

  // Metrics Dialog
  const [metricsDialogOpen, setMetricsDialogOpen] = useState(false)
  const [selectedCategoryForMetrics, setSelectedCategoryForMetrics] = useState<number | null>(null)
  const [selectedSubCategoryForMetrics, setSelectedSubCategoryForMetrics] = useState<string | null>(null)
  const [metricsConfig, setMetricsConfig] = useState({
    type: '',
    frequency: '',
    selectedMonths: [] as string[],
    customMetrics: [] as Array<{ name: string; unit: string }>,
    namedCalculations: [] as Array<{ name: string; formula: string; description?: string }>,
    formula: '',
  })
  const [newMetricName, setNewMetricName] = useState('')
  const [newMetricUnit, setNewMetricUnit] = useState('')
  const [newCalculationName, setNewCalculationName] = useState('')
  const [newCalculationFormula, setNewCalculationFormula] = useState('')
  const [newCalculationDescription, setNewCalculationDescription] = useState('')
  const [formulaAutocompleteOpen, setFormulaAutocompleteOpen] = useState(false)
  const [formulaAutocompleteValue, setFormulaAutocompleteValue] = useState('')
  const [formulaSuggestions, setFormulaSuggestions] = useState<string[]>([])
  const formulaTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Step 5: Monthly Template
  const [monthlyData, setMonthlyData] = useState<Record<string, Record<string, number>>>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Category Edit Dialog
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false)
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryCode, setEditCategoryCode] = useState('')
  const [editCategoryTab, setEditCategoryTab] = useState<'basic' | 'structure' | 'allocation' | 'timing' | 'subcategories'>('basic')

  // Category structure options
  const [categoryStructure, setCategoryStructure] = useState<'flat' | 'hierarchical' | 'matrix' | 'custom'>('hierarchical')
  const [allocationMethod, setAllocationMethod] = useState<'fixed' | 'percentage' | 'formula' | 'historical' | 'forecast'>('fixed')
  const [timeDistribution, setTimeDistribution] = useState<'even' | 'custom' | 'seasonal' | 'front-loaded' | 'back-loaded'>('even')
  const [hasSubCategories, setHasSubCategories] = useState(true)
  const [categoryDescription, setCategoryDescription] = useState('')
  const [categoryNotes, setCategoryNotes] = useState('')

  // Custom structure configuration
  const [customLevels, setCustomLevels] = useState<Array<{ name: string; label: string; required: boolean }>>([
    { name: 'level1', label: 'Level 1', required: true },
    { name: 'level2', label: 'Level 2', required: false },
  ])
  const [customFields, setCustomFields] = useState<Array<{ name: string; type: 'text' | 'number' | 'select' | 'date'; label: string; options?: string[] }>>([])
  const [newLevelName, setNewLevelName] = useState('')
  const [newLevelLabel, setNewLevelLabel] = useState('')
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'select' | 'date'>('text')
  const [newFieldOptions, setNewFieldOptions] = useState('')

  // Calculate months based on start and end dates
  const getMonths = () => {
    if (!formData.startDate || !formData.endDate) return []
    const months = []
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    let current = new Date(start.getFullYear(), start.getMonth(), 1)
    while (current <= end) {
      months.push(new Date(current).toLocaleString('default', { month: 'short', year: 'numeric' }))
      current.setMonth(current.getMonth() + 1)
    }
    return months
  }

  const months = getMonths()

  useEffect(() => {
    if (open && !budgetId) {
      // Reset form for new budget
      setStep(1)
      setFormData({
        name: '',
        description: '',
        projectId: projectId || '',
        programId: programId || '',
        fiscalYear: new Date().getFullYear(),
        fiscalQuarter: undefined,
        totalAmount: 0,
        currency: 'USD',
        startDate: '',
        endDate: '',
      })
      setCategories([])
      setCustomCategoryName('')
      setSelectedCategoryIndex(null)
      setMonthlyData({})
      setExpandedCategories(new Set())
    }
  }, [open, budgetId, projectId, programId])

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch('/api/projects').then((r) => r.json()).then((d) => setProjects(d.projects || [])),
        fetch('/api/programs').then((r) => r.json()).then((d) => setPrograms(d.programs || [])),
      ]).catch(console.error)

      if (budgetId) {
        // Load existing budget for editing
        fetch(`/api/finance/budgets/${budgetId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.budget) {
              const budget = data.budget
              setFormData({
                name: budget.name,
                description: budget.description || '',
                projectId: budget.projectId || '',
                programId: budget.programId || '',
                fiscalYear: budget.fiscalYear,
                fiscalQuarter: budget.fiscalQuarter || undefined,
                totalAmount: Number(budget.totalAmount),
                currency: budget.currency,
                startDate: new Date(budget.startDate).toISOString().split('T')[0],
                endDate: new Date(budget.endDate).toISOString().split('T')[0],
              })
            }
          })
          .catch(console.error)
      }
    }
  }, [open, budgetId])

  // Generate unique code for category/sub-category
  const generateUniqueCode = (name: string, existingCodes: string[], prefix?: string): string => {
    // Try to create code from name first
    let baseCode = prefix || name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (baseCode.length < 2) baseCode = name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')

    let code = baseCode
    let counter = 1

    // Ensure uniqueness
    while (existingCodes.includes(code.toUpperCase())) {
      code = `${baseCode}${counter}`
      counter++
    }

    return code.toUpperCase()
  }

  const toggleCategory = (categoryName: string) => {
    const suggestion = MAIN_CATEGORY_SUGGESTIONS.find(c => c.name === categoryName)
    const existingIndex = categories.findIndex(c => c.name === categoryName)

    if (existingIndex >= 0) {
      // Remove category
      setCategories(categories.filter((_, i) => i !== existingIndex))
    } else {
      // Get all existing category codes
      const existingCodes = categories.map(c => c.code || '').filter(Boolean)

      // Generate unique code
      const uniqueCode = generateUniqueCode(categoryName, existingCodes, suggestion?.code)

      // Add category
      const newCategory: Category = {
        name: categoryName,
        code: uniqueCode,
        selected: true,
        wantsSubSubCategories,
        subCategories: (suggestion?.subCategories || []).map(sub => {
          // Generate unique codes for sub-categories too
          const subExistingCodes = categories
            .flatMap(c => c.subCategories.map(sc => sc.code || ''))
            .filter(Boolean)
          const subCode = generateUniqueCode(sub, subExistingCodes)
          return {
            name: sub,
            code: subCode,
            selected: false,
          }
        }),
      }
      setCategories([...categories, newCategory])
    }
  }

  const addCustomCategory = () => {
    if (customCategoryName.trim()) {
      // Get all existing category codes
      const existingCodes = categories.map(c => c.code || '').filter(Boolean)

      // Generate unique code
      const uniqueCode = generateUniqueCode(customCategoryName.trim(), existingCodes)

      const newCategory: Category = {
        name: customCategoryName.trim(),
        code: uniqueCode,
        selected: true,
        wantsSubSubCategories,
        subCategories: [],
      }
      setCategories([...categories, newCategory])
      setCustomCategoryName('')
    }
  }

  const toggleSubCategory = (categoryIndex: number, subCategoryName: string) => {
    const updated = [...categories]
    const category = updated[categoryIndex]
    const subIndex = category.subCategories.findIndex(s => s.name === subCategoryName)

    if (subIndex >= 0) {
      category.subCategories[subIndex].selected = !category.subCategories[subIndex].selected
    } else {
      category.subCategories.push({ name: subCategoryName, selected: true })
    }

    setCategories(updated)
  }

  const addCustomSubCategory = (categoryIndex: number, name: string) => {
    if (name.trim()) {
      const updated = [...categories]
      const trimmedName = name.trim()
      // Check if it already exists
      const exists = updated[categoryIndex].subCategories.some(s => s.name === trimmedName)
      if (!exists) {
        // Get all existing sub-category codes across all categories
        const existingCodes = updated
          .flatMap(c => c.subCategories.map(sc => sc.code || ''))
          .filter(Boolean)

        // Generate unique code
        const uniqueCode = generateUniqueCode(trimmedName, existingCodes)

        updated[categoryIndex].subCategories.push({
          name: trimmedName,
          code: uniqueCode,
          selected: true
        })
        setCategories(updated)
      }
    }
  }

  const openMetricsDialog = (categoryIndex: number, subCategoryName: string) => {
    const category = categories[categoryIndex]
    const subCategory = category.subCategories.find(s => s.name === subCategoryName)
    setSelectedCategoryForMetrics(categoryIndex)
    setSelectedSubCategoryForMetrics(subCategoryName)
    setMetricsConfig({
      type: '',
      frequency: '',
      selectedMonths: [],
      customMetrics: [],
      namedCalculations: [],
      formula: '',
      ...(subCategory?.metrics || {}),
    })
    setNewMetricName('')
    setNewMetricUnit('')
    setMetricsDialogOpen(true)
  }

  const saveMetrics = () => {
    if (selectedCategoryForMetrics !== null && selectedSubCategoryForMetrics) {
      const updated = [...categories]
      const category = updated[selectedCategoryForMetrics]
      const subIndex = category.subCategories.findIndex(s => s.name === selectedSubCategoryForMetrics)

      if (subIndex >= 0) {
        category.subCategories[subIndex].metrics = { ...metricsConfig }
        setCategories(updated)
      }

      setMetricsDialogOpen(false)
      setSelectedCategoryForMetrics(null)
      setSelectedSubCategoryForMetrics(null)
    }
  }

  const toggleMonth = (month: string) => {
    const updated = metricsConfig.selectedMonths.includes(month)
      ? metricsConfig.selectedMonths.filter(m => m !== month)
      : [...metricsConfig.selectedMonths, month]
    setMetricsConfig({ ...metricsConfig, selectedMonths: updated })
  }

  const addCustomMetric = () => {
    if (newMetricName.trim() && newMetricUnit.trim()) {
      setMetricsConfig({
        ...metricsConfig,
        customMetrics: [...metricsConfig.customMetrics, { name: newMetricName.trim(), unit: newMetricUnit.trim() }]
      })
      setNewMetricName('')
      setNewMetricUnit('')
    }
  }

  const removeCustomMetric = (index: number) => {
    setMetricsConfig({
      ...metricsConfig,
      customMetrics: metricsConfig.customMetrics.filter((_, i) => i !== index)
    })
  }

  const addNamedCalculation = () => {
    if (newCalculationName.trim() && newCalculationFormula.trim()) {
      setMetricsConfig({
        ...metricsConfig,
        namedCalculations: [...(metricsConfig.namedCalculations || []), {
          name: newCalculationName.trim(),
          formula: newCalculationFormula.trim(),
          description: newCalculationDescription.trim() || undefined,
        }]
      })
      setNewCalculationName('')
      setNewCalculationFormula('')
      setNewCalculationDescription('')
    }
  }

  const removeNamedCalculation = (index: number) => {
    setMetricsConfig({
      ...metricsConfig,
      namedCalculations: (metricsConfig.namedCalculations || []).filter((_, i) => i !== index)
    })
  }

  const insertAtCursor = (text: string) => {
    const textarea = formulaTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = metricsConfig.formula
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end)

    setMetricsConfig({ ...metricsConfig, formula: newValue })

    // Restore cursor position after the inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  const handleFormulaChange = (value: string) => {
    setMetricsConfig({ ...metricsConfig, formula: value })

    // Get cursor position
    const textarea = formulaTextareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = value.substring(0, cursorPos)

    // Find the word being typed (for autocomplete)
    const wordMatch = textBeforeCursor.match(/\b(\w+)$/)
    if (wordMatch) {
      const partialWord = wordMatch[1]
      const allSuggestions = [
        ...metricsConfig.customMetrics.map(m => m.name),
        ...(metricsConfig.namedCalculations || []).map(c => c.name)
      ]
      const suggestions = allSuggestions.filter(name =>
        name.toLowerCase().startsWith(partialWord.toLowerCase()) && name !== partialWord
      )

      if (suggestions.length > 0) {
        setFormulaAutocompleteValue(partialWord)
        setFormulaSuggestions(suggestions)
        setFormulaAutocompleteOpen(true)
      } else {
        setFormulaAutocompleteOpen(false)
      }
    } else {
      setFormulaAutocompleteOpen(false)
    }
  }

  const insertSuggestion = (suggestion: string) => {
    const textarea = formulaTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = metricsConfig.formula
    const textBeforeCursor = currentValue.substring(0, start)
    const wordMatch = textBeforeCursor.match(/\b(\w+)$/)

    if (wordMatch) {
      const wordStart = start - wordMatch[1].length
      const newValue = currentValue.substring(0, wordStart) + suggestion + currentValue.substring(end)
      setMetricsConfig({ ...metricsConfig, formula: newValue })

      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(wordStart + suggestion.length, wordStart + suggestion.length)
        setFormulaAutocompleteOpen(false)
      }, 0)
    }
  }

  const toggleSubSubCategory = (categoryIndex: number, subCategoryIndex: number, subSubCategoryName: string) => {
    const updated = [...categories]
    const category = updated[categoryIndex]
    const subCategory = category.subCategories[subCategoryIndex]

    if (!subCategory.subSubCategories) {
      subCategory.subSubCategories = []
    }

    const subSubIndex = subCategory.subSubCategories.findIndex(s => s.name === subSubCategoryName)
    if (subSubIndex >= 0) {
      subCategory.subSubCategories[subSubIndex].selected = !subCategory.subSubCategories[subSubIndex].selected
    } else {
      subCategory.subSubCategories.push({ name: subSubCategoryName, selected: true })
    }

    setCategories(updated)
  }

  const updateMonthlyAmount = (categoryName: string, subCategoryName: string, month: string, amount: number) => {
    setMonthlyData(prev => ({
      ...prev,
      [categoryName]: {
        ...prev[categoryName],
        [`${subCategoryName}_${month}`]: amount,
      }
    }))
  }

  const updateMetricValue = (categoryName: string, subCategoryName: string, metricName: string, month: string, value: number) => {
    setMonthlyData(prev => ({
      ...prev,
      [categoryName]: {
        ...prev[categoryName],
        [`${subCategoryName}_${metricName}_${month}`]: value,
      }
    }))
  }

  const getMetricValue = (
    categoryName: string,
    subCategoryName: string,
    metricName: string,
    month: string
  ): string | number => {
    const key = `${subCategoryName}_${metricName}_${month}`
    const value = monthlyData[categoryName]?.[key]
    // Return the value, preserving 0 as 0, but returning empty string for undefined/null
    if (value === undefined || value === null) return ''
    // If value is 0, return 0 (not empty string) - this is important for calculations
    if (value === 0) return 0
    return value
  }

  // Formula evaluator - safely evaluates formulas using metric values
  const evaluateFormula = (formula: string, categoryName: string, subCategoryName: string, month: string): number => {
    if (!formula) return 0

    try {
      // Replace metric names with their actual values
      let expression = formula
      const category = categories.find(c => c.name === categoryName)
      const subCategory = category?.subCategories.find(s => s.name === subCategoryName)

      // First, replace named calculations (they might use metrics)
      if (subCategory?.metrics?.namedCalculations) {
        subCategory.metrics.namedCalculations.forEach((calc) => {
          // Recursively evaluate the named calculation's formula
          let calcExpression = calc.formula
          if (subCategory.metrics?.customMetrics) {
            subCategory.metrics.customMetrics.forEach((metric) => {
              const value = getMetricValue(categoryName, subCategoryName, metric.name, month)
              const numValue = typeof value === 'number' ? value : parseFloat(value.toString()) || 0
              const regex = new RegExp(`\\b${metric.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
              calcExpression = calcExpression.replace(regex, numValue.toString())
            })
          }
          // Evaluate the named calculation
          try {
            const sanitized = calcExpression.replace(/\s+/g, '')
            if (/^[0-9+\-*/().\s]+$/.test(sanitized)) {
              const calcResult = new Function('return ' + calcExpression)()
              const regex = new RegExp(`\\b${calc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
              expression = expression.replace(regex, calcResult.toString())
            }
          } catch (e) {
            console.error('Error evaluating named calculation:', calc.name, e)
          }
        })
      }

      // Then replace metric names with their actual values
      if (subCategory?.metrics?.customMetrics) {
        subCategory.metrics.customMetrics.forEach((metric) => {
          const value = getMetricValue(categoryName, subCategoryName, metric.name, month)
          // Handle empty string, null, undefined, or 0
          let numValue = 0
          if (value !== undefined && value !== null && value !== '') {
            numValue = typeof value === 'number' ? value : parseFloat(value.toString()) || 0
          }
          // Replace metric name (as whole word) with its value
          const regex = new RegExp(`\\b${metric.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
          expression = expression.replace(regex, numValue.toString())
        })
      }

      // Replace any remaining variable names with 0 (in case of typos or undefined metrics)
      expression = expression.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (match) => {
        // Check if it's a number (already replaced)
        if (!isNaN(parseFloat(match))) return match
        // Check if it's an operator or function
        if (['+', '-', '*', '/', '(', ')', 'return'].includes(match)) return match
        // Otherwise replace with 0
        console.warn(`Unknown variable in formula: ${match}, replacing with 0`)
        return '0'
      })

      // Evaluate the expression safely
      // Only allow numbers, operators, parentheses, and decimal points
      const sanitized = expression.replace(/\s+/g, '')
      if (!/^[0-9+\-*/().\s]+$/.test(sanitized)) {
        console.warn('Invalid characters in formula after replacement:', expression, 'Sanitized:', sanitized)
        return 0
      }

      // Use Function constructor for evaluation (safer than eval)
      try {
        const result = new Function('return ' + sanitized)()
        const finalResult = typeof result === 'number' && !isNaN(result) ? result : 0
        return finalResult
      } catch (e) {
        console.error('Error evaluating expression:', e, 'Expression:', expression)
        return 0
      }
    } catch (error) {
      console.error('Error evaluating formula:', error, 'Formula:', formula)
      return 0
    }
  }

  const getCalculatedTotal = (categoryName: string, subCategoryName: string, month: string): number => {
    const category = categories.find(c => c.name === categoryName)
    const subCategory = category?.subCategories.find(s => s.name === subCategoryName)
    const formula = subCategory?.metrics?.formula

    if (formula && formula.trim()) {
      const result = evaluateFormula(formula, categoryName, subCategoryName, month)
      return result
    }

    // Fallback to sum of all metric values if no formula
    if (subCategory?.metrics?.customMetrics && subCategory.metrics.customMetrics.length > 0) {
      return subCategory.metrics.customMetrics.reduce((sum, metric) => {
        const value = getMetricValue(categoryName, subCategoryName, metric.name, month)
        const numValue = typeof value === 'number' ? value : (value === '' ? 0 : parseFloat(value.toString()) || 0)
        return sum + numValue
      }, 0)
    }

    // Fallback to old method
    return monthlyData[categoryName]?.[`${subCategoryName}_${month}`] || 0
  }

  const getMonthlyTotalForSubCategory = (categoryName: string, subCategoryName: string) => {
    return months.reduce((sum, month) => {
      return sum + getCalculatedTotal(categoryName, subCategoryName, month)
    }, 0)
  }

  const getMonthlyTotal = (categoryName: string, subCategoryName: string) => {
    const categoryData = monthlyData[categoryName] || {}
    return months.reduce((sum, month) => {
      return sum + (categoryData[`${subCategoryName}_${month}`] || 0)
    }, 0)
  }

  const getCategoryTotal = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName)
    if (!category) return 0
    return category.subCategories.reduce((sum, sub) => {
      if (sub.selected) {
        return sum + getMonthlyTotalForSubCategory(categoryName, sub.name)
      }
      return sum
    }, 0)
  }

  const getTotalBudget = () => {
    return categories.reduce((sum, cat) => sum + getCategoryTotal(cat.name), 0)
  }

  const toggleCategoryExpansion = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  const openEditCategoryDialog = (categoryIndex: number) => {
    const category = categories[categoryIndex]
    setEditingCategoryIndex(categoryIndex)
    setEditCategoryName(category.name)
    setEditCategoryCode(category.code || '')
    setCategoryDescription('')
    setCategoryNotes('')
    setHasSubCategories(category.subCategories && category.subCategories.length > 0)
    setEditCategoryTab('basic')
    setEditCategoryDialogOpen(true)
  }

  // Sub-category editing state
  const [editingSubCategoryIndex, setEditingSubCategoryIndex] = useState<number | null>(null)
  const [editSubCategoryName, setEditSubCategoryName] = useState('')
  const [editSubCategoryCode, setEditSubCategoryCode] = useState('')

  const saveCategoryEdit = () => {
    if (editingCategoryIndex === null || !editCategoryName.trim()) return

    const updated = [...categories]
    const oldCategoryName = updated[editingCategoryIndex].name

    // Validate code uniqueness
    const allCategoryCodes = updated
      .map((c, idx) => idx === editingCategoryIndex ? null : (c.code || ''))
      .filter(Boolean) as string[]

    // Check if code is unique
    if (editCategoryCode.trim()) {
      const codeToCheck = editCategoryCode.trim().toUpperCase()
      if (allCategoryCodes.includes(codeToCheck)) {
        alert('This code is already in use. Please choose a unique code.')
        return
      }
      updated[editingCategoryIndex].code = codeToCheck
    } else {
      // Generate unique code if not provided
      const uniqueCode = generateUniqueCode(editCategoryName.trim(), allCategoryCodes)
      updated[editingCategoryIndex].code = uniqueCode
    }

    updated[editingCategoryIndex].name = editCategoryName.trim()

    // Update monthlyData keys if category name changed
    if (oldCategoryName !== editCategoryName.trim() && monthlyData[oldCategoryName]) {
      const oldData = monthlyData[oldCategoryName]
      setMonthlyData(prev => {
        const newData = { ...prev }
        delete newData[oldCategoryName]
        newData[editCategoryName.trim()] = oldData
        return newData
      })
    }

    setCategories(updated)
    setEditCategoryDialogOpen(false)
    setEditingCategoryIndex(null)
    setEditCategoryName('')
    setEditCategoryCode('')
    setCategoryDescription('')
    setCategoryNotes('')
  }

  const openEditSubCategoryDialog = (subCategoryIndex: number) => {
    if (editingCategoryIndex === null) return
    const subCategory = categories[editingCategoryIndex].subCategories[subCategoryIndex]
    setEditingSubCategoryIndex(subCategoryIndex)
    setEditSubCategoryName(subCategory.name)
    setEditSubCategoryCode(subCategory.code || '')
  }

  const saveSubCategoryEdit = () => {
    if (editingCategoryIndex === null || editingSubCategoryIndex === null || !editSubCategoryName.trim()) return

    const updated = [...categories]
    const category = updated[editingCategoryIndex]
    const subCategory = category.subCategories[editingSubCategoryIndex]
    const oldSubCategoryName = subCategory.name

    // Validate code uniqueness - get all sub-category codes except the current one
    const allSubCategoryCodes = updated
      .flatMap((c, catIdx) =>
        c.subCategories
          .map((sc, subIdx) =>
            (catIdx === editingCategoryIndex && subIdx === editingSubCategoryIndex)
              ? null
              : (sc.code || '')
          )
      )
      .filter(Boolean) as string[]

    // Check if code is unique
    if (editSubCategoryCode.trim()) {
      const codeToCheck = editSubCategoryCode.trim().toUpperCase()
      if (allSubCategoryCodes.includes(codeToCheck)) {
        alert('This code is already in use. Please choose a unique code.')
        return
      }
      subCategory.code = codeToCheck
    } else {
      // Generate unique code if not provided
      const uniqueCode = generateUniqueCode(editSubCategoryName.trim(), allSubCategoryCodes)
      subCategory.code = uniqueCode
    }

    subCategory.name = editSubCategoryName.trim()

    // Update monthlyData keys if sub-category name changed
    if (oldSubCategoryName !== editSubCategoryName.trim() && editingCategoryIndex !== null) {
      const categoryName = categories[editingCategoryIndex].name
      if (monthlyData[categoryName]) {
        const categoryData = monthlyData[categoryName]
        const newCategoryData: Record<string, number> = {}

        Object.keys(categoryData).forEach(key => {
          if (key.startsWith(`${oldSubCategoryName}_`)) {
            newCategoryData[key.replace(`${oldSubCategoryName}_`, `${editSubCategoryName.trim()}_`)] = categoryData[key]
          } else {
            newCategoryData[key] = categoryData[key]
          }
        })

        setMonthlyData(prev => ({
          ...prev,
          [categoryName]: newCategoryData,
        }))
      }
    }

    setCategories(updated)
    setEditingSubCategoryIndex(null)
    setEditSubCategoryName('')
    setEditSubCategoryCode('')
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.startDate || !formData.endDate) {
        alert('Please fill in all required fields')
        return
      }
    } else if (step === 2) {
      if (categories.length === 0) {
        alert('Please select at least one category')
        return
      }
    } else if (step === 3) {
      const hasSubCategories = categories.some(cat => cat.subCategories.some(sub => sub.selected))
      if (!hasSubCategories) {
        alert('Please select at least one sub-category')
        return
      }
      // When entering step 4 (Monthly Template), expand all categories by default
      const allCategoryNames = new Set(categories.map(cat => cat.name))
      setExpandedCategories(allCategoryNames)
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // Build category structure with monthly amounts
      const categoryStructure = categories.map(category => {
        const subCategories = category.subCategories
          .filter(sub => sub.selected)
          .map(subCategory => {
            // Use getMonthlyTotalForSubCategory which handles formulas correctly
            const monthlyTotal = getMonthlyTotalForSubCategory(category.name, subCategory.name)
            const subSubCategories: any[] = []

            return {
              name: subCategory.name,
              code: subCategory.code,
              allocatedAmount: monthlyTotal,
              subSubCategories,
            }
          })

        const categoryTotal = getCategoryTotal(category.name)
        return {
          name: category.name,
          code: category.code,
          allocatedAmount: categoryTotal,
          subCategories,
        }
      })

      const totalAmount = getTotalBudget()

      // Validate that total amount is positive
      if (totalAmount <= 0) {
        alert('Please enter at least one monthly amount in the Monthly Template step. The total budget must be greater than 0.')
        setIsLoading(false)
        return
      }

      // Validate that category totals match the total amount (with small tolerance for floating point)
      const categoryTotal = categoryStructure.reduce((sum, cat) => sum + cat.allocatedAmount, 0)
      if (Math.abs(categoryTotal - totalAmount) > 0.01) {
        alert(`Category allocations (${categoryTotal.toFixed(2)}) must equal total budget amount (${totalAmount.toFixed(2)}). Please check your monthly amounts.`)
        setIsLoading(false)
        return
      }

      const payload = {
        ...formData,
        projectId: formData.projectId || undefined,
        programId: formData.programId || undefined,
        fiscalQuarter: formData.fiscalQuarter || undefined,
        totalAmount,
        categories: categoryStructure,
        monthlyData, // Include monthly breakdown
      }

      const url = budgetId ? `/api/finance/budgets/${budgetId}` : '/api/finance/budgets'
      const method = budgetId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Budget creation error:', error)
        console.error('Payload sent:', payload)
        const errorMessage = error.details
          ? `${error.error}: ${Array.isArray(error.details) ? error.details.map((d: any) => d.message || d.path?.join('.')).join(', ') : error.details}`
          : error.error || 'Failed to save budget'
        throw new Error(errorMessage)
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      alert(error.message || 'Failed to save budget')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Budget Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Q1 2025 Budget"
            required
          />
        </div>
        <div>
          <Label htmlFor="fiscalYear">Fiscal Year *</Label>
          <Input
            id="fiscalYear"
            type="number"
            value={formData.fiscalYear}
            onChange={(e) => setFormData({ ...formData, fiscalYear: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Budget description..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="projectId">Project (Optional)</Label>
          <Select
            value={formData.projectId || undefined}
            onValueChange={(value) => setFormData({ ...formData, projectId: value || '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="programId">Program (Optional)</Label>
          <Select
            value={formData.programId || undefined}
            onValueChange={(value) => setFormData({ ...formData, programId: value || '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="INR">INR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="fiscalQuarter">Fiscal Quarter</Label>
          <Select
            value={formData.fiscalQuarter?.toString() || undefined}
            onValueChange={(value) =>
              setFormData({ ...formData, fiscalQuarter: value ? parseInt(value) : undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Q1</SelectItem>
              <SelectItem value="2">Q2</SelectItem>
              <SelectItem value="3">Q3</SelectItem>
              <SelectItem value="4">Q4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label>Select Budget Categories</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Choose the main categories you need to budget for. You can select from suggestions or add custom categories.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {MAIN_CATEGORY_SUGGESTIONS.map((suggestion) => {
          const isSelected = categories.some(c => c.name === suggestion.name)
          return (
            <Card
              key={suggestion.name}
              className={cn(
                "cursor-pointer transition-all hover:border-primary",
                isSelected && "border-primary bg-primary/5"
              )}
              onClick={() => toggleCategory(suggestion.name)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{suggestion.name}</div>
                    <div className="text-xs text-muted-foreground">{suggestion.code}</div>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-primary" />}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add custom category..."
          value={customCategoryName}
          onChange={(e) => setCustomCategoryName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
        />
        <Button type="button" onClick={addCustomCategory} variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Selected Categories ({categories.length}):</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge key={cat.name} variant="secondary">
                {cat.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderStep3 = () => {
    if (selectedCategoryIndex === null) {
      return (
        <div className="space-y-4">
          <div>
            <Label>Select Sub-Categories</Label>
            <p className="text-sm text-muted-foreground mb-4">
              For each category, select the sub-categories you need. Click on a category to configure its sub-categories.
            </p>
          </div>

          <div className="space-y-3">
            {categories.map((category, index) => {
              const suggestion = MAIN_CATEGORY_SUGGESTIONS.find(s => s.name === category.name)
              return (
                <Card
                  key={category.name}
                  className="cursor-pointer hover:border-primary"
                  onClick={() => setSelectedCategoryIndex(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {category.subCategories.filter(s => s.selected).length} sub-categories selected
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )
    }

    const category = categories[selectedCategoryIndex]
    const suggestion = MAIN_CATEGORY_SUGGESTIONS.find(s => s.name === category.name)

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategoryIndex(null)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h3 className="font-medium">Sub-Categories for {category.name}</h3>
            <p className="text-sm text-muted-foreground">Select or add sub-categories</p>
          </div>
        </div>

        {/* Show all sub-categories: suggested + custom */}
        <div className="space-y-4 mb-4">
          {/* Suggested sub-categories */}
          {suggestion && suggestion.subCategories.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2">Suggested Sub-Categories</Label>
              <div className="grid grid-cols-2 gap-2">
                {suggestion.subCategories.map((subName) => {
                  const isSelected = category.subCategories.some(s => s.name === subName && s.selected)
                  return (
                    <Card
                      key={subName}
                      className={cn(
                        "transition-all",
                        isSelected && "border-primary bg-primary/5"
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => toggleSubCategory(selectedCategoryIndex, subName)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{subName}</span>
                              {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </div>
                          </div>
                          {isSelected && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs whitespace-nowrap"
                              onClick={(e) => {
                                e.stopPropagation()
                                openMetricsDialog(selectedCategoryIndex, subName)
                              }}
                            >
                              Set Metrics
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custom sub-categories (already added) */}
          {category.subCategories.filter(sub => {
            // Show custom sub-categories that aren't in the suggestion list
            return !suggestion?.subCategories.includes(sub.name)
          }).length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2">Your Sub-Categories</Label>
                <div className="grid grid-cols-2 gap-2">
                  {category.subCategories
                    .filter(sub => !suggestion?.subCategories.includes(sub.name))
                    .map((subCategory) => {
                      const isSelected = subCategory.selected
                      return (
                        <Card
                          key={subCategory.name}
                          className={cn(
                            "transition-all",
                            isSelected && "border-primary bg-primary/5"
                          )}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => toggleSubCategory(selectedCategoryIndex, subCategory.name)}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{subCategory.name}</span>
                                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                                </div>
                              </div>
                              {isSelected && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openMetricsDialog(selectedCategoryIndex, subCategory.name)
                                  }}
                                >
                                  Set Metrics
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              </div>
            )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Add Custom Sub-Category</Label>
          <div className="flex gap-2">
            <Input
              id={`custom-sub-${selectedCategoryIndex}`}
              placeholder="Enter sub-category name..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement
                  if (input.value.trim()) {
                    addCustomSubCategory(selectedCategoryIndex, input.value)
                    input.value = ''
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                const input = document.getElementById(`custom-sub-${selectedCategoryIndex}`) as HTMLInputElement
                if (input && input.value.trim()) {
                  addCustomSubCategory(selectedCategoryIndex, input.value)
                  input.value = ''
                  input.focus() // Keep focus for quick additions
                }
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Type a name and press Enter or click Add. The sub-category will appear above.
          </p>
        </div>
      </div>
    )
  }


  const renderStep5 = () => {
    const monthList = months

    return (
      <div className="space-y-4">
        <div>
          <Label>Monthly Budget Template</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Fill in the monthly amounts for each sub-category. The totals will be calculated automatically.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full space-y-4">
            {categories.map((category) => {
              const isExpanded = expandedCategories.has(category.name)
              return (
                <Card key={category.name} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{category.name}</h3>
                      {category.code && (
                        <Badge variant="outline" className="text-xs">
                          {category.code}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditCategoryDialog(categories.findIndex(c => c.name === category.name))
                        }}
                        title="Edit category"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleCategoryExpansion(category.name)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {isExpanded && category.subCategories.filter(s => s.selected).map((subCategory) => {
                    const hasMetrics = subCategory.metrics?.customMetrics && subCategory.metrics.customMetrics.length > 0
                    return (
                      <div key={subCategory.name} className="mb-4 last:mb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium">{subCategory.name}</Label>
                            {subCategory.metrics?.formula && (
                              <Badge variant="outline" className="text-xs">
                                Formula: {subCategory.metrics.formula}
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Total: {getMonthlyTotalForSubCategory(category.name, subCategory.name).toLocaleString()} {formData.currency}
                          </span>
                        </div>

                        {/* Show metrics if defined, otherwise show single amount input */}
                        {hasMetrics ? (
                          <div className="space-y-3">
                            {(subCategory.metrics?.customMetrics ?? []).map((metric) => (
                              <div key={metric.name} className="space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Label className="text-xs font-medium">{metric.name}</Label>
                                  <span className="text-xs text-muted-foreground">({metric.unit})</span>
                                </div>
                                <div className="overflow-x-auto -mx-4 px-4">
                                  <div
                                    className="grid gap-1.5 pb-2"
                                    style={{
                                      gridTemplateColumns: `repeat(${monthList.length}, minmax(65px, 1fr))`
                                    }}
                                  >
                                    {monthList.map((month) => (
                                      <div key={month} className="space-y-0.5 min-w-[65px]">
                                        <Label className="text-[10px] text-muted-foreground truncate block leading-tight" title={month}>{month}</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="0"
                                          value={(() => {
                                            const val = getMetricValue(category.name, subCategory.name, metric.name, month)
                                            return val === '' || val === undefined || val === null ? '' : val
                                          })()}
                                          onChange={(e) => {
                                            const inputValue = e.target.value
                                            const value = inputValue === '' ? 0 : parseFloat(inputValue) || 0
                                            updateMetricValue(category.name, subCategory.name, metric.name, month, value)
                                          }}
                                          className="text-xs h-8 px-2 py-1 w-full"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {/* Show calculated total row if formula exists */}
                            {subCategory.metrics?.formula && (
                              <div className="space-y-1 pt-2 border-t">
                                <div className="flex items-center gap-2 mb-1">
                                  <Label className="text-xs font-semibold">Calculated Total</Label>
                                  <span className="text-xs text-muted-foreground">({formData.currency})</span>
                                </div>
                                <div className="overflow-x-auto -mx-4 px-4">
                                  <div
                                    className="grid gap-1.5 pb-2"
                                    style={{
                                      gridTemplateColumns: `repeat(${monthList.length}, minmax(65px, 1fr))`
                                    }}
                                  >
                                    {monthList.map((month) => {
                                      const calculatedValue = getCalculatedTotal(category.name, subCategory.name, month)
                                      return (
                                        <div key={month} className="space-y-0.5 min-w-[65px]">
                                          <Label className="text-[10px] text-muted-foreground truncate block leading-tight" title={month}>{month}</Label>
                                          <div className="text-xs h-8 px-2 py-1 w-full border rounded bg-primary/10 flex items-center justify-center font-semibold text-primary">
                                            {calculatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="overflow-x-auto -mx-4 px-4">
                            <div
                              className="grid gap-1.5 pb-2"
                              style={{
                                gridTemplateColumns: `repeat(${monthList.length}, minmax(65px, 1fr))`
                              }}
                            >
                              {monthList.map((month) => (
                                <div key={month} className="space-y-0.5 min-w-[65px]">
                                  <Label className="text-[10px] text-muted-foreground truncate block leading-tight" title={month}>{month}</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0"
                                    value={monthlyData[category.name]?.[`${subCategory.name}_${month}`] || ''}
                                    onChange={(e) => {
                                      const amount = parseFloat(e.target.value) || 0
                                      updateMonthlyAmount(category.name, subCategory.name, month, amount)
                                    }}
                                    className="text-xs h-8 px-2 py-1 w-full"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Category Total:</span>
                        <span>{getCategoryTotal(category.name).toLocaleString()} {formData.currency}</span>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>

        <Card className="p-4 bg-primary/5 border-primary">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Budget:</span>
            <span className="text-2xl font-bold">{getTotalBudget().toLocaleString()} {formData.currency}</span>
          </div>
        </Card>
      </div>
    )
  }

  const totalSteps = 4
  const stepTitles = [
    'Basic Information',
    'Select Categories',
    'Select Sub-Categories',
    'Monthly Template',
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {budgetId ? 'Edit Budget' : 'Create New Budget'}
          </DialogTitle>
          <DialogDescription>
            {budgetId ? 'Update budget details' : `Step ${step} of ${totalSteps}: ${stepTitles[step - 1]}`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        {!budgetId && (
          <div className="flex items-center gap-2 mb-6">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const stepNumber = i + 1
              const isCompleted = stepNumber < step
              const isCurrent = stepNumber === step
              const isClickable = stepNumber <= step // Can only click on current or previous steps

              return (
                <div key={i} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => isClickable && setStep(stepNumber)}
                    disabled={!isClickable}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground cursor-pointer hover:bg-primary/90 hover:scale-110"
                        : isCurrent
                          ? "border-primary text-primary cursor-default"
                          : "border-muted text-muted-foreground cursor-not-allowed",
                      isClickable && !isCurrent && "hover:shadow-md"
                    )}
                    title={isClickable ? `Go to step ${stepNumber}: ${stepTitles[i]}` : undefined}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                  </button>
                  {i < totalSteps - 1 && (
                    <div
                      className={cn(
                        "h-1 flex-1 mx-2 transition-colors",
                        isCompleted ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="py-4">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep5()}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={step === 1 ? onClose : handleBack}
              disabled={isLoading}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            <div className="flex gap-2">
              {step < totalSteps ? (
                <Button type="button" onClick={handleNext} disabled={isLoading}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Budget'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Metrics Configuration Dialog */}
      <Dialog open={metricsDialogOpen} onOpenChange={setMetricsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set Metrics for {selectedSubCategoryForMetrics}</DialogTitle>
            <DialogDescription>
              Configure the metrics, types, and frequency for this sub-category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select
                value={metricsConfig.type}
                onValueChange={(value) => setMetricsConfig({ ...metricsConfig, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="resource-based">Resource based</SelectItem>
                  <SelectItem value="transaction-based">Transaction based</SelectItem>
                  <SelectItem value="subscription-based">Subscription based</SelectItem>
                  <SelectItem value="contract-based">Contract based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                value={metricsConfig.frequency}
                onValueChange={(value) => setMetricsConfig({ ...metricsConfig, frequency: value, selectedMonths: [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Month selection for Seasonal and One-time */}
            {(metricsConfig.frequency === 'seasonal' || metricsConfig.frequency === 'one-time') && (
              <div>
                <Label>Select Months *</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                    <Button
                      key={month}
                      type="button"
                      variant={metricsConfig.selectedMonths.includes(month) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleMonth(month)}
                      className="h-8"
                    >
                      {month}
                    </Button>
                  ))}
                </div>
                {metricsConfig.selectedMonths.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: {metricsConfig.selectedMonths.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Define Your Metrics Section */}
            <div className="space-y-3 pt-4 border-t">
              <div>
                <Label className="text-base font-semibold">Define Your Metrics</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Add custom metrics to track for this sub-category
                </p>
              </div>

              <div className="space-y-2">
                {metricsConfig.customMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex-1">
                      <span className="font-medium text-sm">{metric.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">({metric.unit})</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomMetric(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Metric name"
                  value={newMetricName}
                  onChange={(e) => setNewMetricName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Unit (e.g., USD, hours)"
                  value={newMetricUnit}
                  onChange={(e) => setNewMetricUnit(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomMetric}
                  disabled={!newMetricName.trim() || !newMetricUnit.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Named Calculations (DAX-style) */}
              {metricsConfig.customMetrics.length > 0 && (
                <div className="space-y-3 pt-3 border-t">
                  <div>
                    <Label className="text-sm font-semibold">Named Calculations (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Create reusable calculations using your metrics. These can be used in the main formula below.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {(metricsConfig.namedCalculations || []).map((calc, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{calc.name}</div>
                            {calc.description && (
                              <p className="text-xs text-muted-foreground mt-1">{calc.description}</p>
                            )}
                            <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">{calc.formula}</code>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNamedCalculation(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-2 p-3 border rounded">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Calculation name"
                        value={newCalculationName}
                        onChange={(e) => setNewCalculationName(e.target.value)}
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={newCalculationDescription}
                        onChange={(e) => setNewCalculationDescription(e.target.value)}
                      />
                    </div>
                    <Textarea
                      placeholder="Formula (e.g., WOIDs * RatePerWOID)"
                      value={newCalculationFormula}
                      onChange={(e) => setNewCalculationFormula(e.target.value)}
                      rows={2}
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addNamedCalculation}
                      disabled={!newCalculationName.trim() || !newCalculationFormula.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Calculation
                    </Button>
                  </div>
                </div>
              )}

              {/* Formula Builder */}
              {metricsConfig.customMetrics.length > 0 && (
                <div className="space-y-2 pt-3 border-t">
                  <div>
                    <Label className="text-sm font-semibold">Calculation Formula (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Define how to calculate the total using your metrics and named calculations. Use metric/calculation names as variables.
                      <br />
                      Example: <code className="text-xs bg-muted px-1 py-0.5 rounded">WOIDs * RatePerWOID + BaseRevenue</code>
                    </p>
                  </div>
                  <div className="space-y-2 relative">
                    <Textarea
                      ref={formulaTextareaRef}
                      placeholder="e.g., WOIDs * RatePerWOID + (CloseOutPercent / 100) * WOIDs * CloseOutRate"
                      value={metricsConfig.formula}
                      onChange={(e) => handleFormulaChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown' && formulaAutocompleteOpen && formulaSuggestions.length > 0) {
                          e.preventDefault()
                          insertSuggestion(formulaSuggestions[0])
                        } else if (e.key === 'Tab' && formulaAutocompleteOpen && formulaSuggestions.length > 0) {
                          e.preventDefault()
                          insertSuggestion(formulaSuggestions[0])
                        }
                      }}
                      rows={3}
                      className="font-mono text-sm"
                    />
                    {/* Autocomplete dropdown */}
                    {formulaAutocompleteOpen && formulaSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-auto">
                        {formulaSuggestions.map((suggestion) => (
                          <div
                            key={suggestion}
                            className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                            onClick={() => insertSuggestion(suggestion)}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-muted-foreground">Insert:</span>
                      {[...(metricsConfig.customMetrics || []), ...(metricsConfig.namedCalculations || []).map(c => ({ name: c.name }))].map((item) => (
                        <Button
                          key={item.name}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => insertAtCursor(item.name)}
                        >
                          {item.name}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => insertAtCursor(' * ')}
                      >
                        ×
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => insertAtCursor(' + ')}
                      >
                        +
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => insertAtCursor(' / ')}
                      >
                        ÷
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => insertAtCursor(' - ')}
                      >
                        −
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          const textarea = formulaTextareaRef.current
                          if (!textarea) return
                          const start = textarea.selectionStart
                          const end = textarea.selectionEnd
                          const currentValue = metricsConfig.formula
                          const selectedText = currentValue.substring(start, end)
                          const newValue = currentValue.substring(0, start) + '(' + selectedText + ')' + currentValue.substring(end)
                          setMetricsConfig({ ...metricsConfig, formula: newValue })
                          setTimeout(() => {
                            textarea.focus()
                            if (selectedText) {
                              textarea.setSelectionRange(start + 1, start + 1 + selectedText.length)
                            } else {
                              textarea.setSelectionRange(start + 1, start + 1)
                            }
                          }, 0)
                        }}
                      >
                        ( )
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMetricsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveMetrics}
              disabled={!metricsConfig.type || !metricsConfig.frequency ||
                ((metricsConfig.frequency === 'seasonal' || metricsConfig.frequency === 'one-time') && metricsConfig.selectedMonths.length === 0)}
            >
              Save Metrics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editCategoryDialogOpen} onOpenChange={setEditCategoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Category</DialogTitle>
            <DialogDescription>
              Define how this category is structured, allocated, and distributed over time
            </DialogDescription>
          </DialogHeader>

          <Tabs value={editCategoryTab} onValueChange={(v) => setEditCategoryTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
              <TabsTrigger value="timing">Timing</TabsTrigger>
              <TabsTrigger value="subcategories">Sub-Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-category-name">Category Name *</Label>
                <Input
                  id="edit-category-name"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder="e.g., Revenue"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-category-code">Unique Category Code *</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="edit-category-code"
                    value={editCategoryCode}
                    onChange={(e) => setEditCategoryCode(e.target.value.toUpperCase())}
                    placeholder="Auto-generated if empty"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (editingCategoryIndex !== null) {
                        const allCategoryCodes = categories
                          .map((c, idx) => idx === editingCategoryIndex ? null : (c.code || ''))
                          .filter(Boolean) as string[]
                        const autoCode = generateUniqueCode(editCategoryName || categories[editingCategoryIndex].name, allCategoryCodes)
                        setEditCategoryCode(autoCode)
                      }
                    }}
                    title="Auto-generate unique code"
                  >
                    Auto
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Must be unique across all categories. Auto-generated if left empty.
                </p>
              </div>
              <div>
                <Label htmlFor="edit-category-description">Description</Label>
                <Textarea
                  id="edit-category-description"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Describe what this category includes..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-category-notes">Internal Notes (Optional)</Label>
                <Textarea
                  id="edit-category-notes"
                  value={categoryNotes}
                  onChange={(e) => setCategoryNotes(e.target.value)}
                  placeholder="Add any internal notes or reminders about this category..."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  These notes are only visible to you and your team
                </p>
              </div>
            </TabsContent>

            <TabsContent value="structure" className="space-y-4 mt-4">
              <div>
                <Label>Category Structure Type</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  How is this category organized?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Card
                    className={cn(
                      "cursor-pointer transition-all",
                      categoryStructure === 'hierarchical' && "border-primary bg-primary/5"
                    )}
                    onClick={() => setCategoryStructure('hierarchical')}
                  >
                    <CardContent className="p-4">
                      <div className="font-medium mb-1">Hierarchical</div>
                      <p className="text-xs text-muted-foreground">
                        Organized in levels (Category → Sub-Category)
                      </p>
                    </CardContent>
                  </Card>
                  <Card
                    className={cn(
                      "cursor-pointer transition-all",
                      categoryStructure === 'flat' && "border-primary bg-primary/5"
                    )}
                    onClick={() => setCategoryStructure('flat')}
                  >
                    <CardContent className="p-4">
                      <div className="font-medium mb-1">Flat</div>
                      <p className="text-xs text-muted-foreground">
                        Single level, no sub-divisions
                      </p>
                    </CardContent>
                  </Card>
                  <Card
                    className={cn(
                      "cursor-pointer transition-all",
                      categoryStructure === 'matrix' && "border-primary bg-primary/5"
                    )}
                    onClick={() => setCategoryStructure('matrix')}
                  >
                    <CardContent className="p-4">
                      <div className="font-medium mb-1">Matrix</div>
                      <p className="text-xs text-muted-foreground">
                        Organized by multiple dimensions
                      </p>
                    </CardContent>
                  </Card>
                  <Card
                    className={cn(
                      "cursor-pointer transition-all",
                      categoryStructure === 'custom' && "border-primary bg-primary/5"
                    )}
                    onClick={() => setCategoryStructure('custom')}
                  >
                    <CardContent className="p-4">
                      <div className="font-medium mb-1">Custom</div>
                      <p className="text-xs text-muted-foreground">
                        Define your own structure
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="has-sub-categories"
                  checked={hasSubCategories}
                  onCheckedChange={(checked) => setHasSubCategories(checked === true)}
                />
                <Label htmlFor="has-sub-categories" className="cursor-pointer">
                  This category has sub-categories
                </Label>
              </div>

              {/* Custom Structure Builder */}
              {categoryStructure === 'custom' && (
                <div className="mt-6 space-y-6 pt-6 border-t">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label className="text-base font-semibold">Define Custom Structure</Label>
                        <p className="text-sm text-muted-foreground">
                          Create your own hierarchy levels and add custom fields
                        </p>
                      </div>
                    </div>

                    {/* Custom Levels */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2">Structure Levels</Label>
                        <p className="text-xs text-muted-foreground mb-3">
                          Define the hierarchy levels for this category (e.g., Category → Department → Team → Project)
                        </p>
                        <div className="space-y-2">
                          {customLevels.map((level, index) => (
                            <Card key={level.name} className="p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{index + 1}</Badge>
                                    <Input
                                      value={level.label}
                                      onChange={(e) => {
                                        const updated = [...customLevels]
                                        updated[index].label = e.target.value
                                        setCustomLevels(updated)
                                      }}
                                      placeholder="Level name (e.g., Department)"
                                      className="w-48"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={level.required}
                                      onCheckedChange={(checked) => {
                                        const updated = [...customLevels]
                                        updated[index].required = checked === true
                                        setCustomLevels(updated)
                                      }}
                                    />
                                    <Label className="text-xs cursor-pointer">Required</Label>
                                  </div>
                                </div>
                                {customLevels.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setCustomLevels(customLevels.filter((_, i) => i !== index))
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Input
                            placeholder="Level name"
                            value={newLevelName}
                            onChange={(e) => setNewLevelName(e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Display label"
                            value={newLevelLabel}
                            onChange={(e) => setNewLevelLabel(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (newLevelName.trim() && newLevelLabel.trim()) {
                                setCustomLevels([
                                  ...customLevels,
                                  {
                                    name: newLevelName.trim().toLowerCase().replace(/\s+/g, '_'),
                                    label: newLevelLabel.trim(),
                                    required: false,
                                  },
                                ])
                                setNewLevelName('')
                                setNewLevelLabel('')
                              }
                            }}
                            disabled={!newLevelName.trim() || !newLevelLabel.trim()}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Level
                          </Button>
                        </div>
                      </div>

                      {/* Custom Fields */}
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <Label className="text-sm font-medium">Custom Fields</Label>
                            <p className="text-xs text-muted-foreground">
                              Add additional fields to track for this category (e.g., Region, Cost Center, etc.)
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {customFields.map((field, index) => (
                            <Card key={field.name} className="p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Label className="text-xs font-medium">{field.label}</Label>
                                      <Badge variant="outline" className="text-xs">
                                        {field.type}
                                      </Badge>
                                    </div>
                                    {field.type === 'select' && field.options && (
                                      <div className="text-xs text-muted-foreground">
                                        Options: {field.options.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setCustomFields(customFields.filter((_, i) => i !== index))
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                        <Card className="p-4 mt-3 border-dashed">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Field Name</Label>
                                <Input
                                  placeholder="e.g., region"
                                  value={newFieldName}
                                  onChange={(e) => setNewFieldName(e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Display Label</Label>
                                <Input
                                  placeholder="e.g., Region"
                                  value={newFieldLabel}
                                  onChange={(e) => setNewFieldLabel(e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Field Type</Label>
                                <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as any)}>
                                  <SelectTrigger className="text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="select">Dropdown</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {newFieldType === 'select' && (
                                <div>
                                  <Label className="text-xs">Options (comma-separated)</Label>
                                  <Input
                                    placeholder="e.g., North, South, East, West"
                                    value={newFieldOptions}
                                    onChange={(e) => setNewFieldOptions(e.target.value)}
                                    className="text-sm"
                                  />
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (newFieldName.trim() && newFieldLabel.trim()) {
                                  setCustomFields([
                                    ...customFields,
                                    {
                                      name: newFieldName.trim().toLowerCase().replace(/\s+/g, '_'),
                                      type: newFieldType,
                                      label: newFieldLabel.trim(),
                                      options: newFieldType === 'select' && newFieldOptions.trim()
                                        ? newFieldOptions.split(',').map(o => o.trim())
                                        : undefined,
                                    },
                                  ])
                                  setNewFieldName('')
                                  setNewFieldLabel('')
                                  setNewFieldOptions('')
                                  setNewFieldType('text')
                                }
                              }}
                              disabled={!newFieldName.trim() || !newFieldLabel.trim() || (newFieldType === 'select' && !newFieldOptions.trim())}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Custom Field
                            </Button>
                          </div>
                        </Card>
                      </div>

                      {/* Structure Preview */}
                      <div className="pt-4 border-t">
                        <Label className="text-sm font-medium mb-2">Structure Preview</Label>
                        <Card className="p-3 bg-muted/50">
                          <div className="text-sm space-y-1">
                            <div className="font-medium">Your Custom Structure:</div>
                            <div className="text-muted-foreground">
                              {customLevels.map((level, idx) => (
                                <div key={level.name} className="ml-2">
                                  {idx > 0 && <span className="text-muted-foreground">→ </span>}
                                  <span className={level.required ? 'font-semibold' : ''}>
                                    {level.label}
                                    {level.required && <span className="text-red-500 ml-1">*</span>}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {customFields.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="font-medium mb-1">Custom Fields:</div>
                                <div className="flex flex-wrap gap-2">
                                  {customFields.map((field) => (
                                    <Badge key={field.name} variant="outline" className="text-xs">
                                      {field.label} ({field.type})
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="allocation" className="space-y-4 mt-4">
              <div>
                <Label>Budget Allocation Method</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  How should the budget be allocated for this category?
                </p>
                <Select value={allocationMethod} onValueChange={(v) => setAllocationMethod(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage of Total Budget</SelectItem>
                    <SelectItem value="formula">Formula-Based Calculation</SelectItem>
                    <SelectItem value="historical">Based on Historical Data</SelectItem>
                    <SelectItem value="forecast">Forecast-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {allocationMethod === 'percentage' && (
                <div>
                  <Label htmlFor="allocation-percentage">Percentage of Total Budget</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="allocation-percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="e.g., 25.5"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              )}

              {allocationMethod === 'formula' && (
                <div>
                  <Label htmlFor="allocation-formula">Formula</Label>
                  <Textarea
                    id="allocation-formula"
                    placeholder="e.g., Revenue * 0.15 + BaseAmount"
                    rows={2}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use variables like Revenue, TotalBudget, or other category names
                  </p>
                </div>
              )}

              {allocationMethod === 'historical' && (
                <div className="space-y-3">
                  <div>
                    <Label>Historical Period</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-year">Last Year</SelectItem>
                        <SelectItem value="last-quarter">Last Quarter</SelectItem>
                        <SelectItem value="ytd">Year to Date</SelectItem>
                        <SelectItem value="custom">Custom Period</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="apply-growth" />
                    <Label htmlFor="apply-growth" className="cursor-pointer">
                      Apply growth/inflation adjustment
                    </Label>
                  </div>
                </div>
              )}

              {allocationMethod === 'forecast' && (
                <div>
                  <Label>Forecast Model</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear Trend</SelectItem>
                      <SelectItem value="exponential">Exponential Growth</SelectItem>
                      <SelectItem value="seasonal">Seasonal Pattern</SelectItem>
                      <SelectItem value="ml">Machine Learning Model</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timing" className="space-y-4 mt-4">
              <div>
                <Label>Time Distribution Pattern</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  How should the budget be distributed across the time period?
                </p>
                <Select value={timeDistribution} onValueChange={(v) => setTimeDistribution(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="even">Even Distribution</SelectItem>
                    <SelectItem value="custom">Custom Monthly Amounts</SelectItem>
                    <SelectItem value="seasonal">Seasonal Pattern</SelectItem>
                    <SelectItem value="front-loaded">Front-Loaded (More at Start)</SelectItem>
                    <SelectItem value="back-loaded">Back-Loaded (More at End)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {timeDistribution === 'seasonal' && (
                <div>
                  <Label>Seasonal Pattern</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => (
                      <div key={quarter} className="space-y-1">
                        <Label className="text-xs">{quarter}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="%"
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter percentage distribution for each quarter (should total 100%)
                  </p>
                </div>
              )}

              {timeDistribution === 'front-loaded' && (
                <div>
                  <Label>Front-Loading Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="e.g., 40"
                    />
                    <span className="text-sm text-muted-foreground">% in first half</span>
                  </div>
                </div>
              )}

              {timeDistribution === 'back-loaded' && (
                <div>
                  <Label>Back-Loading Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="e.g., 60"
                    />
                    <span className="text-sm text-muted-foreground">% in second half</span>
                  </div>
                </div>
              )}

              {timeDistribution === 'custom' && (
                <div>
                  <Label>Custom Distribution</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    You can set custom amounts in the Monthly Template step
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="subcategories" className="space-y-4 mt-4">
              {editingCategoryIndex !== null && categories[editingCategoryIndex] && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Sub-Categories</Label>
                      <p className="text-sm text-muted-foreground">
                        Manage sub-categories for this category. Each sub-category has a unique code.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (editingCategoryIndex !== null) {
                          const input = prompt('Enter sub-category name:')
                          if (input?.trim()) {
                            addCustomSubCategory(editingCategoryIndex, input.trim())
                          }
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Sub-Category
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {categories[editingCategoryIndex].subCategories.map((subCat, idx) => (
                      <Card key={idx} className="p-3">
                        {editingSubCategoryIndex === idx ? (
                          // Edit mode
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs">Sub-Category Name *</Label>
                              <Input
                                value={editSubCategoryName}
                                onChange={(e) => setEditSubCategoryName(e.target.value)}
                                placeholder="e.g., Product Sales"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Unique Code *</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  value={editSubCategoryCode}
                                  onChange={(e) => setEditSubCategoryCode(e.target.value.toUpperCase())}
                                  placeholder="Auto-generated if empty"
                                  className="font-mono"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (editingCategoryIndex !== null) {
                                      const allSubCategoryCodes = categories
                                        .flatMap((c, catIdx) =>
                                          c.subCategories
                                            .map((sc, subIdx) =>
                                              (catIdx === editingCategoryIndex && subIdx === editingSubCategoryIndex)
                                                ? null
                                                : (sc.code || '')
                                            )
                                        )
                                        .filter(Boolean) as string[]
                                      const autoCode = generateUniqueCode(editSubCategoryName || subCat.name, allSubCategoryCodes)
                                      setEditSubCategoryCode(autoCode)
                                    }
                                  }}
                                  title="Auto-generate unique code"
                                >
                                  Auto
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Must be unique across all sub-categories
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingSubCategoryIndex(null)
                                  setEditSubCategoryName('')
                                  setEditSubCategoryCode('')
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={saveSubCategoryEdit}
                                disabled={!editSubCategoryName.trim()}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <Checkbox
                                checked={subCat.selected}
                                onCheckedChange={(checked) => {
                                  if (editingCategoryIndex !== null) {
                                    toggleSubCategory(editingCategoryIndex, subCat.name)
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{subCat.name}</span>
                                  {subCat.code && (
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {subCat.code}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditSubCategoryDialog(idx)}
                                title="Edit sub-category"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (editingCategoryIndex !== null) {
                                    openMetricsDialog(editingCategoryIndex, subCat.name)
                                  }
                                }}
                                title="Configure metrics"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {categories[editingCategoryIndex].subCategories.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No sub-categories yet</p>
                      <p className="text-sm">Click "Add Sub-Category" to create one</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditCategoryDialogOpen(false)
                setEditingCategoryIndex(null)
                setEditCategoryName('')
                setEditCategoryCode('')
                setCategoryDescription('')
                setCategoryNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveCategoryEdit}
              disabled={!editCategoryName.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
