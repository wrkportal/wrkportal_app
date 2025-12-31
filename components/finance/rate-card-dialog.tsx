'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface RateCardDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  rateCardId?: string
}

interface RateItem {
  role: string
  skillLevel?: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'EXPERT'
  rate: number
  unit: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'FIXED'
  description?: string
}

export function RateCardDialog({ open, onClose, onSuccess, rateCardId }: RateCardDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [items, setItems] = useState<RateItem[]>([
    { role: '', rate: 0, unit: 'HOUR' }
  ])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      if (rateCardId) {
        loadRateCard()
      } else {
        resetForm()
        // Set default effective date to today
        setEffectiveDate(new Date().toISOString().split('T')[0])
      }
    }
  }, [open, rateCardId])

  const loadRateCard = async () => {
    try {
      const response = await fetch(`/api/finance/rate-cards/${rateCardId}`)
      if (response.ok) {
        const data = await response.json()
        const rc = data.rateCard
        setName(rc.name)
        setDescription(rc.description || '')
        setEffectiveDate(new Date(rc.effectiveDate).toISOString().split('T')[0])
        setExpiryDate(rc.expiryDate ? new Date(rc.expiryDate).toISOString().split('T')[0] : '')
        setCurrency(rc.currency)
        setItems(rc.items.map((item: any) => ({
          role: item.role,
          skillLevel: item.skillLevel,
          rate: Number(item.rate),
          unit: item.unit,
          description: item.description || '',
        })))
      }
    } catch (error) {
      console.error('Error loading rate card:', error)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setEffectiveDate(new Date().toISOString().split('T')[0])
    setExpiryDate('')
    setCurrency('USD')
    setItems([{ role: '', rate: 0, unit: 'HOUR' }])
  }

  const addItem = () => {
    setItems([...items, { role: '', rate: 0, unit: 'HOUR' }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof RateItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSave = async () => {
    if (!name || !effectiveDate) {
      alert('Please fill in required fields')
      return
    }

    if (items.length === 0 || items.some(item => !item.role || item.rate <= 0)) {
      alert('Please add at least one valid rate item')
      return
    }

    setIsLoading(true)
    try {
      const url = rateCardId
        ? `/api/finance/rate-cards/${rateCardId}`
        : '/api/finance/rate-cards'
      const method = rateCardId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          effectiveDate,
          expiryDate: expiryDate || undefined,
          currency,
          items: items.map(item => ({
            role: item.role,
            skillLevel: item.skillLevel,
            rate: item.rate,
            unit: item.unit,
            description: item.description,
          })),
        }),
      })

      if (response.ok) {
        onSuccess()
        handleClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save rate card')
      }
    } catch (error) {
      console.error('Error saving rate card:', error)
      alert('Failed to save rate card')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rateCardId ? 'Edit Rate Card' : 'Create Rate Card'}</DialogTitle>
          <DialogDescription>
            Define billing rates by role and skill level
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 2024 Standard Rates"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="effectiveDate">Effective Date *</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rate Items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-muted/50 rounded-lg">
                  <div className="col-span-3">
                    <Label className="text-xs">Role *</Label>
                    <Input
                      value={item.role}
                      onChange={(e) => updateItem(index, 'role', e.target.value)}
                      placeholder="e.g., Developer"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Skill Level</Label>
                    <Select
                      value={item.skillLevel || ''}
                      onValueChange={(v) => updateItem(index, 'skillLevel', v || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JUNIOR">Junior</SelectItem>
                        <SelectItem value="MID">Mid</SelectItem>
                        <SelectItem value="SENIOR">Senior</SelectItem>
                        <SelectItem value="LEAD">Lead</SelectItem>
                        <SelectItem value="EXPERT">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Rate *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Unit *</Label>
                    <Select
                      value={item.unit}
                      onValueChange={(v: any) => updateItem(index, 'unit', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOUR">Hour</SelectItem>
                        <SelectItem value="DAY">Day</SelectItem>
                        <SelectItem value="WEEK">Week</SelectItem>
                        <SelectItem value="MONTH">Month</SelectItem>
                        <SelectItem value="FIXED">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Rate Card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

