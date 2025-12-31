'use client'

import { useState, useEffect } from 'react'
import { DataFlowParser, DATAFLOW_FUNCTIONS } from '@/lib/formula-parser'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, CheckCircle2, XCircle } from 'lucide-react'

interface FormulaBuilderProps {
  columns: string[]
  onFormulaChange: (formula: string, sql: string, isValid: boolean) => void
  initialFormula?: string
  showSQL?: boolean
}

export function FormulaBuilder({ 
  columns, 
  onFormulaChange, 
  initialFormula = '',
  showSQL = true 
}: FormulaBuilderProps) {
  const [formula, setFormula] = useState(initialFormula)
  const [sql, setSql] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  
  const parser = new DataFlowParser()
  
  useEffect(() => {
    if (initialFormula) {
      handleFormulaChange(initialFormula)
    }
  }, [initialFormula])
  
  function handleFormulaChange(value: string) {
    setFormula(value)
    setError(null)
    
    if (!value.trim()) {
      setSql('')
      setIsValid(false)
      onFormulaChange('', '', false)
      return
    }
    
    try {
      const result = parser.parse(value)
      setSql(result.sql)
      setIsValid(true)
      onFormulaChange(value, result.sql, true)
    } catch (err: any) {
      setError(err.message)
      setSql('')
      setIsValid(false)
      onFormulaChange(value, '', false)
    }
  }
  
  function insertFunction(funcName: string) {
    const func = parser.getFunction(funcName)
    if (!func) return
    
    // Insert function at cursor position
    const cursorPos = (document.activeElement as HTMLInputElement)?.selectionStart || formula.length
    const before = formula.slice(0, cursorPos)
    const after = formula.slice(cursorPos)
    
    // Insert function with placeholder
    const newFormula = `${before}${func.syntax}${after}`
    setFormula(newFormula)
    handleFormulaChange(newFormula)
    
    // Focus back on input
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement
      if (input) {
        const newPos = cursorPos + func.syntax.length
        input.setSelectionRange(newPos, newPos)
        input.focus()
      }
    }, 0)
  }
  
  function insertColumn(columnName: string) {
    const cursorPos = (document.activeElement as HTMLInputElement)?.selectionStart || formula.length
    const before = formula.slice(0, cursorPos)
    const after = formula.slice(cursorPos)
    
    const newFormula = `${before}${columnName}${after}`
    setFormula(newFormula)
    handleFormulaChange(newFormula)
  }
  
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">DataFlow Formula</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="h-6 w-6 p-0"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          {isValid && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {error && <XCircle className="h-4 w-4 text-red-500" />}
        </div>
        
        <Input
          type="text"
          value={formula}
          onChange={(e) => handleFormulaChange(e.target.value)}
          placeholder="TOTAL(amount) or ADD(price, tax)"
          className={`font-mono ${isValid ? 'border-green-500' : error ? 'border-red-500' : ''}`}
        />
        
        {error && (
          <div className="text-sm text-red-500 mt-1">{error}</div>
        )}
        
        {isValid && (
          <div className="text-sm text-green-600 mt-1">
            ✓ Valid DataFlow formula
          </div>
        )}
      </div>
      
      {showSQL && sql && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Generated SQL</label>
          <div className="p-2 bg-muted rounded text-sm font-mono mt-1">
            {sql}
          </div>
        </div>
      )}
      
      {showHelp && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">DataFlow Functions</CardTitle>
            <CardDescription className="text-xs">
              Your custom formula language (different from Power BI's DAX)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {DATAFLOW_FUNCTIONS.map((func) => (
                <div
                  key={func.name}
                  className="p-2 border rounded hover:bg-muted cursor-pointer"
                  onClick={() => insertFunction(func.name)}
                >
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono">{func.syntax}</code>
                    {func.isAggregate && (
                      <Badge variant="secondary" className="text-xs">Aggregate</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {func.description}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Example: <code>{func.example}</code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div>
        <label className="text-sm font-medium mb-2 block">Available Columns</label>
        <div className="flex flex-wrap gap-2">
          {columns.map((col) => (
            <Button
              key={col}
              variant="outline"
              size="sm"
              onClick={() => insertColumn(col)}
              className="text-xs"
            >
              {col}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

