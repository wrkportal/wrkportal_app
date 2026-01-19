'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, X, Download, Upload } from 'lucide-react'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay'
  label: string
  config: any
  position: { x: number; y: number }
  connections?: string[] // IDs of connected nodes
}

interface WorkflowBuilderEnhancedProps {
  onSave?: (workflow: any) => void
  initialWorkflow?: any
}

export function WorkflowBuilderEnhanced({ onSave, initialWorkflow }: WorkflowBuilderEnhancedProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialWorkflow?.nodes || [])
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || '')
  const [workflowDescription, setWorkflowDescription] = useState(initialWorkflow?.description || '')
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const addNode = useCallback((type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      label: getDefaultLabel(type),
      config: getDefaultConfig(type),
      position: {
        x: (Math.random() * 300 + 100) / zoom + pan.x,
        y: (Math.random() * 200 + 100) / zoom + pan.y,
      },
      connections: [],
    }
    setNodes(prev => [...prev, newNode])
    setSelectedNode(newNode)
  }, [zoom, pan])

  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId))
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
    if (fromId === toId) return
    
    setNodes(prev => prev.map(n => {
      if (n.id === fromId) {
        const existing = n.connections || []
        if (!existing.includes(toId)) {
          return {
            ...n,
            connections: [...existing, toId],
          }
        }
      }
      return n
    }))
    setConnectingFrom(null)
  }, [])

  const handleSave = useCallback(() => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name')
      return
    }

    const workflow = {
      name: workflowName,
      description: workflowDescription,
      nodes,
      triggerType: nodes.find(n => n.type === 'trigger')?.config?.triggerType || 'LEAD_CREATED',
      triggerConditions: nodes.find(n => n.type === 'trigger')?.config?.conditions || {},
      actionType: nodes.find(n => n.type === 'action')?.config?.actionType || 'CREATE_TASK',
      actionConfig: buildActionConfig(nodes),
    }

    onSave?.(workflow)
  }, [workflowName, workflowDescription, nodes, onSave])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+Left
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }, [isDragging, dragStart])

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom(prev => Math.max(0.5, Math.min(2, prev * delta)))
    }
  }, [])

  const getNodePosition = (node: WorkflowNode) => ({
    x: (node.position.x - pan.x) * zoom,
    y: (node.position.y - pan.y) * zoom,
  })

  const renderConnection = (from: WorkflowNode, toId: string) => {
    const to = nodes.find(n => n.id === toId)
    if (!to) return null

    const fromPos = getNodePosition(from)
    const toPos = getNodePosition(to)

    return (
      <svg
        key={`${from.id}-${toId}`}
        className="absolute pointer-events-none"
        style={{
          left: Math.min(fromPos.x, toPos.x) - 10,
          top: Math.min(fromPos.y, toPos.y) - 10,
          width: Math.abs(toPos.x - fromPos.x) + 20,
          height: Math.abs(toPos.y - fromPos.y) + 20,
        }}
      >
        <path
          d={`M ${fromPos.x - Math.min(fromPos.x, toPos.x) + 10} ${fromPos.y - Math.min(fromPos.y, toPos.y) + 10} L ${toPos.x - Math.min(fromPos.x, toPos.x) + 10} ${toPos.y - Math.min(fromPos.y, toPos.y) + 10}`}
          stroke="#3b82f6"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
        />
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>
      </svg>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1 flex-1">
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
        <div className="flex gap-2 ml-4">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Zoom & Pan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                >
                  -
                </Button>
                <span className="text-sm flex-1 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                >
                  +
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setZoom(1)
                  setPan({ x: 0, y: 0 })
                }}
              >
                Reset View
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Canvas */}
        <div className="col-span-8">
          <Card className="h-[600px] relative overflow-hidden bg-gray-50 dark:bg-gray-900">
            <CardContent className="p-0 h-full">
              <div
                ref={canvasRef}
                className="relative w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onWheel={handleWheel}
              >
                {/* Grid background */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                    `,
                    backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                    transform: `translate(${pan.x}px, ${pan.y}px)`,
                  }}
                />

                {/* Connection lines */}
                {nodes.map(node =>
                  node.connections?.map(connId => renderConnection(node, connId))
                )}

                {/* Nodes */}
                {nodes.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <p className="mb-2">No nodes yet</p>
                      <p className="text-sm">Add nodes from the toolbar to build your workflow</p>
                      <p className="text-xs mt-2">Use Ctrl+Scroll to zoom, Ctrl+Drag to pan</p>
                    </div>
                  </div>
                ) : (
                  nodes.map((node) => {
                    const pos = getNodePosition(node)
                    return (
                      <WorkflowNodeComponent
                        key={node.id}
                        node={node}
                        position={pos}
                        isSelected={selectedNode?.id === node.id}
                        isConnecting={connectingFrom === node.id}
                        onSelect={() => {
                          if (connectingFrom && connectingFrom !== node.id) {
                            connectNodes(connectingFrom, node.id)
                          } else {
                            setSelectedNode(node)
                            setConnectingFrom(null)
                          }
                        }}
                        onUpdate={(updates) => updateNode(node.id, updates)}
                        onDelete={() => removeNode(node.id)}
                        onConnectStart={() => setConnectingFrom(node.id)}
                        onPositionChange={(newPos) => {
                          updateNode(node.id, {
                            position: {
                              x: (newPos.x / zoom) + pan.x,
                              y: (newPos.y / zoom) + pan.y,
                            },
                          })
                        }}
                      />
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Panel */}
        <div className="col-span-2">
          {selectedNode ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Properties</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNode(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <NodePropertiesEditor
                  node={selectedNode}
                  onUpdate={(updates) => updateNode(selectedNode.id, updates)}
                />
                {selectedNode.connections && selectedNode.connections.length > 0 && (
                  <div>
                    <Label>Connections</Label>
                    <div className="space-y-1 mt-2">
                      {selectedNode.connections.map(connId => {
                        const connNode = nodes.find(n => n.id === connId)
                        return connNode ? (
                          <div
                            key={connId}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <span className="text-sm">{connNode.label}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                updateNode(selectedNode.id, {
                                  connections: selectedNode.connections?.filter(c => c !== connId),
                                })
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setConnectingFrom(selectedNode.id)}
                >
                  Connect to Another Node
                </Button>
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
  position,
  isSelected,
  isConnecting,
  onSelect,
  onUpdate,
  onDelete,
  onConnectStart,
  onPositionChange,
}: {
  node: WorkflowNode
  position: { x: number; y: number }
  isSelected: boolean
  isConnecting: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<WorkflowNode>) => void
  onDelete: () => void
  onConnectStart: () => void
  onPositionChange: (pos: { x: number; y: number }) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const getNodeColor = (type: WorkflowNode['type']) => {
    switch (type) {
      case 'trigger': return 'bg-blue-500 hover:bg-blue-600'
      case 'condition': return 'bg-yellow-500 hover:bg-yellow-600'
      case 'action': return 'bg-green-500 hover:bg-green-600'
      case 'delay': return 'bg-purple-500 hover:bg-purple-600'
      default: return 'bg-gray-500'
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
      e.stopPropagation()
    }
  }

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        onPositionChange({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        })
      }

      const handleMouseUp = () => {
        setIsDragging(false)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset, onPositionChange])

  return (
    <div
      className={`absolute p-3 rounded-lg border-2 cursor-move transition-all shadow-lg ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
      } ${isConnecting ? 'ring-2 ring-yellow-400' : ''} ${getNodeColor(node.type)} text-white`}
      style={{
        left: position.x,
        top: position.y,
        minWidth: '150px',
        transform: 'translate(-50%, -50%)',
      }}
      onClick={onSelect}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary" className="text-xs">
          {node.type}
        </Badge>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              onConnectStart()
            }}
            title="Connect"
          >
            <Plus className="h-3 w-3" />
          </Button>
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
  const actionNode = nodes.find(n => n.type === 'action')
  if (!actionNode) return {}

  return {
    actionType: actionNode.config.actionType,
    ...actionNode.config.config,
  }
}

