'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
    CheckCircle,
    Circle,
    FileText,
    Users,
    Target,
    TrendingUp,
    AlertCircle,
    Plus,
    Trash2,
    Send,
    Save,
    Edit2
} from 'lucide-react'

interface ChecklistItem {
    id: string
    item: string
    completed: boolean
}

interface Stakeholder {
    id: string
    name: string
    role: string
    influence: 'High' | 'Medium' | 'Low'
    email?: string
}

interface InitiateTabProps {
    project: any
}

export function InitiateTab({ project }: InitiateTabProps) {
    // Start with empty arrays - will be loaded from database
    const [checklist, setChecklist] = useState<ChecklistItem[]>([])
    const [newChecklistItem, setNewChecklistItem] = useState('')
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])

    const [newStakeholder, setNewStakeholder] = useState<Partial<Stakeholder>>({
        name: '',
        role: '',
        influence: 'Medium',
        email: ''
    })

    const [showStakeholderForm, setShowStakeholderForm] = useState(false)
    const [showApprovalDialog, setShowApprovalDialog] = useState(false)
    const [orgUsers, setOrgUsers] = useState<any[]>([])
    const [filteredUsers, setFilteredUsers] = useState<any[]>([])
    const [showUserSuggestions, setShowUserSuggestions] = useState(false)
    const nameInputRef = useRef<HTMLDivElement>(null)
    const [filteredApprovers, setFilteredApprovers] = useState<any[]>([])
    const [showApproverSuggestions, setShowApproverSuggestions] = useState(false)
    const approverInputRef = useRef<HTMLDivElement>(null)

    interface SuccessMetric {
        id: string
        description: string
        targetValue: string
        currentValue: string
        unit: string
    }

    const [objectives, setObjectives] = useState({
        businessObjective: '',
        successCriteria: [] as SuccessMetric[]
    })

    const [charter, setCharter] = useState({
        purpose: '',
        charterDate: new Date().toISOString().split('T')[0],
        approvedBy: '',
        status: 'Draft'
    })

    const [approvalRequest, setApprovalRequest] = useState({
        approvers: [] as string[],
        ccList: [] as string[],
        message: ''
    })

    const [availableUsers, setAvailableUsers] = useState<any[]>([])
    const [charterApprovalId, setCharterApprovalId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [dataLoaded, setDataLoaded] = useState(false)

    // Fetch users for approval
    useEffect(() => {
        fetchUsers()
        fetchOrgUsers()
    }, [])

    // Click outside handler for autocomplete
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (nameInputRef.current && !nameInputRef.current.contains(event.target as Node)) {
                setShowUserSuggestions(false)
            }
            if (approverInputRef.current && !approverInputRef.current.contains(event.target as Node)) {
                setShowApproverSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Load initiate data when project ID is available
    useEffect(() => {
        console.log('[useEffect] Checking data load:', { projectId: project?.id, dataLoaded, isSaving })
        if (project?.id && !dataLoaded) {
            console.log('[useEffect] 🔄 Project loaded, fetching data for:', project.id)
            // Reset isSaving state in case it's stuck
            setIsSaving(false)
            loadInitiateData()
            fetchCharterApprovalStatus()
        } else {
            console.log('[useEffect] ⏭️  Skipping load - already loaded or no project ID')
        }
    }, [project?.id, dataLoaded])

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users/onboarded')
            if (response.ok) {
                const data = await response.json()
                setAvailableUsers(data.users || [])
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const fetchOrgUsers = async () => {
        try {
            const response = await fetch('/api/users/onboarded')
            if (response.ok) {
                const data = await response.json()
                setOrgUsers(data.users || [])
            }
        } catch (error) {
            console.error('Error fetching org users:', error)
        }
    }

    const handleNameChange = (value: string) => {
        setNewStakeholder({ ...newStakeholder, name: value })
        
        if (value.trim().length > 0) {
            const filtered = orgUsers.filter(user => {
                const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
                const email = user.email.toLowerCase()
                const searchTerm = value.toLowerCase()
                return fullName.includes(searchTerm) || email.includes(searchTerm)
            })
            setFilteredUsers(filtered)
            setShowUserSuggestions(filtered.length > 0)
        } else {
            setFilteredUsers([])
            setShowUserSuggestions(false)
        }
    }

    const selectUser = (user: any) => {
        setNewStakeholder({
            ...newStakeholder,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role || ''
        })
        setShowUserSuggestions(false)
    }

    const handleApproverChange = (value: string) => {
        setCharter({ ...charter, approvedBy: value })
        
        if (value.trim().length > 0) {
            const filtered = orgUsers.filter(user => {
                const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
                const email = user.email.toLowerCase()
                const searchTerm = value.toLowerCase()
                return fullName.includes(searchTerm) || email.includes(searchTerm)
            })
            setFilteredApprovers(filtered)
            setShowApproverSuggestions(filtered.length > 0)
        } else {
            setFilteredApprovers([])
            setShowApproverSuggestions(false)
        }
    }

    const selectApprover = (user: any) => {
        setCharter({
            ...charter,
            approvedBy: `${user.firstName} ${user.lastName}`
        })
        setShowApproverSuggestions(false)
    }

    const loadInitiateData = async () => {
        try {
            console.log('📥 Loading initiate data for project:', project?.id)
            const response = await fetch(`/api/projects/${project?.id}/initiate`)
            if (response.ok) {
                const data = await response.json()
                const initiateData = data.initiateData

                console.log('📦 Loaded initiate data:', initiateData)

                if (initiateData && Object.keys(initiateData).length > 0) {
                    if (initiateData.checklist && initiateData.checklist.length > 0) {
                        console.log('✅ Restoring checklist:', initiateData.checklist)
                        console.log('✅ Setting checklist to:', initiateData.checklist.length, 'items')
                        setChecklist([...initiateData.checklist]) // Force new array reference
                    } else {
                        // Set default checklist if none saved
                        setChecklist([
                            { id: '1', item: 'Project Charter Approved', completed: false },
                            { id: '2', item: 'Stakeholders Identified', completed: false },
                            { id: '3', item: 'Initial Budget Allocated', completed: false },
                            { id: '4', item: 'Project Manager Assigned', completed: false },
                            { id: '5', item: 'High-Level Scope Defined', completed: false },
                            { id: '6', item: 'Feasibility Study Completed', completed: false },
                        ])
                    }

                    if (initiateData.stakeholders && initiateData.stakeholders.length > 0) {
                        console.log('✅ Restoring stakeholders:', initiateData.stakeholders)
                        setStakeholders([...initiateData.stakeholders]) // Force new array reference
                    }
                    // No default stakeholders - start with empty array

                    if (initiateData.objectives) {
                        console.log('✅ Restoring objectives:', initiateData.objectives)
                        setObjectives(initiateData.objectives)
                    } else {
                        // Set default objectives if none saved
                        setObjectives({
                            businessObjective: 'Increase operational efficiency by 25% through process automation and digital transformation.',
                            successCriteria: [
                                { id: '1', description: 'Reduce processing time', targetValue: '30', currentValue: '0', unit: '%' },
                                { id: '2', description: 'User adoption rate', targetValue: '95', currentValue: '0', unit: '%' },
                                { id: '3', description: 'ROI within 18 months', targetValue: '32', currentValue: '0', unit: '%' }
                            ]
                        })
                    }

                    if (initiateData.charter) {
                        console.log('✅ Restoring charter:', initiateData.charter)
                        setCharter(prev => ({
                            ...prev,
                            ...initiateData.charter
                        }))
                    } else {
                        // Set default charter if none saved
                        setCharter({
                            purpose: '',
                            charterDate: '2025-01-15',
                            approvedBy: '',
                            status: 'Draft'
                        })
                    }

                    setLastSaved(new Date(initiateData.lastUpdated || Date.now()))

                    // Mark data as loaded
                    setDataLoaded(true)
                } else {
                    // No saved data at all - initialize with defaults
                    console.log('📝 No saved data, initializing with defaults')
                    setDataLoaded(true)
                    setChecklist([
                        { id: '1', item: 'Project Charter Approved', completed: false },
                        { id: '2', item: 'Stakeholders Identified', completed: false },
                        { id: '3', item: 'Initial Budget Allocated', completed: false },
                        { id: '4', item: 'Project Manager Assigned', completed: false },
                        { id: '5', item: 'High-Level Scope Defined', completed: false },
                        { id: '6', item: 'Feasibility Study Completed', completed: false },
                    ])
                    setStakeholders([])
                    setObjectives({
                        businessObjective: 'Increase operational efficiency by 25% through process automation and digital transformation.',
                        successCriteria: [
                            { id: '1', description: 'Reduce processing time', targetValue: '30', currentValue: '0', unit: '%' },
                            { id: '2', description: 'User adoption rate', targetValue: '95', currentValue: '0', unit: '%' },
                            { id: '3', description: 'ROI within 18 months', targetValue: '32', currentValue: '0', unit: '%' }
                        ]
                    })
                    setCharter({
                        purpose: '',
                        charterDate: '2025-01-15',
                        approvedBy: '',
                        status: 'Draft'
                    })
                    setDataLoaded(true)
                }
                console.log('✅ Initial load complete')
            }
        } catch (error) {
            console.error('❌ Error loading initiate data:', error)
            setDataLoaded(true)
        }
    }

    const saveInitiateData = async () => {
        try {
            console.log('[saveInitiateData] 💾 Starting save...')
            setIsSaving(true)

            const dataToSave = {
                checklist,
                stakeholders,
                objectives,
                charter
            }

            console.log('💾 Saving initiate data:', dataToSave)

            const response = await fetch(`/api/projects/${project?.id}/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSave),
            })

            if (response.ok) {
                setLastSaved(new Date())
                console.log('✅ Data saved successfully at', new Date().toLocaleTimeString())
            } else {
                const error = await response.json()
                console.error('❌ Failed to save data:', error)
                alert('Failed to save data. Please try again.')
            }
        } catch (error) {
            console.error('❌ Error saving initiate data:', error)
            alert('Error saving data. Please check console.')
        } finally {
            console.log('[saveInitiateData] ✅ Save complete, setting isSaving to false')
            setIsSaving(false)
        }
    }

    const fetchCharterApprovalStatus = async () => {
        try {
            // Fetch approvals for this project charter
            const response = await fetch('/api/approvals?filter=all')
            if (response.ok) {
                const data = await response.json()

                // Find the most recent charter approval for this project
                const charterApproval = data.approvals?.find((approval: any) =>
                    approval.type === 'PROJECT_CHARTER' &&
                    approval.entityId === project?.id
                )

                if (charterApproval) {
                    // Store approval ID for reference
                    setCharterApprovalId(charterApproval.id)

                    // Update charter status based on approval status
                    let status = 'Draft'
                    if (charterApproval.status === 'PENDING') {
                        status = 'Pending Approval'
                    } else if (charterApproval.status === 'APPROVED') {
                        status = 'Approved'
                    } else if (charterApproval.status === 'REJECTED') {
                        status = 'Rejected'
                    }

                    setCharter(prev => ({ ...prev, status }))

                    // If approval has document data, restore it
                    if (charterApproval.documentData) {
                        const docData = charterApproval.documentData as any
                        if (docData.charter) {
                            setCharter(prev => ({
                                ...prev,
                                purpose: docData.charter.purpose || prev.purpose,
                                charterDate: docData.charter.charterDate || prev.charterDate,
                                approvedBy: docData.charter.approvedBy || prev.approvedBy,
                                status: status
                            }))
                        }
                        if (docData.objectives) {
                            setObjectives(docData.objectives)
                        }
                        if (docData.stakeholders) {
                            setStakeholders(docData.stakeholders)
                        }
                        if (docData.checklist) {
                            setChecklist(docData.checklist)
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching charter approval status:', error)
        }
    }

    const completedItems = checklist.filter(item => item.completed).length
    const completionPercentage = checklist.length > 0 ? Math.round((completedItems / checklist.length) * 100) : 0

    const toggleChecklistItem = (id: string) => {
        setChecklist(checklist.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ))
    }

    const addChecklistItem = () => {
        if (newChecklistItem.trim()) {
            setChecklist([...checklist, {
                id: Date.now().toString(),
                item: newChecklistItem,
                completed: false
            }])
            setNewChecklistItem('')
        }
    }

    const deleteChecklistItem = (id: string) => {
        setChecklist(checklist.filter(item => item.id !== id))
    }

    const addStakeholder = () => {
        if (newStakeholder.name && newStakeholder.role) {
            setStakeholders([...stakeholders, {
                id: Date.now().toString(),
                name: newStakeholder.name,
                role: newStakeholder.role,
                influence: newStakeholder.influence || 'Medium',
                email: newStakeholder.email
            }])
            setNewStakeholder({ name: '', role: '', influence: 'Medium', email: '' })
            setShowStakeholderForm(false)
        }
    }

    const deleteStakeholder = (id: string) => {
        setStakeholders(stakeholders.filter(s => s.id !== id))
    }


    const sendForApproval = async () => {
        if (approvalRequest.approvers.length === 0) {
            alert('Please select at least one approver')
            return
        }

        try {
            // Send approval request via API
            const response = await fetch('/api/approvals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'PROJECT_CHARTER',
                    title: `Project Charter Approval - ${project?.name || 'Project'}`,
                    description: charter.purpose,
                    entityId: project?.id,
                    entityType: 'project_charter',
                    documentData: {
                        charter: charter,
                        objectives: objectives,
                        stakeholders: stakeholders,
                        checklist: checklist
                    },
                    approvers: approvalRequest.approvers,
                    ccList: approvalRequest.ccList,
                    message: approvalRequest.message
                }),
            })

            if (response.ok) {
                const data = await response.json()
                alert(`✅ Charter sent for approval to ${approvalRequest.approvers.length} approver(s)!`)
                setCharter({ ...charter, status: 'Pending Approval' })
                setShowApprovalDialog(false)
                setApprovalRequest({ approvers: [], ccList: [], message: '' })
                // Refresh the approval status to ensure it's synced
                setTimeout(() => fetchCharterApprovalStatus(), 1000)
            } else {
                const error = await response.json()
                alert(`❌ Error: ${error.error || 'Failed to send for approval'}`)
            }
        } catch (error) {
            console.error('Error sending for approval:', error)
            alert('❌ Failed to send for approval. Please try again.')
        }
    }

    return (
        <div className="space-y-6">
            {/* Loading Indicator */}
            {!dataLoaded && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium">Loading initiate data...</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Save Indicator & Manual Save Button */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => saveInitiateData()}
                        disabled={isSaving}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Save className="h-3 w-3 mr-2" />
                        {isSaving ? 'Saving All...' : 'Save All Changes'}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        💡 Click Save buttons after making changes
                    </span>
                </div>

                {(isSaving || lastSaved) && (
                    <div className="text-sm text-muted-foreground">
                        {isSaving ? (
                            <span className="flex items-center gap-2">
                                <div className="h-3 w-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </span>
                        ) : lastSaved ? (
                            <span className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                Saved {lastSaved.toLocaleTimeString()}
                            </span>
                        ) : null}
                    </div>
                )}
            </div>


            {/* Phase Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Phase Progress</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionPercentage}%</div>
                        <Progress value={completionPercentage} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {completedItems} of {checklist.length} tasks completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Key Stakeholders</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stakeholders.length}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Identified and engaged
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Charter Status</CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={fetchCharterApprovalStatus}
                            className="h-6 w-6"
                            title="Refresh status"
                        >
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold mb-2">
                            <Badge
                                variant="outline"
                                className={
                                    charter.status === 'Approved'
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : charter.status === 'Pending Approval'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : charter.status === 'Rejected'
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-gray-50 text-gray-700 border-gray-200'
                                }
                            >
                                {charter.status}
                            </Badge>
                        </div>
                        {charterApprovalId && (
                            <a
                                href="/approvals"
                                target="_blank"
                                className="text-xs text-purple-600 hover:text-purple-800 underline"
                            >
                                View Approval →
                            </a>
                        )}
                        {!charterApprovalId && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Not yet submitted
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Initiation Checklist */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <span className="text-base md:text-lg">Initiation Checklist</span>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={saveInitiateData}
                                disabled={isSaving}
                                className="w-full sm:w-auto text-xs"
                            >
                                <Save className="h-3 w-3 mr-1 md:mr-2" />
                                {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">
                            Create and track your initiation tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {checklist.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleChecklistItem(item.id)}
                                        className="focus:outline-none"
                                    >
                                        {item.completed ? (
                                            <CheckCircle className="h-5 w-5 text-green-600 cursor-pointer" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-green-600" />
                                        )}
                                    </button>
                                    <span className={`flex-1 ${item.completed ? 'text-muted-foreground line-through' : ''}`}>
                                        {item.item}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteChecklistItem(item.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}

                            {checklist.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No checklist items yet</p>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Input
                                    placeholder="Add new checklist item..."
                                    value={newChecklistItem}
                                    onChange={(e) => setNewChecklistItem(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                                />
                                <Button type="button" onClick={addChecklistItem}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Project Objectives */}
                <Card className={charter.status === 'Approved' ? 'border-green-200' : ''}>
                    <CardHeader>
                        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Target className="h-4 w-4 md:h-5 md:w-5" />
                                <span className="text-base md:text-lg">Project Objectives</span>
                                {charter.status === 'Approved' && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Locked
                                    </Badge>
                                )}
                            </div>
                            {charter.status !== 'Approved' && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={saveInitiateData}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto text-xs"
                                >
                                    <Save className="h-3 w-3 mr-1 md:mr-2" />
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Button>
                            )}
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">
                            {charter.status === 'Approved'
                                ? 'Objectives are locked after charter approval'
                                : 'Define high-level goals and success criteria'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <Label>Business Objective</Label>
                                <Textarea
                                    placeholder="Describe the business objective..."
                                    className="mt-2"
                                    rows={3}
                                    value={objectives.businessObjective}
                                    onChange={(e) => setObjectives({ ...objectives, businessObjective: e.target.value })}
                                    disabled={charter.status === 'Approved'}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label>Success Criteria & Metrics</Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            const newMetric: SuccessMetric = {
                                                id: Date.now().toString(),
                                                description: '',
                                                targetValue: '',
                                                currentValue: '0',
                                                unit: '%'
                                            }
                                            setObjectives({
                                                ...objectives,
                                                successCriteria: [...objectives.successCriteria, newMetric]
                                            })
                                        }}
                                        disabled={charter.status === 'Approved'}
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Metric
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {objectives.successCriteria.map((metric, index) => (
                                        <div key={metric.id} className="p-3 border rounded-lg bg-muted/30">
                                            <div className="grid gap-3">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Description</Label>
                                                    <Input
                                                        placeholder="e.g., Reduce processing time"
                                                        value={metric.description}
                                                        onChange={(e) => {
                                                            const newCriteria = [...objectives.successCriteria]
                                                            newCriteria[index].description = e.target.value
                                                            setObjectives({ ...objectives, successCriteria: newCriteria })
                                                        }}
                                                        disabled={charter.status === 'Approved'}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">Target</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="30"
                                                            value={metric.targetValue}
                                                            onChange={(e) => {
                                                                const newCriteria = [...objectives.successCriteria]
                                                                newCriteria[index].targetValue = e.target.value
                                                                setObjectives({ ...objectives, successCriteria: newCriteria })
                                                            }}
                                                            disabled={charter.status === 'Approved'}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">Current</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            value={metric.currentValue}
                                                            onChange={(e) => {
                                                                const newCriteria = [...objectives.successCriteria]
                                                                newCriteria[index].currentValue = e.target.value
                                                                setObjectives({ ...objectives, successCriteria: newCriteria })
                                                            }}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">Unit</Label>
                                                        <Select
                                                            value={metric.unit}
                                                            onValueChange={(value) => {
                                                                const newCriteria = [...objectives.successCriteria]
                                                                newCriteria[index].unit = value
                                                                setObjectives({ ...objectives, successCriteria: newCriteria })
                                                            }}
                                                            disabled={charter.status === 'Approved'}
                                                        >
                                                            <SelectTrigger className="mt-1">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="%">%</SelectItem>
                                                                <SelectItem value="days">days</SelectItem>
                                                                <SelectItem value="hours">hours</SelectItem>
                                                                <SelectItem value="$">$</SelectItem>
                                                                <SelectItem value="count">count</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                {charter.status !== 'Approved' && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setObjectives({
                                                                ...objectives,
                                                                successCriteria: objectives.successCriteria.filter((_, i) => i !== index)
                                                            })
                                                        }}
                                                        className="w-full text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3 w-3 mr-1" />
                                                        Remove Metric
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stakeholder Register */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 md:h-5 md:w-5" />
                                <span className="text-base md:text-lg">Key Stakeholders</span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={saveInitiateData}
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none text-xs"
                                >
                                    <Save className="h-3 w-3 mr-1 md:mr-2" />
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowStakeholderForm(!showStakeholderForm)}
                                    className="flex-1 sm:flex-none text-xs"
                                >
                                    <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                                    Add
                                </Button>
                            </div>
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">
                            Identify and manage project stakeholders
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stakeholders.map((stakeholder) => (
                                <div key={stakeholder.id} className="flex items-center justify-between p-3 border rounded-lg group">
                                    <div className="flex-1">
                                        <p className="font-medium">{stakeholder.name}</p>
                                        <p className="text-sm text-muted-foreground">{stakeholder.role}</p>
                                        {stakeholder.email && (
                                            <p className="text-xs text-muted-foreground">{stakeholder.email}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={
                                                stakeholder.influence === 'High'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : stakeholder.influence === 'Medium'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-gray-50 text-gray-700 border-gray-200'
                                            }
                                        >
                                            {stakeholder.influence}
                                        </Badge>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteStakeholder(stakeholder.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {stakeholders.length === 0 && !showStakeholderForm && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No stakeholders added yet</p>
                                </div>
                            )}

                            {showStakeholderForm && (
                                <div className="p-4 border rounded-lg bg-accent/50 space-y-3">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="relative" ref={nameInputRef}>
                                            <Label className="text-xs">Name *</Label>
                                            {showUserSuggestions && filteredUsers.length > 0 && (
                                                <div className="absolute z-50 w-full bottom-full mb-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                                    {filteredUsers.map((user) => (
                                                        <button
                                                            key={user.id}
                                                            type="button"
                                                            onClick={() => selectUser(user)}
                                                            className="w-full px-3 py-2 text-left hover:bg-muted flex flex-col border-b last:border-b-0"
                                                        >
                                                            <span className="font-medium text-sm">{user.firstName} {user.lastName}</span>
                                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                                            {user.role && (
                                                                <span className="text-xs text-muted-foreground">{user.role}</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <Input
                                                placeholder="Start typing to search users..."
                                                value={newStakeholder.name}
                                                onChange={(e) => handleNameChange(e.target.value)}
                                                onFocus={() => {
                                                    if (newStakeholder.name && filteredUsers.length > 0) {
                                                        setShowUserSuggestions(true)
                                                    }
                                                }}
                                                className="mt-1"
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Role *</Label>
                                            <Input
                                                placeholder="e.g., Executive Sponsor"
                                                value={newStakeholder.role}
                                                onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div>
                                            <Label className="text-xs">Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="email@company.com"
                                                value={newStakeholder.email}
                                                onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Influence Level</Label>
                                            <Select
                                                value={newStakeholder.influence}
                                                onValueChange={(value: any) => setNewStakeholder({ ...newStakeholder, influence: value })}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="High">High</SelectItem>
                                                    <SelectItem value="Medium">Medium</SelectItem>
                                                    <SelectItem value="Low">Low</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setShowStakeholderForm(false)
                                                setNewStakeholder({ name: '', role: '', influence: 'Medium', email: '' })
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="button" size="sm" onClick={addStakeholder}>
                                            Add Stakeholder
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Project Charter */}
                <Card className={charter.status === 'Approved' ? 'border-green-200' : ''}>
                    <CardHeader>
                        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <FileText className="h-4 w-4 md:h-5 md:w-5" />
                                <span className="text-base md:text-lg">Project Charter</span>
                                {charter.status === 'Approved' && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Locked
                                    </Badge>
                                )}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                {charter.status !== 'Approved' && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setShowApprovalDialog(true)}
                                        disabled={charter.status === 'Pending Approval'}
                                        className="flex-1 sm:flex-none text-xs !bg-foreground !text-background hover:!bg-foreground/90"
                                    >
                                        <Send className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                                        <span className="hidden sm:inline">Send for Approval</span>
                                        <span className="sm:hidden">Send</span>
                                    </Button>
                                )}
                            </div>
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">
                            {charter.status === 'Approved'
                                ? 'Charter is locked after approval - changes require new approval'
                                : 'Formal project authorization document'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <Label>Current Status</Label>
                                <div className="mt-2">
                                    <Badge
                                        variant="outline"
                                        className={
                                            charter.status === 'Approved'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : charter.status === 'Pending Approval'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                        }
                                    >
                                        {charter.status}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <Label>Project Purpose</Label>
                                <Textarea
                                    placeholder="Why is this project being undertaken?"
                                    className="mt-2"
                                    rows={4}
                                    value={charter.purpose}
                                    onChange={(e) => setCharter({ ...charter, purpose: e.target.value })}
                                    disabled={charter.status === 'Approved'}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label>Charter Date</Label>
                                    <Input
                                        type="date"
                                        className="mt-2 [color-scheme:light] dark:[color-scheme:dark]"
                                        value={charter.charterDate}
                                        onChange={(e) => setCharter({ ...charter, charterDate: e.target.value })}
                                        disabled={charter.status === 'Approved'}
                                    />
                                </div>
                                <div className="relative" ref={approverInputRef}>
                                    <Label>Approver</Label>
                                    {showApproverSuggestions && filteredApprovers.length > 0 && (
                                        <div className="absolute z-50 w-full bottom-full mb-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                            {filteredApprovers.map((user) => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => selectApprover(user)}
                                                    className="w-full px-3 py-2 text-left hover:bg-muted flex flex-col border-b last:border-b-0"
                                                >
                                                    <span className="font-medium text-sm">{user.firstName} {user.lastName}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                    {user.role && (
                                                        <span className="text-xs text-muted-foreground">{user.role}</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <Input
                                        className="mt-2"
                                        value={charter.approvedBy}
                                        onChange={(e) => handleApproverChange(e.target.value)}
                                        onFocus={() => {
                                            if (charter.approvedBy && filteredApprovers.length > 0) {
                                                setShowApproverSuggestions(true)
                                            }
                                        }}
                                        placeholder="Start typing to search users..."
                                        disabled={charter.status === 'Approved'}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Approval Dialog */}
            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Send Charter for Approval</DialogTitle>
                        <DialogDescription>
                            Select approvers and add people to CC for this project charter approval request
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Approvers * (Required)</Label>
                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                                {availableUsers.map((user) => (
                                    <div key={user.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`approver-${user.id}`}
                                            checked={approvalRequest.approvers.includes(user.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setApprovalRequest({
                                                        ...approvalRequest,
                                                        approvers: [...approvalRequest.approvers, user.id]
                                                    })
                                                } else {
                                                    setApprovalRequest({
                                                        ...approvalRequest,
                                                        approvers: approvalRequest.approvers.filter(id => id !== user.id)
                                                    })
                                                }
                                            }}
                                            className="cursor-pointer"
                                        />
                                        <label htmlFor={`approver-${user.id}`} className="text-sm cursor-pointer flex-1">
                                            {user.firstName} {user.lastName} ({user.role})
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {approvalRequest.approvers.length} approver(s) selected
                            </p>
                        </div>

                        <div>
                            <Label>CC (Optional)</Label>
                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                                {availableUsers.map((user) => (
                                    <div key={user.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`cc-${user.id}`}
                                            checked={approvalRequest.ccList.includes(user.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setApprovalRequest({
                                                        ...approvalRequest,
                                                        ccList: [...approvalRequest.ccList, user.id]
                                                    })
                                                } else {
                                                    setApprovalRequest({
                                                        ...approvalRequest,
                                                        ccList: approvalRequest.ccList.filter(id => id !== user.id)
                                                    })
                                                }
                                            }}
                                            className="cursor-pointer"
                                        />
                                        <label htmlFor={`cc-${user.id}`} className="text-sm cursor-pointer flex-1">
                                            {user.firstName} {user.lastName} ({user.role})
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {approvalRequest.ccList.length} person(s) in CC
                            </p>
                        </div>

                        <div>
                            <Label>Message (Optional)</Label>
                            <Textarea
                                placeholder="Add a message for the approvers..."
                                rows={4}
                                value={approvalRequest.message}
                                onChange={(e) => setApprovalRequest({ ...approvalRequest, message: e.target.value })}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowApprovalDialog(false)
                                setApprovalRequest({ approvers: [], ccList: [], message: '' })
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="button" variant="secondary" onClick={sendForApproval} className="!bg-foreground !text-background hover:!bg-foreground/90">
                            <Send className="mr-2 h-4 w-4" />
                            Send for Approval
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

