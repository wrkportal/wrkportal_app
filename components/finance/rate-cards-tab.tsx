'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit, Trash2, Eye, Download, Calendar } from 'lucide-react'
import { RateCardDialog } from './rate-card-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function RateCardsTab() {
  const [rateCards, setRateCards] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rateCardDialogOpen, setRateCardDialogOpen] = useState(false)
  const [selectedRateCard, setSelectedRateCard] = useState<any>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingRateCard, setEditingRateCard] = useState<string | undefined>()
  const [showActiveOnly, setShowActiveOnly] = useState(false)

  useEffect(() => {
    loadRateCards()
  }, [showActiveOnly])

  const loadRateCards = async () => {
    try {
      setIsLoading(true)
      const params = showActiveOnly ? '?active=true' : ''
      const response = await fetch(`/api/finance/rate-cards${params}`)
      if (response.ok) {
        const data = await response.json()
        setRateCards(data.rateCards || [])
      }
    } catch (error) {
      console.error('Error loading rate cards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewRateCard = async (rateCardId: string) => {
    try {
      const response = await fetch(`/api/finance/rate-cards/${rateCardId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedRateCard(data.rateCard)
        setViewDialogOpen(true)
      }
    } catch (error) {
      console.error('Error loading rate card:', error)
    }
  }

  const handleDeleteRateCard = async (rateCardId: string) => {
    if (!confirm('Are you sure you want to delete this rate card?')) return

    try {
      const response = await fetch(`/api/finance/rate-cards/${rateCardId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadRateCards()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete rate card')
      }
    } catch (error) {
      alert('Failed to delete rate card')
    }
  }

  const handleExport = () => {
    window.open('/api/finance/export?type=RATE_CARD&format=excel', '_blank')
  }

  const isActive = (rateCard: any) => {
    const today = new Date()
    const effective = new Date(rateCard.effectiveDate)
    const expiry = rateCard.expiryDate ? new Date(rateCard.expiryDate) : null
    return effective <= today && (!expiry || expiry >= today)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rate Cards</CardTitle>
              <CardDescription>Billing rates by role and skill level</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button onClick={() => {
                setEditingRateCard(undefined)
                setRateCardDialogOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                New Rate Card
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button
              variant={showActiveOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowActiveOnly(!showActiveOnly)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {showActiveOnly ? 'Show All' : 'Show Active Only'}
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading rate cards...</div>
          ) : rateCards.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No rate cards found</p>
              <Button onClick={() => setRateCardDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Rate Card
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {rateCards.map((rateCard) => {
                const active = isActive(rateCard)
                const itemCount = rateCard.items?.length || 0

                return (
                  <div key={rateCard.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{rateCard.name}</p>
                          {active && <Badge className="bg-green-500">Active</Badge>}
                          {!active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        {rateCard.description && (
                          <p className="text-sm text-muted-foreground mb-2">{rateCard.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Effective: {new Date(rateCard.effectiveDate).toLocaleDateString()}
                          </span>
                          {rateCard.expiryDate && (
                            <span>
                              Expires: {new Date(rateCard.expiryDate).toLocaleDateString()}
                            </span>
                          )}
                          <span>Currency: {rateCard.currency}</span>
                          <span>{itemCount} rate{itemCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    {rateCard.items && rateCard.items.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Sample Rates:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {rateCard.items.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="text-xs p-2 bg-muted rounded">
                              <p className="font-medium">{item.role}</p>
                              <p className="text-muted-foreground">
                                {formatCurrency(Number(item.rate))} / {item.unit.toLowerCase()}
                              </p>
                            </div>
                          ))}
                          {rateCard.items.length > 3 && (
                            <div className="text-xs p-2 bg-muted rounded flex items-center justify-center">
                              +{rateCard.items.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRateCard(rateCard.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRateCard(rateCard.id)
                          setRateCardDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRateCard(rateCard.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <RateCardDialog
        open={rateCardDialogOpen}
        onClose={() => {
          setRateCardDialogOpen(false)
          setEditingRateCard(undefined)
        }}
        onSuccess={() => {
          loadRateCards()
          setRateCardDialogOpen(false)
          setEditingRateCard(undefined)
        }}
        rateCardId={editingRateCard}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRateCard?.name}</DialogTitle>
            <DialogDescription>Rate card details</DialogDescription>
          </DialogHeader>
          {selectedRateCard && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Effective Date</p>
                  <p className="font-medium">{new Date(selectedRateCard.effectiveDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <p className="font-medium">
                    {selectedRateCard.expiryDate
                      ? new Date(selectedRateCard.expiryDate).toLocaleDateString()
                      : 'No expiry'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="font-medium">{selectedRateCard.currency}</p>
                </div>
              </div>

              {selectedRateCard.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p>{selectedRateCard.description}</p>
                </div>
              )}

              {selectedRateCard.items && selectedRateCard.items.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Rate Items</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Skill Level</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRateCard.items.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{item.role}</TableCell>
                          <TableCell>
                            {item.skillLevel ? (
                              <Badge variant="outline">{item.skillLevel}</Badge>
                            ) : (
                              <span className="text-muted-foreground">Any</span>
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(Number(item.rate))}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.description || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

