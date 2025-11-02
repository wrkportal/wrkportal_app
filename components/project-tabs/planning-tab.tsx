'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlanningStep, type Milestone } from '@/components/project-creation/planning-step'
import {
    Calendar,
    CheckCircle,
    Users,
    Target,
    TrendingUp,
    Clock,
    Save,
    FileText,
    Plus,
    Trash2
} from 'lucide-react'

interface Deliverable {
    id: string
    item: string
    status: 'completed' | 'in-progress' | 'pending'
}

interface WBSTask {
    id: string
    level: number
    milestone: string
    task: string
    subtask: string
    assignedTo: string
    start: string
    end: string
    status: 'Done' | 'In Progress' | 'Planned' | 'Pending'
    dependency: string
    subtasks?: WBSTask[]
}

interface CostItem {
    id: string
    category: string
    description: string
    estimatedCost: string
    actualCost: string
    variance: string
    notes: string
}

interface RiskItem {
    id: string
    riskId: string
    description: string
    probability: 'High' | 'Medium' | 'Low'
    impact: 'High' | 'Medium' | 'Low'
    severity: 'Critical' | 'Major' | 'Minor'
    mitigationStrategy: string
    owner: string
    status: 'Active' | 'Mitigated' | 'Closed'
}

interface CommunicationItem {
    id: string
    stakeholder: string
    role: string
    infoNeeded: string
    method: string
    frequency: string
    owner: string
}

interface QualityItem {
    id: string
    qualityMetric: string
    description: string
    targetStandard: string
    measurementMethod: string
    frequency: string
    responsible: string
    status: 'Not Started' | 'In Progress' | 'Completed' | 'Failed'
}

interface ResourceItem {
    id: string
    resourceName: string
    role: string
    skills: string
    allocation: string
    startDate: string
    endDate: string
    costRate: string
    status: 'Available' | 'Allocated' | 'Overallocated' | 'Unavailable'
}

interface ProcurementItem {
    id: string
    itemService: string
    description: string
    vendorSupplier: string
    estimatedCost: string
    deliveryDate: string
    contractStatus: 'Not Started' | 'In Negotiation' | 'Approved' | 'Completed'
    owner: string
    notes: string
}

interface DeliverableDetail {
    description: string
    objectives: string
    scope: string
    wbsTasks?: WBSTask[]
    costItems?: CostItem[]
    riskItems?: RiskItem[]
    communicationItems?: CommunicationItem[]
    qualityItems?: QualityItem[]
    resourceItems?: ResourceItem[]
    procurementItems?: ProcurementItem[]
    milestones?: Milestone[]
    resources: string
    timeline: string
    dependencies: string
    notes: string
}

interface PlanningTabProps {
    project: any
    orgUsers?: any[]
}

