'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Award, Plus, Search, Edit, CheckCircle, Clock, XCircle, DollarSign, Calendar, MoreVertical, Eye, Mail, FileText, X, Download } from 'lucide-react'
import { RecruitmentPageLayout } from '@/components/recruitment/recruitment-page-layout'

interface Offer {
  id: string
  candidateName: string
  jobTitle: string
  offerAmount: string
  status: string
  extendedDate: string
  responseDate: string | null
  notes: string | null
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    candidateName: '',
    jobTitle: '',
    offerAmount: '',
    status: 'PENDING',
    notes: '',
  })

  useEffect(() => {
    fetchOffers()
  }, [])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      // Mock data
      const mockOffers: Offer[] = [
        {
          id: '1',
          candidateName: 'John Doe',
          jobTitle: 'Software Engineer',
          offerAmount: '$120,000',
          status: 'PENDING',
          extendedDate: new Date().toISOString(),
          responseDate: null,
          notes: 'Waiting for candidate response',
        },
        {
          id: '2',
          candidateName: 'Jane Smith',
          jobTitle: 'Product Manager',
          offerAmount: '$150,000',
          status: 'ACCEPTED',
          extendedDate: new Date(Date.now() - 172800000).toISOString(),
          responseDate: new Date(Date.now() - 86400000).toISOString(),
          notes: 'Candidate accepted',
        },
      ]
      setOffers(mockOffers)
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOffer = async () => {
    try {
      const newOffer: Offer = {
        id: Date.now().toString(),
        ...formData,
        extendedDate: new Date().toISOString(),
        responseDate: null,
        notes: formData.notes || null,
      }
      setOffers([...offers, newOffer])
      setIsDialogOpen(false)
      setFormData({
        candidateName: '',
        jobTitle: '',
        offerAmount: '',
        status: 'PENDING',
        notes: '',
      })
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }

  const handleViewOffer = (offer: Offer) => {
    setSelectedOffer(offer)
    setViewDialogOpen(true)
  }

  const handleAcceptOffer = async () => {
    if (!selectedOffer) return
    try {
      setOffers(offers.map(o => 
        o.id === selectedOffer.id 
          ? { ...o, status: 'ACCEPTED' as any, responseDate: new Date().toISOString() }
          : o
      ))
      setAcceptDialogOpen(false)
      setSelectedOffer(null)
    } catch (error) {
      console.error('Error accepting offer:', error)
    }
  }

  const handleRejectOffer = async () => {
    if (!selectedOffer) return
    try {
      setOffers(offers.map(o => 
        o.id === selectedOffer.id 
          ? { ...o, status: 'REJECTED' as any, responseDate: new Date().toISOString() }
          : o
      ))
      setRejectDialogOpen(false)
      setSelectedOffer(null)
    } catch (error) {
      console.error('Error rejecting offer:', error)
    }
  }

  const handleWithdrawOffer = async () => {
    if (!selectedOffer) return
    try {
      setOffers(offers.filter(o => o.id !== selectedOffer.id))
      setWithdrawDialogOpen(false)
      setSelectedOffer(null)
    } catch (error) {
      console.error('Error withdrawing offer:', error)
    }
  }

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      offer.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: offers.length,
    pending: offers.filter((o) => o.status === 'PENDING').length,
    accepted: offers.filter((o) => o.status === 'ACCEPTED').length,
    rejected: offers.filter((o) => o.status === 'REJECTED').length,
  }

  return (
    <RecruitmentPageLayout title="Offers" description="Manage job offers extended to candidates">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All offers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accepted}</div>
              <p className="text-xs text-muted-foreground">Accepted offers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Declined offers</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search offers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Extend Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Extend Job Offer</DialogTitle>
                <DialogDescription>
                  Create a new job offer for a candidate
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="candidateName">Candidate Name *</Label>
                    <Input
                      id="candidateName"
                      value={formData.candidateName}
                      onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="offerAmount">Offer Amount *</Label>
                  <Input
                    id="offerAmount"
                    value={formData.offerAmount}
                    onChange={(e) => setFormData({ ...formData, offerAmount: e.target.value })}
                    placeholder="$120,000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    placeholder="Additional details about the offer..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOffer}>
                    Extend Offer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Offers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Job Offers</CardTitle>
            <CardDescription>
              Track offers extended to candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredOffers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No offers found. Extend an offer to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Offer Amount</TableHead>
                    <TableHead>Extended Date</TableHead>
                    <TableHead>Response Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOffers.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell className="font-medium">{offer.candidateName}</TableCell>
                      <TableCell>{offer.jobTitle}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          {offer.offerAmount}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(offer.extendedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {offer.responseDate ? new Date(offer.responseDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={offer.status === 'ACCEPTED' ? 'default' : offer.status === 'PENDING' ? 'secondary' : 'destructive'}>
                          {offer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewOffer(offer)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {offer.status === 'PENDING' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedOffer(offer)
                                    setAcceptDialogOpen(true)
                                  }}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Accepted
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedOffer(offer)
                                    setRejectDialogOpen(true)
                                  }}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Mark as Rejected
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedOffer(offer)
                                    setWithdrawDialogOpen(true)
                                  }}
                                  className="text-destructive"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Withdraw Offer
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Reminder
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Generate Offer Letter
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download Offer PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View Offer Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Offer Details</DialogTitle>
            </DialogHeader>
            {selectedOffer && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Candidate</Label>
                    <p className="text-sm font-medium">{selectedOffer.candidateName}</p>
                  </div>
                  <div>
                    <Label>Job Title</Label>
                    <p className="text-sm">{selectedOffer.jobTitle}</p>
                  </div>
                  <div>
                    <Label>Offer Amount</Label>
                    <p className="text-sm font-semibold">{selectedOffer.offerAmount}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={selectedOffer.status === 'ACCEPTED' ? 'default' : selectedOffer.status === 'PENDING' ? 'secondary' : 'destructive'}>
                      {selectedOffer.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Extended Date</Label>
                    <p className="text-sm">{new Date(selectedOffer.extendedDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Response Date</Label>
                    <p className="text-sm">{selectedOffer.responseDate ? new Date(selectedOffer.responseDate).toLocaleDateString() : 'Pending'}</p>
                  </div>
                </div>
                {selectedOffer.notes && (
                  <div>
                    <Label>Notes</Label>
                    <p className="text-sm text-muted-foreground">{selectedOffer.notes}</p>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Accept Offer Dialog */}
        <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Offer as Accepted</DialogTitle>
              <DialogDescription>
                Confirm that {selectedOffer?.candidateName} has accepted the offer for {selectedOffer?.jobTitle}?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAcceptOffer}>Mark as Accepted</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject Offer Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Offer as Rejected</DialogTitle>
              <DialogDescription>
                Confirm that {selectedOffer?.candidateName} has rejected the offer for {selectedOffer?.jobTitle}?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRejectOffer}>Mark as Rejected</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Withdraw Offer Dialog */}
        <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw Offer</DialogTitle>
              <DialogDescription>
                Are you sure you want to withdraw the offer to {selectedOffer?.candidateName}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleWithdrawOffer}>Withdraw Offer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RecruitmentPageLayout>
  )
}

