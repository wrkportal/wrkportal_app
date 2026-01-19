'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Save, Play, Pause } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay'
  label: string
  config: any
  position: { x: number; y: number }
  connections?: string[] // IDs of connected nodes
}

interface WorkflowBuilderProps {
  onSave?: (workflow: any) => void
  initialWorkflow?: any
}

export function WorkflowBuilder({ onSave, initialWorkflow }: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialWorkflow?.nodes || [])
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || '')
  const [workflowDescription, setWorkflowDescription] = useState(initialWorkflow?.description || '')

  const addNode = useCallback((type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      label: getDefaultLabel(type),
      config: getDefaultConfig(type),
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      connections: [],
    }
    setNodes(prev => [...prev, newNode])
    setSelectedNode(newNode)
  }, [])

  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId))
    // Remove connections to this node
    setNodes(prev => prev.map(n => ({
      ...n,
      connections: n.connections?.filter(c => c !== nodeId) || [],
    })))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }, [selectedNode])

  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n))
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, ...updates })
    }
  }, [selectedNode])

  const connectNodes = useCallback((fromId: string, toId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === fromId) {
        return {
          ...n,
          connections: [...(n.connections || []), toId],
        }
      }
      return n
    }))
  }, [])

  const handleSave = useCallback(() => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name')
      return
    }

    // Convert visual workflow to automation rule format
    const workflow = {
      name: workflowName,
      description: workflowDescription,
      nodes,
      // Convert to automation rule format
      triggerType: nodes.find(n => n.type === 'trigger')?.config?.triggerType || 'LEAD_CREATED',
      triggerConditions: nodes.find(n => n.type === 'trigger')?.config?.conditions || {},
      actionType: nodes.find(n => n.type === 'action')?.config?.actionType || 'CREATE_TASK',
      actionConfig: buildActionConfig(nodes),
    }

    onSave?.(workflow)
  }, [workflowName, workflowDescription, nodes, onSave])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Input
            placeholder="Workflow Name"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-lg font-semibold"
          />
          <Textarea
            placeholder="Workflow Description"
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            className="text-sm"
          />
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Workflow
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Toolbar */}
        <div className="col-span-2 space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Add Node</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('trigger')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Trigger
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('condition')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Condition
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('action')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Action
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('delay')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Delay
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Canvas */}
        <div className="col-span-8">
          <Card className="h-[600px] relative overflow-auto bg-gray-50 dark:bg-gray-900">
            <CardContent className="p-4">
              {nodes.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <p className="mb-2">No nodes yet</p>
                    <p className="text-sm">Add nodes from the toolbar to build your workflow</p>
                  </div>
                </div>
              ) : (
                <div className="relative" style={{ minHeight: '100%' }}>
                  {nodes.map((node) => (
                    <WorkflowNodeComponent
                      key={node.id}
                      node={node}
                      isSelected={selectedNode?.id === node.id}
                      onSelect={() => setSelectedNode(node)}
                      onUpdate={(updates) => updateNode(node.id, updates)}
                      onDelete={() => removeNode(node.id)}
                      onConnect={(targetId) => connectNodes(node.id, targetId)}
                      availableNodes={nodes.filter(n => n.id !== node.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Properties Panel */}
        <div className="col-span-2">
          {selectedNode ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Node Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <NodePropertiesEditor
                  node={selectedNode}
                  onUpdate={(updates) => updateNode(selectedNode.id, updates)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Select a node to edit properties
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function WorkflowNodeComponent({
  node,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onConnect,
  availableNodes,
}: {
  node: WorkflowNode
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<WorkflowNode>) => void
  onDelete: () => void
  onConnect: (targetId: string) => void
  availableNodes: WorkflowNode[]
}) {
  const getNodeColor = (type: WorkflowNode['type']) => {
    switch (type) {
      case 'trigger': return 'bg-blue-500'
      case 'condition': return 'bg-yellow-500'
      case 'action': return 'bg-green-500'
      case 'delay': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div
      className={`absolute p-3 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-300'
      } ${getNodeColor(node.type)} text-white`}
      style={{
        left: node.position.x,
        top: node.position.y,
        minWidth: '150px',
      }}
      onClick={onSelect}
      onDragEnd={(e) => {
        const rect = e.currentTarget.parentElement?.getBoundingClientRect()
        if (rect) {
          onUpdate({
            position: {
              x: e.clientX - rect.left - 75,
              y: e.clientY - rect.top - 20,
            },
          })
        }
      }}
      draggable
    >
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary" className="text-xs">
          {node.type}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="text-sm font-medium">{node.label}</div>
      {node.connections && node.connections.length > 0 && (
        <div className="text-xs mt-1 opacity-75">
          → {node.connections.length} connection(s)
        </div>
      )}
    </div>
  )
}

function NodePropertiesEditor({
  node,
  onUpdate,
}: {
  node: WorkflowNode
  onUpdate: (updates: Partial<WorkflowNode>) => void
}) {
  const updateConfig = (key: string, value: any) => {
    onUpdate({
      config: {
        ...node.config,
        [key]: value,
      },
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Label</Label>
        <Input
          value={node.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      </div>

      {node.type === 'trigger' && (
        <>
          <div>
            <Label>Trigger Type</Label>
            <Select
              value={node.config.triggerType || 'LEAD_CREATED'}
              onValueChange={(value) => updateConfig('triggerType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEAD_CREATED">Lead Created</SelectItem>
                <SelectItem value="LEAD_STATUS_CHANGED">Lead Status Changed</SelectItem>
                <SelectItem value="OPPORTUNITY_CREATED">Opportunity Created</SelectItem>
                <SelectItem value="QUOTE_SENT">Quote Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {node.type === 'action' && (
        <>
          <div>
            <Label>Action Type</Label>
            <Select
              value={node.config.actionType || 'CREATE_TASK'}
              onValueChange={(value) => updateConfig('actionType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ASSIGN_LEAD">Assign Lead</SelectItem>
                <SelectItem value="SEND_EMAIL">Send Email</SelectItem>
                <SelectItem value="CREATE_TASK">Create Task</SelectItem>
                <SelectItem value="NOTIFY_USER">Notify User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {node.type === 'delay' && (
        <>
          <div>
            <Label>Delay (days)</Label>
            <Input
              type="number"
              value={node.config.delayDays || 0}
              onChange={(e) => updateConfig('delayDays', parseInt(e.target.value) || 0)}
            />
          </div>
        </>
      )}
    </div>
  )
}

function getDefaultLabel(type: WorkflowNode['type']): string {
  switch (type) {
    case 'trigger': return 'When Lead Created'
    case 'condition': return 'If Condition'
    case 'action': return 'Then Action'
    case 'delay': return 'Wait 1 Day'
    default: return 'Node'
  }
}

function getDefaultConfig(type: WorkflowNode['type']): any {
  switch (type) {
    case 'trigger':
      return { triggerType: 'LEAD_CREATED', conditions: {} }
    case 'condition':
      return { field: '', operator: 'equals', value: '' }
    case 'action':
      return { actionType: 'CREATE_TASK', config: {} }
    case 'delay':
      return { delayDays: 1 }
    default:
      return {}
  }
}

function buildActionConfig(nodes: WorkflowNode[]): any {
  // Build action config from workflow nodes
  const actionNode = nodes.find(n => n.type === 'action')
  if (!actionNode) return {}

  return {
    actionType: actionNode.config.actionType,
    ...actionNode.config.config,
  }
}