// WBS Task Row Component (renders tasks and subtasks recursively)
function WBSTaskRow({
    task,
    onUpdate,
    onDelete,
    onAddSubtask,
    orgUsers = [],
}: {
    task: WBSTask
    onUpdate: (taskId: string, field: keyof WBSTask, value: any) => void
    onDelete: (taskId: string) => void
    onAddSubtask: (taskId: string) => void
    orgUsers?: any[]
}) {
    const [showUserSuggestions, setShowUserSuggestions] = useState(false)
    const [filteredUsers, setFilteredUsers] = useState<any[]>([])
    const assigneeInputRef = useRef<HTMLDivElement>(null)
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null)
    const [searchText, setSearchText] = useState('')

    // Calculate dropdown position when showing
    useEffect(() => {
        if (showUserSuggestions && assigneeInputRef.current) {
            const rect = assigneeInputRef.current.getBoundingClientRect()
            setDropdownPosition({
                top: rect.top - 250, // Show above the input, 250px is approximate dropdown height
                left: rect.left,
                width: rect.width,
            })
        }
    }, [showUserSuggestions])

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'Done':
                return 'bg-green-50 text-green-700 border-green-200'
            case 'In Progress':
                return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'Planned':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200'
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }

    const handleAssigneeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchText(value) // Store search text separately

        console.log('🔍 Assignee change:', { value, orgUsersCount: orgUsers.length })

        // Only show suggestions if user has typed something
        if (orgUsers.length > 0 && value.trim().length > 0) {
            const filtered = orgUsers.filter(
                (user) =>
                    `${user.firstName} ${user.lastName}`
                        .toLowerCase()
                        .includes(value.toLowerCase()) ||
                    user.email.toLowerCase().includes(value.toLowerCase())
            )
            console.log('✅ Filtered users:', filtered.length)
            setFilteredUsers(filtered)
            setShowUserSuggestions(filtered.length > 0)
        } else {
            console.log('❌ Not showing suggestions')
            setShowUserSuggestions(false)
        }
    }

    const handleAssigneeFocus = () => {
        // Don't show suggestions on focus, only when user types
        // This keeps it professional
    }

    const selectUser = (user: any) => {
        onUpdate(task.id, 'assignedTo', user.id)
        setSearchText('') // Clear search text when user is selected
        setShowUserSuggestions(false)
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                assigneeInputRef.current &&
                !assigneeInputRef.current.contains(event.target as Node)
            ) {
                setShowUserSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Get display name for assigned user
    const getAssignedToDisplay = () => {
        // If user is typing (searchText is not empty), show the search text
        if (searchText) return searchText
        
        // Otherwise, show the selected user's name
        if (!task.assignedTo) return ''
        const user = orgUsers.find(u => u.id === task.assignedTo)
        if (user) {
            return `${user.firstName} ${user.lastName}`
        }
        return task.assignedTo
    }

    return (
        <>
            <tr className="border-b hover:bg-muted/50">
                <td className="p-2">
                    <Input
                        type="number"
                        value={task.level}
                        onChange={(e) => onUpdate(task.id, 'level', parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-center"
                        min={1}
                    />
                </td>
                <td className="p-2">
                    <Input
                        value={task.milestone}
                        onChange={(e) => onUpdate(task.id, 'milestone', e.target.value)}
                        placeholder="UI Design"
                        className="h-8"
                    />
                </td>
                <td className="p-2">
                    <Input
                        value={task.task}
                        onChange={(e) => onUpdate(task.id, 'task', e.target.value)}
                        placeholder="Homepage Wireframe"
                        className="h-8"
                    />
                </td>
                <td className="p-2">
                    <Input
                        value={task.subtask}
                        onChange={(e) => onUpdate(task.id, 'subtask', e.target.value)}
                        placeholder="Subtask details"
                        className="h-8"
                    />
                </td>
                <td className="p-2">
                    <div ref={assigneeInputRef} className="relative">
                        <Input
                            value={getAssignedToDisplay()}
                            onChange={handleAssigneeChange}
                            onFocus={handleAssigneeFocus}
                            placeholder="Type to search..."
                            className="h-8"
                        />
                    </div>
                    {/* Render dropdown with fixed positioning outside of table overflow */}
                    {showUserSuggestions && dropdownPosition && (
                        <div
                            className="fixed z-[9999] bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto"
                            style={{
                                top: `${dropdownPosition.top}px`,
                                left: `${dropdownPosition.left}px`,
                                width: `${dropdownPosition.width}px`,
                            }}
                        >
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                                    onClick={() => selectUser(user)}
                                >
                                    <div className="font-medium">
                                        {user.firstName} {user.lastName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {user.email}
                                        {user.status === 'INVITED' && (
                                            <span className="ml-2 text-amber-600">• Invited</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </td>
                <td className="p-2">
                    <Input
                        type="date"
                        value={task.start}
                        onChange={(e) => onUpdate(task.id, 'start', e.target.value)}
                        className="h-8 [color-scheme:light] dark:[color-scheme:dark]"
                    />
                </td>
                <td className="p-2">
                    <Input
                        type="date"
                        value={task.end}
                        onChange={(e) => onUpdate(task.id, 'end', e.target.value)}
                        className="h-8 [color-scheme:light] dark:[color-scheme:dark]"
                    />
                </td>
                <td className="p-2">
                    <Select value={task.status} onValueChange={(value: any) => onUpdate(task.id, 'status', value)}>
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Done">
                                <Badge variant="outline" className={getStatusBadgeColor('Done')}>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Done
                                </Badge>
                            </SelectItem>
                            <SelectItem value="In Progress">
                                <Badge variant="outline" className={getStatusBadgeColor('In Progress')}>
                                    In Progress
                                </Badge>
                            </SelectItem>
                            <SelectItem value="Planned">
                                <Badge variant="outline" className={getStatusBadgeColor('Planned')}>
                                    Planned
                                </Badge>
                            </SelectItem>
                            <SelectItem value="Pending">
                                <Badge variant="outline" className={getStatusBadgeColor('Pending')}>
                                    Pending
                                </Badge>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </td>
                <td className="p-2">
                    <Input
                        value={task.dependency}
                        onChange={(e) => onUpdate(task.id, 'dependency', e.target.value)}
                        placeholder="1, 2"
                        className="h-8 w-20"
                    />
                </td>
                <td className="p-2">
                    <div className="flex gap-1">
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onAddSubtask(task.id)}
                            className="h-7 w-7 p-0"
                            title="Add Nested Subtask"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(task.id)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Task"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </td>
            </tr>
            {/* Render subtasks recursively */}
            {task.subtasks && task.subtasks.length > 0 && task.subtasks.map((subtask) => (
                <WBSTaskRow
                    key={subtask.id}
                    task={subtask}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onAddSubtask={onAddSubtask}
                    orgUsers={orgUsers}
                />
            ))}
        </>
    )
}

export function PlanningTab({ project, orgUsers: propOrgUsers = [] }: PlanningTabProps) {
    const [deliverables, setDeliverables] = useState<Deliverable[]>([
        { id: '1', item: 'Work Breakdown Structure', status: 'pending' },
        { id: '2', item: 'Cost Management Planning', status: 'pending' },
        { id: '3', item: 'Risk Management Planning', status: 'pending' },
        { id: '4', item: 'Communication Plan', status: 'pending' },
        { id: '5', item: 'Quality Planning', status: 'pending' },
        { id: '6', item: 'Resource Management', status: 'pending' },
        { id: '7', item: 'Procurement Planning', status: 'pending' },
    ])
    const [selectedDeliverableId, setSelectedDeliverableId] = useState<string>('1')
    const [deliverableDetails, setDeliverableDetails] = useState<Record<string, DeliverableDetail>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [dataLoaded, setDataLoaded] = useState(false)
    const [planningFrozen, setPlanningFrozen] = useState(false)
    const [orgUsers, setOrgUsers] = useState<any[]>(propOrgUsers)

    // Update orgUsers when prop changes
    useEffect(() => {
        setOrgUsers(propOrgUsers)
    }, [propOrgUsers])

    // Load planning data when project ID is available
    useEffect(() => {
        if (project?.id) {
            console.log('🔄 Project loaded, fetching planning data for:', project.id)
            loadPlanningData()
        }
    }, [project?.id])

    const loadPlanningData = async () => {
        try {
            console.log('📥 Loading planning data for project:', project?.id)
            const response = await fetch(`/api/projects/${project?.id}/planning`)

            if (response.ok) {
                const data = await response.json()
                const planningData = data.planningData

                console.log('📦 Loaded planning data:', planningData)

                if (planningData && Object.keys(planningData).length > 0) {
                    if (planningData.deliverables && planningData.deliverables.length > 0) {
                        console.log('✅ Restoring deliverables:', planningData.deliverables)
                        setDeliverables([...planningData.deliverables])
                    }

                    if (planningData.deliverableDetails) {
                        console.log('✅ Restoring deliverable details:', planningData.deliverableDetails)
                        setDeliverableDetails(planningData.deliverableDetails)
                    }

                    if (planningData.selectedDeliverableId) {
                        setSelectedDeliverableId(planningData.selectedDeliverableId)
                    }

                    if (planningData.frozen !== undefined) {
                        console.log('✅ Planning frozen status:', planningData.frozen)
                        setPlanningFrozen(planningData.frozen)
                    }

                    setLastSaved(new Date(planningData.lastUpdated || Date.now()))
                } else {
                    console.log('📝 No saved planning data found')
                }
            } else {
                console.error('❌ Failed to load planning data:', response.status)
            }
        } catch (error) {
            console.error('❌ Error loading planning data:', error)
        } finally {
            // Always set dataLoaded to true, even if there's an error
            setDataLoaded(true)
            console.log('✅ Planning load complete')
        }
    }

    const savePlanningData = async () => {
        try {
            setIsSaving(true)

            const dataToSave = {
                deliverables,
                deliverableDetails,
                selectedDeliverableId,
                frozen: planningFrozen
            }

            console.log('💾 Saving planning data:', dataToSave)

            const response = await fetch(`/api/projects/${project?.id}/planning`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSave),
            })

            if (response.ok) {
                setLastSaved(new Date())
                console.log('✅ Planning data saved successfully at', new Date().toLocaleTimeString())
                
                // Sync WBS tasks to database
                console.log('🔄 Syncing WBS tasks to database...')
                try {
                    const syncResponse = await fetch(`/api/projects/${project?.id}/sync-wbs`, {
                        method: 'POST',
                    })
                    
                    if (syncResponse.ok) {
                        const syncResult = await syncResponse.json()
                        console.log('✅ WBS tasks synced:', syncResult)
                        if (syncResult.created > 0 || syncResult.updated > 0) {
                            console.log(`📊 Created: ${syncResult.created}, Updated: ${syncResult.updated}`)
                        }
                        // Log errors if any
                        if (syncResult.errors && syncResult.errors.length > 0) {
                            console.error('❌ Sync errors:', syncResult.errors)
                            syncResult.errors.forEach((error: string, index: number) => {
                                console.error(`  ${index + 1}. ${error}`)
                            })
                        }
                    } else {
                        console.warn('⚠️ WBS sync failed, but planning data was saved')
                    }
                } catch (syncError) {
                    console.warn('⚠️ WBS sync error, but planning data was saved:', syncError)
                }
            } else {
                const error = await response.json()
                console.error('❌ Failed to save planning data:', error)
                alert('Failed to save planning data')
            }
        } catch (error) {
            console.error('❌ Error saving planning data:', error)
            alert('Error saving planning data')
        } finally {
            setIsSaving(false)
        }
    }

    const freezePlanning = async () => {
        if (confirm('Are you sure you want to freeze planning? This will mark all deliverables as complete and lock all planning data.')) {
            setPlanningFrozen(true)
            // Mark all deliverables as completed
            setDeliverables(deliverables.map(d => ({ ...d, status: 'completed' })))
            // Save immediately
            await savePlanningData()
        }
    }

    const unfreezePlanning = async () => {
        if (confirm('Are you sure you want to unfreeze planning? This will allow editing of planning data again.')) {
            setPlanningFrozen(false)
            await savePlanningData()
        }
    }

    const updateDeliverableStatus = (id: string, status: 'completed' | 'in-progress' | 'pending') => {
        if (planningFrozen) return // Don't allow changes when frozen
        setDeliverables(deliverables.map(d =>
            d.id === id ? { ...d, status } : d
        ))
    }

    const getDeliverableDetail = (id: string): DeliverableDetail => {
        return deliverableDetails[id] || {
            description: '',
            objectives: '',
            scope: '',
            wbsTasks: [],
            costItems: [],
            riskItems: [],
            communicationItems: [],
            qualityItems: [],
            resourceItems: [],
            procurementItems: [],
            milestones: [],
            resources: '',
            timeline: '',
            dependencies: '',
            notes: ''
        }
    }

    // Cost Management functions
    const addCostItem = () => {
        const newCostItem: CostItem = {
            id: `cost-${Date.now()}`,
            category: '',
            description: '',
            estimatedCost: '',
            actualCost: '',
            variance: '',
            notes: ''
        }

        const currentCosts = currentDetail.costItems || []
        updateDeliverableDetail(selectedDeliverableId, 'costItems', [...currentCosts, newCostItem])
    }

    const updateCostItem = (costId: string, field: keyof CostItem, value: string) => {
        const currentCosts = currentDetail.costItems || []
        const updatedCosts = currentCosts.map(cost => {
            if (cost.id === costId) {
                const updated = { ...cost, [field]: value }
                // Auto-calculate variance if both estimated and actual are set
                if (field === 'estimatedCost' || field === 'actualCost') {
                    const estimated = parseFloat(field === 'estimatedCost' ? value : cost.estimatedCost) || 0
                    const actual = parseFloat(field === 'actualCost' ? value : cost.actualCost) || 0
                    if (estimated && actual) {
                        updated.variance = (actual - estimated).toString()
                    }
                }
                return updated
            }
            return cost
        })
        updateDeliverableDetail(selectedDeliverableId, 'costItems', updatedCosts)
    }

    const deleteCostItem = (costId: string) => {
        const currentCosts = currentDetail.costItems || []
        updateDeliverableDetail(selectedDeliverableId, 'costItems', currentCosts.filter(c => c.id !== costId))
    }

    // Risk Management functions
    const addRiskItem = () => {
        const newRiskItem: RiskItem = {
            id: `risk-${Date.now()}`,
            riskId: '',
            description: '',
            probability: 'Medium',
            impact: 'Medium',
            severity: 'Minor',
            mitigationStrategy: '',
            owner: '',
            status: 'Active'
        }

        const currentRisks = currentDetail.riskItems || []
        updateDeliverableDetail(selectedDeliverableId, 'riskItems', [...currentRisks, newRiskItem])
    }

    const updateRiskItem = (riskId: string, field: keyof RiskItem, value: any) => {
        const currentRisks = currentDetail.riskItems || []
        updateDeliverableDetail(selectedDeliverableId, 'riskItems',
            currentRisks.map(risk => risk.id === riskId ? { ...risk, [field]: value } : risk)
        )
    }

    const deleteRiskItem = (riskId: string) => {
        const currentRisks = currentDetail.riskItems || []
        updateDeliverableDetail(selectedDeliverableId, 'riskItems', currentRisks.filter(r => r.id !== riskId))
    }

    // Communication Plan functions
    const addCommunicationItem = () => {
        const newCommItem: CommunicationItem = {
            id: `comm-${Date.now()}`,
            stakeholder: '',
            role: '',
            infoNeeded: '',
            method: '',
            frequency: '',
            owner: ''
        }

        const currentComms = currentDetail.communicationItems || []
        updateDeliverableDetail(selectedDeliverableId, 'communicationItems', [...currentComms, newCommItem])
    }

    const updateCommunicationItem = (commId: string, field: keyof CommunicationItem, value: string) => {
        const currentComms = currentDetail.communicationItems || []
        updateDeliverableDetail(selectedDeliverableId, 'communicationItems',
            currentComms.map(comm => comm.id === commId ? { ...comm, [field]: value } : comm)
        )
    }

    const deleteCommunicationItem = (commId: string) => {
        const currentComms = currentDetail.communicationItems || []
        updateDeliverableDetail(selectedDeliverableId, 'communicationItems', currentComms.filter(c => c.id !== commId))
    }

    // Quality Planning functions
    const addQualityItem = () => {
        const newQualityItem: QualityItem = {
            id: `quality-${Date.now()}`,
            qualityMetric: '',
            description: '',
            targetStandard: '',
            measurementMethod: '',
            frequency: '',
            responsible: '',
            status: 'Not Started'
        }

        const currentQuality = currentDetail.qualityItems || []
        updateDeliverableDetail(selectedDeliverableId, 'qualityItems', [...currentQuality, newQualityItem])
    }

    const updateQualityItem = (qualityId: string, field: keyof QualityItem, value: any) => {
        const currentQuality = currentDetail.qualityItems || []
        updateDeliverableDetail(selectedDeliverableId, 'qualityItems',
            currentQuality.map(item => item.id === qualityId ? { ...item, [field]: value } : item)
        )
    }

    const deleteQualityItem = (qualityId: string) => {
        const currentQuality = currentDetail.qualityItems || []
        updateDeliverableDetail(selectedDeliverableId, 'qualityItems', currentQuality.filter(q => q.id !== qualityId))
    }

    // Resource Management functions
    const addResourceItem = () => {
        const newResourceItem: ResourceItem = {
            id: `resource-${Date.now()}`,
            resourceName: '',
            role: '',
            skills: '',
            allocation: '',
            startDate: '',
            endDate: '',
            costRate: '',
            status: 'Available'
        }

        const currentResources = currentDetail.resourceItems || []
        updateDeliverableDetail(selectedDeliverableId, 'resourceItems', [...currentResources, newResourceItem])
    }

    const updateResourceItem = (resourceId: string, field: keyof ResourceItem, value: any) => {
        const currentResources = currentDetail.resourceItems || []
        updateDeliverableDetail(selectedDeliverableId, 'resourceItems',
            currentResources.map(item => item.id === resourceId ? { ...item, [field]: value } : item)
        )
    }

    const deleteResourceItem = (resourceId: string) => {
        const currentResources = currentDetail.resourceItems || []
        updateDeliverableDetail(selectedDeliverableId, 'resourceItems', currentResources.filter(r => r.id !== resourceId))
    }

    // Procurement Planning functions
    const addProcurementItem = () => {
        const newProcurementItem: ProcurementItem = {
            id: `procurement-${Date.now()}`,
            itemService: '',
            description: '',
            vendorSupplier: '',
            estimatedCost: '',
            deliveryDate: '',
            contractStatus: 'Not Started',
            owner: '',
            notes: ''
        }

        const currentProcurement = currentDetail.procurementItems || []
        updateDeliverableDetail(selectedDeliverableId, 'procurementItems', [...currentProcurement, newProcurementItem])
    }

    const updateProcurementItem = (procurementId: string, field: keyof ProcurementItem, value: any) => {
        const currentProcurement = currentDetail.procurementItems || []
        updateDeliverableDetail(selectedDeliverableId, 'procurementItems',
            currentProcurement.map(item => item.id === procurementId ? { ...item, [field]: value } : item)
        )
    }

    const deleteProcurementItem = (procurementId: string) => {
        const currentProcurement = currentDetail.procurementItems || []
        updateDeliverableDetail(selectedDeliverableId, 'procurementItems', currentProcurement.filter(p => p.id !== procurementId))
    }

    // WBS-specific functions
    const addWBSTask = () => {
        const newTask: WBSTask = {
            id: `task-${Date.now()}`,
            level: 1,
            milestone: '',
            task: '',
            subtask: '',
            assignedTo: '',
            start: '',
            end: '',
            status: 'Pending',
            dependency: '',
            subtasks: []
        }

        const currentTasks = currentDetail.wbsTasks || []
        updateDeliverableDetail(selectedDeliverableId, 'wbsTasks', [...currentTasks, newTask])
    }

    const addSubtask = (parentTaskId: string) => {
        const currentTasks = currentDetail.wbsTasks || []
        const addSubtaskRecursive = (tasks: WBSTask[]): WBSTask[] => {
            return tasks.map(task => {
                if (task.id === parentTaskId) {
                    const newSubtask: WBSTask = {
                        id: `subtask-${Date.now()}`,
                        level: task.level + 1,
                        milestone: '',
                        task: '',
                        subtask: '',
                        assignedTo: '',
                        start: '',
                        end: '',
                        status: 'Pending',
                        dependency: ''
                    }
                    return {
                        ...task,
                        subtasks: [...(task.subtasks || []), newSubtask]
                    }
                }
                if (task.subtasks && task.subtasks.length > 0) {
                    return {
                        ...task,
                        subtasks: addSubtaskRecursive(task.subtasks)
                    }
                }
                return task
            })
        }

        updateDeliverableDetail(selectedDeliverableId, 'wbsTasks', addSubtaskRecursive(currentTasks))
    }

    const updateWBSTask = (taskId: string, field: keyof WBSTask, value: any) => {
        const currentTasks = currentDetail.wbsTasks || []
        const updateTaskRecursive = (tasks: WBSTask[]): WBSTask[] => {
            return tasks.map(task => {
                if (task.id === taskId) {
                    return { ...task, [field]: value }
                }
                if (task.subtasks && task.subtasks.length > 0) {
                    return {
                        ...task,
                        subtasks: updateTaskRecursive(task.subtasks)
                    }
                }
                return task
            })
        }

        updateDeliverableDetail(selectedDeliverableId, 'wbsTasks', updateTaskRecursive(currentTasks))
    }

    const deleteWBSTask = (taskId: string) => {
        const currentTasks = currentDetail.wbsTasks || []
        const deleteTaskRecursive = (tasks: WBSTask[]): WBSTask[] => {
            return tasks.filter(task => {
                if (task.id === taskId) return false
                if (task.subtasks && task.subtasks.length > 0) {
                    task.subtasks = deleteTaskRecursive(task.subtasks)
                }
                return true
            })
        }

        updateDeliverableDetail(selectedDeliverableId, 'wbsTasks', deleteTaskRecursive(currentTasks))
    }

    const updateDeliverableDetail = (id: string, field: keyof DeliverableDetail, value: any) => {
        setDeliverableDetails({
            ...deliverableDetails,
            [id]: {
                ...getDeliverableDetail(id),
                [field]: value
            }
        })
    }

    const selectedDeliverable = deliverables.find(d => d.id === selectedDeliverableId)
    const currentDetail = getDeliverableDetail(selectedDeliverableId)

    // Calculate real metrics from actual data
    const calculateMetrics = () => {
        const totalTasks = Object.values(deliverableDetails).reduce((sum, detail) =>
            sum + (detail.milestones?.reduce((mSum, m) => mSum + (m.tasks?.length || 0), 0) || 0), 0
        )

        const totalMilestones = Object.values(deliverableDetails).reduce((sum, detail) =>
            sum + (detail.milestones?.length || 0), 0
        )

        const completedDeliverables = deliverables.filter(d => d.status === 'completed').length
        const planningCompletion = deliverables.length > 0
            ? Math.round((completedDeliverables / deliverables.length) * 100)
            : 0

        return {
            tasksPlanned: totalTasks,
            milestonesSet: totalMilestones,
            deliverablesCompleted: completedDeliverables,
            totalDeliverables: deliverables.length,
            planningCompletion
        }
    }

    const planningMetrics = calculateMetrics()

    return (
        <div className="space-y-6">
            {/* Loading Indicator */}
            {!dataLoaded && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium">Loading planning data...</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Frozen Status Indicator */}
            {planningFrozen && (
                <Card className="bg-blue-50 border-blue-300">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-blue-900">Planning is Frozen</h3>
                                    <p className="text-sm text-blue-700">All planning deliverables are locked. Execution tracking is now enabled.</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={unfreezePlanning}
                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                                Unfreeze Planning
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Save Button & Status */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                    <Button
                        type="button"
                        size="sm"
                        onClick={savePlanningData}
                        disabled={isSaving || planningFrozen}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Save className="h-3 w-3 mr-2" />
                        {isSaving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                    {!planningFrozen && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={freezePlanning}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <CheckCircle className="h-3 w-3 mr-2" />
                            Freeze Planning
                        </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                        {planningFrozen ? '🔒 Planning is locked' : '💡 Click to save milestones and deliverables'}
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

            {/* Planning Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Planning Progress</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{planningMetrics.planningCompletion}%</div>
                        <Progress value={planningMetrics.planningCompletion} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {planningMetrics.deliverablesCompleted} of {planningMetrics.totalDeliverables} deliverables done
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Milestones</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{planningMetrics.milestonesSet}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {planningMetrics.tasksPlanned} tasks planned
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Deliverables</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{planningMetrics.deliverablesCompleted}/{planningMetrics.totalDeliverables}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Plans completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{planningMetrics.tasksPlanned}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Total tasks defined
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Planning Deliverables */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Planning Deliverables</span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={savePlanningData}
                            disabled={isSaving}
                        >
                            <Save className="h-3 w-3 mr-2" />
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        Click on any deliverable to plan it • Click on status badges to update progress
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                        {deliverables.map((deliverable) => (
                            <div
                                key={deliverable.id}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedDeliverableId === deliverable.id
                                    ? 'bg-purple-50 border-purple-300 shadow-md ring-2 ring-purple-200'
                                    : 'bg-card hover:bg-accent/50 hover:border-accent'
                                    }`}
                                onClick={() => setSelectedDeliverableId(deliverable.id)}
                            >
                                <span className={`text-sm font-medium ${selectedDeliverableId === deliverable.id ? 'text-purple-900' : ''
                                    }`}>
                                    {selectedDeliverableId === deliverable.id && '▶ '}
                                    {deliverable.item}
                                </span>
                                <Badge
                                    variant="outline"
                                    className={`cursor-pointer transition-all hover:scale-105 ${deliverable.status === 'completed'
                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                        : deliverable.status === 'in-progress'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    onClick={(e) => {
                                        e.stopPropagation() // Prevent selecting the deliverable when clicking status
                                        const statusCycle: Array<'pending' | 'in-progress' | 'completed'> = ['pending', 'in-progress', 'completed']
                                        const currentIndex = statusCycle.indexOf(deliverable.status)
                                        const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length]
                                        updateDeliverableStatus(deliverable.id, nextStatus)
                                    }}
                                >
                                    {deliverable.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {deliverable.status === 'completed' ? 'Done' :
                                        deliverable.status === 'in-progress' ? 'In Progress' : 'Pending'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Deliverable-Specific Planning Form */}
            {selectedDeliverable && (
                <Card className="border-purple-200 shadow-lg overflow-visible">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-purple-600" />
                                <span className="text-purple-900">{selectedDeliverable.item}</span>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={savePlanningData}
                                disabled={isSaving}
                                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                                <Save className="h-3 w-3 mr-2" />
                                {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            Plan and document this deliverable • All changes are saved when you click Save
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 overflow-visible">
                        {/* WBS Table View (only for Work Breakdown Structure) */}
                        {selectedDeliverableId === '1' ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Define tasks and subtasks for the project work breakdown structure
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addWBSTask}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Task
                                    </Button>
                                </div>

                                {/* WBS Table */}
                                <div className="border rounded-lg overflow-visible">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted border-b">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Level</th>
                                                    <th className="text-left p-3 font-medium">Milestone</th>
                                                    <th className="text-left p-3 font-medium">Task</th>
                                                    <th className="text-left p-3 font-medium">Subtask</th>
                                                    <th className="text-left p-3 font-medium">Assigned To</th>
                                                    <th className="text-left p-3 font-medium">Start</th>
                                                    <th className="text-left p-3 font-medium">End</th>
                                                    <th className="text-left p-3 font-medium">Status</th>
                                                    <th className="text-left p-3 font-medium">Dependency</th>
                                                    <th className="text-left p-3 font-medium w-24">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(currentDetail.wbsTasks || []).length === 0 ? (
                                                    <tr>
                                                        <td colSpan={10} className="text-center p-8 text-muted-foreground">
                                                            No tasks yet. Click &quot;Add Task&quot; to get started.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    (currentDetail.wbsTasks || []).map((task) => (
                                                        <WBSTaskRow
                                                            key={task.id}
                                                            task={task}
                                                            onUpdate={updateWBSTask}
                                                            onDelete={deleteWBSTask}
                                                            onAddSubtask={addSubtask}
                                                            orgUsers={orgUsers}
                                                        />
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : selectedDeliverableId === '2' ? (
                            // Cost Management Table View (only for Cost Management Planning)
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Define budget categories and track costs
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addCostItem}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Cost Item
                                    </Button>
                                </div>

                                {/* Cost Management Table */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted border-b">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Category</th>
                                                    <th className="text-left p-3 font-medium">Description</th>
                                                    <th className="text-left p-3 font-medium">Estimated Cost (₹)</th>
                                                    <th className="text-left p-3 font-medium">Actual Cost (₹)</th>
                                                    <th className="text-left p-3 font-medium">Variance</th>
                                                    <th className="text-left p-3 font-medium">Notes</th>
                                                    <th className="text-left p-3 font-medium w-16">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(currentDetail.costItems || []).length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="text-center p-8 text-muted-foreground">
                                                            No cost items yet. Click &quot;Add Cost Item&quot; to get started.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    (currentDetail.costItems || []).map((cost) => (
                                                        <tr key={cost.id} className="border-b hover:bg-muted/50">
                                                            <td className="p-2">
                                                                <Input
                                                                    value={cost.category}
                                                                    onChange={(e) => updateCostItem(cost.id, 'category', e.target.value)}
                                                                    placeholder="Design"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={cost.description}
                                                                    onChange={(e) => updateCostItem(cost.id, 'description', e.target.value)}
                                                                    placeholder="Wireframes, Mockups"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    type="text"
                                                                    value={cost.estimatedCost}
                                                                    onChange={(e) => updateCostItem(cost.id, 'estimatedCost', e.target.value)}
                                                                    placeholder="25,000"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    type="text"
                                                                    value={cost.actualCost}
                                                                    onChange={(e) => updateCostItem(cost.id, 'actualCost', e.target.value)}
                                                                    placeholder="26,000"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={cost.variance}
                                                                    onChange={(e) => updateCostItem(cost.id, 'variance', e.target.value)}
                                                                    placeholder="-1,000"
                                                                    className="h-8"
                                                                    readOnly
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={cost.notes}
                                                                    onChange={(e) => updateCostItem(cost.id, 'notes', e.target.value)}
                                                                    placeholder="Minor overshoot"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => deleteCostItem(cost.id)}
                                                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    title="Delete Cost Item"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : selectedDeliverableId === '3' ? (
                            // Risk Management Table View (only for Risk Management Planning)
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Identify and track project risks with mitigation strategies
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addRiskItem}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Risk
                                    </Button>
                                </div>

                                {/* Risk Management Table */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted border-b">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Risk ID</th>
                                                    <th className="text-left p-3 font-medium">Description</th>
                                                    <th className="text-left p-3 font-medium">Probability</th>
                                                    <th className="text-left p-3 font-medium">Impact</th>
                                                    <th className="text-left p-3 font-medium">Severity</th>
                                                    <th className="text-left p-3 font-medium">Mitigation Strategy</th>
                                                    <th className="text-left p-3 font-medium">Owner</th>
                                                    <th className="text-left p-3 font-medium">Status</th>
                                                    <th className="text-left p-3 font-medium w-16">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(currentDetail.riskItems || []).length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="text-center p-8 text-muted-foreground">
                                                            No risks yet. Click &quot;Add Risk&quot; to get started.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    (currentDetail.riskItems || []).map((risk) => (
                                                        <tr key={risk.id} className="border-b hover:bg-muted/50">
                                                            <td className="p-2">
                                                                <Input
                                                                    value={risk.riskId}
                                                                    onChange={(e) => updateRiskItem(risk.id, 'riskId', e.target.value)}
                                                                    placeholder="R1"
                                                                    className="h-8 w-16"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={risk.description}
                                                                    onChange={(e) => updateRiskItem(risk.id, 'description', e.target.value)}
                                                                    placeholder="Scope creep"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Select value={risk.probability} onValueChange={(value: any) => updateRiskItem(risk.id, 'probability', value)}>
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="High">High</SelectItem>
                                                                        <SelectItem value="Medium">Medium</SelectItem>
                                                                        <SelectItem value="Low">Low</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="p-2">
                                                                <Select value={risk.impact} onValueChange={(value: any) => updateRiskItem(risk.id, 'impact', value)}>
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="High">High</SelectItem>
                                                                        <SelectItem value="Medium">Medium</SelectItem>
                                                                        <SelectItem value="Low">Low</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="p-2">
                                                                <Select value={risk.severity} onValueChange={(value: any) => updateRiskItem(risk.id, 'severity', value)}>
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Critical">
                                                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                                                🔴 Critical
                                                                            </Badge>
                                                                        </SelectItem>
                                                                        <SelectItem value="Major">
                                                                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                                                🟠 Major
                                                                            </Badge>
                                                                        </SelectItem>
                                                                        <SelectItem value="Minor">
                                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                                🟢 Minor
                                                                            </Badge>
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={risk.mitigationStrategy}
                                                                    onChange={(e) => updateRiskItem(risk.id, 'mitigationStrategy', e.target.value)}
                                                                    placeholder="Strict change approval process"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={risk.owner}
                                                                    onChange={(e) => updateRiskItem(risk.id, 'owner', e.target.value)}
                                                                    placeholder="PM"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Select value={risk.status} onValueChange={(value: any) => updateRiskItem(risk.id, 'status', value)}>
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Active">Active</SelectItem>
                                                                        <SelectItem value="Mitigated">Mitigated</SelectItem>
                                                                        <SelectItem value="Closed">Closed</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="p-2">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => deleteRiskItem(risk.id)}
                                                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    title="Delete Risk"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : selectedDeliverableId === '4' ? (
                            // Communication Plan Table View (only for Communication Plan)
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Define stakeholder communication strategy and frequency
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addCommunicationItem}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Stakeholder
                                    </Button>
                                </div>

                                {/* Communication Plan Table */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted border-b">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Stakeholder</th>
                                                    <th className="text-left p-3 font-medium">Role</th>
                                                    <th className="text-left p-3 font-medium">Info Needed</th>
                                                    <th className="text-left p-3 font-medium">Method</th>
                                                    <th className="text-left p-3 font-medium">Frequency</th>
                                                    <th className="text-left p-3 font-medium">Owner</th>
                                                    <th className="text-left p-3 font-medium w-16">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(currentDetail.communicationItems || []).length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="text-center p-8 text-muted-foreground">
                                                            No stakeholders yet. Click &quot;Add Stakeholder&quot; to get started.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    (currentDetail.communicationItems || []).map((comm) => (
                                                        <tr key={comm.id} className="border-b hover:bg-muted/50">
                                                            <td className="p-2">
                                                                <Input
                                                                    value={comm.stakeholder}
                                                                    onChange={(e) => updateCommunicationItem(comm.id, 'stakeholder', e.target.value)}
                                                                    placeholder="Client"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={comm.role}
                                                                    onChange={(e) => updateCommunicationItem(comm.id, 'role', e.target.value)}
                                                                    placeholder="Sponsor"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={comm.infoNeeded}
                                                                    onChange={(e) => updateCommunicationItem(comm.id, 'infoNeeded', e.target.value)}
                                                                    placeholder="Weekly Status"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={comm.method}
                                                                    onChange={(e) => updateCommunicationItem(comm.id, 'method', e.target.value)}
                                                                    placeholder="Email + Zoom"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={comm.frequency}
                                                                    onChange={(e) => updateCommunicationItem(comm.id, 'frequency', e.target.value)}
                                                                    placeholder="Weekly"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={comm.owner}
                                                                    onChange={(e) => updateCommunicationItem(comm.id, 'owner', e.target.value)}
                                                                    placeholder="PM"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => deleteCommunicationItem(comm.id)}
                                                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    title="Delete Stakeholder"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : selectedDeliverableId === '5' ? (
                            // Quality Planning Table View (only for Quality Planning)
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Define quality standards, metrics, and measurement methods
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addQualityItem}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Quality Metric
                                    </Button>
                                </div>

                                {/* Quality Planning Table */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted border-b">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Quality Metric</th>
                                                    <th className="text-left p-3 font-medium">Description</th>
                                                    <th className="text-left p-3 font-medium">Target/Standard</th>
                                                    <th className="text-left p-3 font-medium">Measurement Method</th>
                                                    <th className="text-left p-3 font-medium">Frequency</th>
                                                    <th className="text-left p-3 font-medium">Responsible</th>
                                                    <th className="text-left p-3 font-medium">Status</th>
                                                    <th className="text-left p-3 font-medium w-16">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(currentDetail.qualityItems || []).length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className="text-center p-8 text-muted-foreground">
                                                            No quality metrics yet. Click &quot;Add Quality Metric&quot; to get started.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    (currentDetail.qualityItems || []).map((quality) => (
                                                        <tr key={quality.id} className="border-b hover:bg-muted/50">
                                                            <td className="p-2">
                                                                <Input
                                                                    value={quality.qualityMetric}
                                                                    onChange={(e) => updateQualityItem(quality.id, 'qualityMetric', e.target.value)}
                                                                    placeholder="Code Quality"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={quality.description}
                                                                    onChange={(e) => updateQualityItem(quality.id, 'description', e.target.value)}
                                                                    placeholder="Zero critical bugs"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={quality.targetStandard}
                                                                    onChange={(e) => updateQualityItem(quality.id, 'targetStandard', e.target.value)}
                                                                    placeholder="95% test coverage"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={quality.measurementMethod}
                                                                    onChange={(e) => updateQualityItem(quality.id, 'measurementMethod', e.target.value)}
                                                                    placeholder="Automated testing"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={quality.frequency}
                                                                    onChange={(e) => updateQualityItem(quality.id, 'frequency', e.target.value)}
                                                                    placeholder="Daily"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={quality.responsible}
                                                                    onChange={(e) => updateQualityItem(quality.id, 'responsible', e.target.value)}
                                                                    placeholder="QA Lead"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Select value={quality.status} onValueChange={(value: any) => updateQualityItem(quality.id, 'status', value)}>
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Not Started">Not Started</SelectItem>
                                                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                                                        <SelectItem value="Completed">Completed</SelectItem>
                                                                        <SelectItem value="Failed">Failed</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="p-2">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => deleteQualityItem(quality.id)}
                                                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    title="Delete Quality Metric"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : selectedDeliverableId === '6' ? (
                            // Resource Management Table View (only for Resource Management)
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Manage team resources, skills, and allocation
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addResourceItem}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Resource
                                    </Button>
                                </div>

                                {/* Resource Management Table */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted border-b">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Resource Name</th>
                                                    <th className="text-left p-3 font-medium">Role/Position</th>
                                                    <th className="text-left p-3 font-medium">Skills</th>
                                                    <th className="text-left p-3 font-medium">Allocation %</th>
                                                    <th className="text-left p-3 font-medium">Start Date</th>
                                                    <th className="text-left p-3 font-medium">End Date</th>
                                                    <th className="text-left p-3 font-medium">Cost/Rate</th>
                                                    <th className="text-left p-3 font-medium">Status</th>
                                                    <th className="text-left p-3 font-medium w-16">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(currentDetail.resourceItems || []).length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="text-center p-8 text-muted-foreground">
                                                            No resources yet. Click &quot;Add Resource&quot; to get started.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    (currentDetail.resourceItems || []).map((resource) => (
                                                        <tr key={resource.id} className="border-b hover:bg-muted/50">
                                                            <td className="p-2">
                                                                <Input
                                                                    value={resource.resourceName}
                                                                    onChange={(e) => updateResourceItem(resource.id, 'resourceName', e.target.value)}
                                                                    placeholder="John Doe"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={resource.role}
                                                                    onChange={(e) => updateResourceItem(resource.id, 'role', e.target.value)}
                                                                    placeholder="Frontend Developer"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={resource.skills}
                                                                    onChange={(e) => updateResourceItem(resource.id, 'skills', e.target.value)}
                                                                    placeholder="React, TypeScript"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={resource.allocation}
                                                                    onChange={(e) => updateResourceItem(resource.id, 'allocation', e.target.value)}
                                                                    placeholder="100%"
                                                                    className="h-8 w-20"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    type="date"
                                                                    value={resource.startDate}
                                                                    onChange={(e) => updateResourceItem(resource.id, 'startDate', e.target.value)}
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    type="date"
                                                                    value={resource.endDate}
                                                                    onChange={(e) => updateResourceItem(resource.id, 'endDate', e.target.value)}
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={resource.costRate}
                                                                    onChange={(e) => updateResourceItem(resource.id, 'costRate', e.target.value)}
                                                                    placeholder="₹5000/day"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Select value={resource.status} onValueChange={(value: any) => updateResourceItem(resource.id, 'status', value)}>
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Available">Available</SelectItem>
                                                                        <SelectItem value="Allocated">Allocated</SelectItem>
                                                                        <SelectItem value="Overallocated">Overallocated</SelectItem>
                                                                        <SelectItem value="Unavailable">Unavailable</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="p-2">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => deleteResourceItem(resource.id)}
                                                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    title="Delete Resource"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : selectedDeliverableId === '7' ? (
                            // Procurement Planning Table View (only for Procurement Planning)
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Plan procurement of items, services, and vendor contracts
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addProcurementItem}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Procurement Item
                                    </Button>
                                </div>

                                {/* Procurement Planning Table */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted border-b">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Item/Service</th>
                                                    <th className="text-left p-3 font-medium">Description</th>
                                                    <th className="text-left p-3 font-medium">Vendor/Supplier</th>
                                                    <th className="text-left p-3 font-medium">Estimated Cost</th>
                                                    <th className="text-left p-3 font-medium">Delivery Date</th>
                                                    <th className="text-left p-3 font-medium">Contract Status</th>
                                                    <th className="text-left p-3 font-medium">Owner</th>
                                                    <th className="text-left p-3 font-medium">Notes</th>
                                                    <th className="text-left p-3 font-medium w-16">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(currentDetail.procurementItems || []).length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="text-center p-8 text-muted-foreground">
                                                            No procurement items yet. Click &quot;Add Procurement Item&quot; to get started.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    (currentDetail.procurementItems || []).map((procurement) => (
                                                        <tr key={procurement.id} className="border-b hover:bg-muted/50">
                                                            <td className="p-2">
                                                                <Input
                                                                    value={procurement.itemService}
                                                                    onChange={(e) => updateProcurementItem(procurement.id, 'itemService', e.target.value)}
                                                                    placeholder="Cloud Hosting"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={procurement.description}
                                                                    onChange={(e) => updateProcurementItem(procurement.id, 'description', e.target.value)}
                                                                    placeholder="AWS EC2 instances"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={procurement.vendorSupplier}
                                                                    onChange={(e) => updateProcurementItem(procurement.id, 'vendorSupplier', e.target.value)}
                                                                    placeholder="Amazon Web Services"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={procurement.estimatedCost}
                                                                    onChange={(e) => updateProcurementItem(procurement.id, 'estimatedCost', e.target.value)}
                                                                    placeholder="₹50,000"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    type="date"
                                                                    value={procurement.deliveryDate}
                                                                    onChange={(e) => updateProcurementItem(procurement.id, 'deliveryDate', e.target.value)}
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Select value={procurement.contractStatus} onValueChange={(value: any) => updateProcurementItem(procurement.id, 'contractStatus', value)}>
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Not Started">Not Started</SelectItem>
                                                                        <SelectItem value="In Negotiation">In Negotiation</SelectItem>
                                                                        <SelectItem value="Approved">Approved</SelectItem>
                                                                        <SelectItem value="Completed">Completed</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={procurement.owner}
                                                                    onChange={(e) => updateProcurementItem(procurement.id, 'owner', e.target.value)}
                                                                    placeholder="PM"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Input
                                                                    value={procurement.notes}
                                                                    onChange={(e) => updateProcurementItem(procurement.id, 'notes', e.target.value)}
                                                                    placeholder="Annual contract"
                                                                    className="h-8"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => deleteProcurementItem(procurement.id)}
                                                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    title="Delete Procurement Item"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Regular form for other deliverables (fallback, though all are now tables)
                            <>
                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe the purpose and overview of this deliverable..."
                                        value={currentDetail.description}
                                        onChange={(e) => updateDeliverableDetail(selectedDeliverableId, 'description', e.target.value)}
                                        rows={3}
                                        className="resize-none"
                                    />
                                </div>

                                {/* Objectives */}
                                <div className="space-y-2">
                                    <Label htmlFor="objectives">Objectives & Goals</Label>
                                    <Textarea
                                        id="objectives"
                                        placeholder="What are the key objectives of this deliverable?"
                                        value={currentDetail.objectives}
                                        onChange={(e) => updateDeliverableDetail(selectedDeliverableId, 'objectives', e.target.value)}
                                        rows={3}
                                        className="resize-none"
                                    />
                                </div>

                                {/* Scope */}
                                <div className="space-y-2">
                                    <Label htmlFor="scope">Scope & Boundaries</Label>
                                    <Textarea
                                        id="scope"
                                        placeholder="Define what is included and excluded in this deliverable..."
                                        value={currentDetail.scope}
                                        onChange={(e) => updateDeliverableDetail(selectedDeliverableId, 'scope', e.target.value)}
                                        rows={3}
                                        className="resize-none"
                                    />
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    {/* Resources */}
                                    <div className="space-y-2">
                                        <Label htmlFor="resources">Resources Required</Label>
                                        <Textarea
                                            id="resources"
                                            placeholder="Team members, tools, budget..."
                                            value={currentDetail.resources}
                                            onChange={(e) => updateDeliverableDetail(selectedDeliverableId, 'resources', e.target.value)}
                                            rows={4}
                                            className="resize-none"
                                        />
                                    </div>

                                    {/* Timeline */}
                                    <div className="space-y-2">
                                        <Label htmlFor="timeline">Timeline & Milestones</Label>
                                        <Textarea
                                            id="timeline"
                                            placeholder="Key dates and milestones..."
                                            value={currentDetail.timeline}
                                            onChange={(e) => updateDeliverableDetail(selectedDeliverableId, 'timeline', e.target.value)}
                                            rows={4}
                                            className="resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Dependencies */}
                                <div className="space-y-2">
                                    <Label htmlFor="dependencies">Dependencies & Assumptions</Label>
                                    <Textarea
                                        id="dependencies"
                                        placeholder="What does this deliverable depend on? What assumptions are being made?"
                                        value={currentDetail.dependencies}
                                        onChange={(e) => updateDeliverableDetail(selectedDeliverableId, 'dependencies', e.target.value)}
                                        rows={3}
                                        className="resize-none"
                                    />
                                </div>

                                {/* Additional Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Additional Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Any other relevant information..."
                                        value={currentDetail.notes}
                                        onChange={(e) => updateDeliverableDetail(selectedDeliverableId, 'notes', e.target.value)}
                                        rows={3}
                                        className="resize-none"
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

