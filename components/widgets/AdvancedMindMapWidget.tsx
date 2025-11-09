'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Network,
    Plus,
    Link,
    Trash2,
    Download,
    Upload,
    Undo,
    Redo,
    ZoomIn,
    ZoomOut,
    Maximize,
    Minimize
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Node {
    id: string
    x: number
    y: number
    label: string
    color: string
}

interface Connection {
    from: string
    to: string
}

const NODE_COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#8b5cf6', // purple
    '#f59e0b', // orange
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#ef4444', // red
    '#14b8a6', // teal
]

export function AdvancedMindMapWidget() {
    const canvasRef = useRef<HTMLDivElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const [nodes, setNodes] = useState<Node[]>([
        { id: 'root', x: 250, y: 200, label: 'Central Idea', color: '#3b82f6' }
    ])
    const [connections, setConnections] = useState<Connection[]>([])
    const [selectedNode, setSelectedNode] = useState<string | null>(null)
    const [draggingNode, setDraggingNode] = useState<string | null>(null)
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingNode, setEditingNode] = useState<Node | null>(null)
    const [newNodeLabel, setNewNodeLabel] = useState('')
    const [zoom, setZoom] = useState(1)
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
    const [exportDialogOpen, setExportDialogOpen] = useState(false)
    const [exportFormat, setExportFormat] = useState<'json' | 'png' | 'svg'>('json')
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Load saved mind map
    useEffect(() => {
        const saved = localStorage.getItem('mind-map-data')
        if (saved) {
            try {
                const data = JSON.parse(saved)
                setNodes(data.nodes || nodes)
                setConnections(data.connections || [])
            } catch (e) {
                console.error('Error loading mind map:', e)
            }
        }
    }, [])

    // Auto-save
    useEffect(() => {
        const saveData = () => {
            localStorage.setItem('mind-map-data', JSON.stringify({ nodes, connections }))
        }
        const timer = setTimeout(saveData, 1000)
        return () => clearTimeout(timer)
    }, [nodes, connections])

    const addNode = () => {
        // Simple approach: place new nodes near the center, visible on screen
        const newNode: Node = {
            id: `node-${Date.now()}`,
            x: 150 + (nodes.length * 30) % 300, // Spread nodes out horizontally
            y: 150 + (nodes.length * 30) % 200, // Spread nodes out vertically
            label: `Node ${nodes.length}`,
            color: NODE_COLORS[nodes.length % NODE_COLORS.length]
        }

        setNodes([...nodes, newNode])
        setSelectedNode(newNode.id)
    }

    const deleteNode = (id: string) => {
        if (id === 'root') {
            alert('Cannot delete the root node')
            return
        }
        setNodes(nodes.filter(n => n.id !== id))
        setConnections(connections.filter(c => c.from !== id && c.to !== id))
        if (selectedNode === id) setSelectedNode(null)
    }

    const startDragging = (id: string, e: React.MouseEvent) => {
        const node = nodes.find(n => n.id === id)
        if (!node) return

        setDraggingNode(id)
        setSelectedNode(id)

        // Calculate offset from mouse to node position
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const scrollLeft = canvas.scrollLeft
        const scrollTop = canvas.scrollTop

        // Mouse position relative to canvas (including scroll)
        const mouseX = e.clientX - rect.left + scrollLeft
        const mouseY = e.clientY - rect.top + scrollTop

        setDragOffset({
            x: mouseX - node.x,
            y: mouseY - node.y
        })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingNode) {
            const canvas = canvasRef.current
            if (!canvas) return

            const rect = canvas.getBoundingClientRect()
            const scrollLeft = canvas.scrollLeft
            const scrollTop = canvas.scrollTop

            // Calculate new position (accounting for scroll)
            const x = Math.max(0, e.clientX - rect.left + scrollLeft - dragOffset.x)
            const y = Math.max(0, e.clientY - rect.top + scrollTop - dragOffset.y)

            setNodes(nodes.map(node =>
                node.id === draggingNode
                    ? { ...node, x, y }
                    : node
            ))
        }
    }

    const handleMouseUp = () => {
        setDraggingNode(null)
    }

    const startConnecting = (id: string) => {
        if (connectingFrom === id) {
            setConnectingFrom(null)
        } else if (connectingFrom) {
            // Create connection
            const connectionExists = connections.some(
                c => (c.from === connectingFrom && c.to === id) || (c.from === id && c.to === connectingFrom)
            )
            if (!connectionExists && connectingFrom !== id) {
                setConnections([...connections, { from: connectingFrom, to: id }])
            }
            setConnectingFrom(null)
        } else {
            setConnectingFrom(id)
        }
    }

    const deleteConnection = (from: string, to: string) => {
        setConnections(connections.filter(c => !(c.from === from && c.to === to)))
    }

    const editNode = (node: Node) => {
        setEditingNode(node)
        setNewNodeLabel(node.label)
        setEditDialogOpen(true)
    }

    const saveNodeEdit = () => {
        if (editingNode && newNodeLabel.trim()) {
            setNodes(nodes.map(n =>
                n.id === editingNode.id ? { ...n, label: newNodeLabel } : n
            ))
            setEditDialogOpen(false)
            setEditingNode(null)
            setNewNodeLabel('')
        }
    }

    const changeNodeColor = (id: string, color: string) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, color } : n))
    }

    const exportMindMap = () => {
        setExportDialogOpen(true)
    }

    const handleExport = () => {
        if (exportFormat === 'json') {
            // Export as JSON
            const dataStr = JSON.stringify({ nodes, connections }, null, 2)
            const dataBlob = new Blob([dataStr], { type: 'application/json' })
            const url = URL.createObjectURL(dataBlob)
            const link = document.createElement('a')
            link.href = url
            link.download = `mindmap-${Date.now()}.json`
            link.click()
            URL.revokeObjectURL(url)
        } else if (exportFormat === 'png') {
            // Export as PNG image
            exportAsPNG()
        } else if (exportFormat === 'svg') {
            // Export as SVG
            exportAsSVG()
        }

        setExportDialogOpen(false)
    }

    const exportAsPNG = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Calculate bounds
        const padding = 50
        const minX = Math.min(...nodes.map(n => n.x)) - padding
        const minY = Math.min(...nodes.map(n => n.y)) - padding
        const maxX = Math.max(...nodes.map(n => n.x + 100)) + padding
        const maxY = Math.max(...nodes.map(n => n.y + 50)) + padding

        canvas.width = maxX - minX
        canvas.height = maxY - minY

        // Fill background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw connections
        ctx.lineWidth = 2
        connections.forEach(conn => {
            const fromNode = nodes.find(n => n.id === conn.from)
            const toNode = nodes.find(n => n.id === conn.to)
            if (!fromNode || !toNode) return

            ctx.strokeStyle = fromNode.color
            ctx.globalAlpha = 0.6
            ctx.beginPath()
            ctx.moveTo(fromNode.x + 50 - minX, fromNode.y + 25 - minY)
            ctx.lineTo(toNode.x + 50 - minX, toNode.y + 25 - minY)
            ctx.stroke()
            ctx.globalAlpha = 1
        })

        // Draw nodes
        nodes.forEach(node => {
            const x = node.x - minX
            const y = node.y - minY

            // Draw node background
            ctx.fillStyle = node.color + '20'
            ctx.strokeStyle = node.color
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.roundRect(x, y, 100, 50, 8)
            ctx.fill()
            ctx.stroke()

            // Draw text
            ctx.fillStyle = node.color
            ctx.font = 'bold 12px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            // Word wrap
            const words = node.label.split(' ')
            const lines: string[] = []
            let currentLine = ''

            words.forEach(word => {
                const testLine = currentLine ? `${currentLine} ${word}` : word
                const metrics = ctx.measureText(testLine)
                if (metrics.width > 90) {
                    if (currentLine) lines.push(currentLine)
                    currentLine = word
                } else {
                    currentLine = testLine
                }
            })
            if (currentLine) lines.push(currentLine)

            lines.forEach((line, i) => {
                const lineY = y + 25 + (i - (lines.length - 1) / 2) * 14
                ctx.fillText(line, x + 50, lineY)
            })
        })

        // Download
        canvas.toBlob((blob) => {
            if (!blob) return
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `mindmap-${Date.now()}.png`
            link.click()
            URL.revokeObjectURL(url)
        })
    }

    const exportAsSVG = () => {
        // Calculate bounds
        const padding = 50
        const minX = Math.min(...nodes.map(n => n.x)) - padding
        const minY = Math.min(...nodes.map(n => n.y)) - padding
        const maxX = Math.max(...nodes.map(n => n.x + 100)) + padding
        const maxY = Math.max(...nodes.map(n => n.y + 50)) + padding
        const width = maxX - minX
        const height = maxY - minY

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`
        svg += `<rect width="${width}" height="${height}" fill="white"/>\n`

        // Draw connections
        connections.forEach(conn => {
            const fromNode = nodes.find(n => n.id === conn.from)
            const toNode = nodes.find(n => n.id === conn.to)
            if (!fromNode || !toNode) return

            svg += `<line x1="${fromNode.x + 50 - minX}" y1="${fromNode.y + 25 - minY}" x2="${toNode.x + 50 - minX}" y2="${toNode.y + 25 - minY}" stroke="${fromNode.color}" stroke-width="2" opacity="0.6"/>\n`
        })

        // Draw nodes
        nodes.forEach(node => {
            const x = node.x - minX
            const y = node.y - minY

            svg += `<rect x="${x}" y="${y}" width="100" height="50" rx="8" fill="${node.color}20" stroke="${node.color}" stroke-width="2"/>\n`
            svg += `<text x="${x + 50}" y="${y + 25}" text-anchor="middle" dominant-baseline="middle" fill="${node.color}" font-family="Arial" font-size="12" font-weight="bold">${node.label}</text>\n`
        })

        svg += '</svg>'

        const blob = new Blob([svg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `mindmap-${Date.now()}.svg`
        link.click()
        URL.revokeObjectURL(url)
    }

    const resetView = () => {
        setZoom(1)
        setPanOffset({ x: 0, y: 0 })

        // Center view on all nodes
        if (nodes.length > 0) {
            const avgX = nodes.reduce((sum, n) => sum + n.x, 0) / nodes.length
            const avgY = nodes.reduce((sum, n) => sum + n.y, 0) / nodes.length

            // Scroll canvas to center
            if (canvasRef.current) {
                canvasRef.current.scrollTo({
                    left: avgX - canvasRef.current.offsetWidth / 2,
                    top: avgY - canvasRef.current.offsetHeight / 2,
                    behavior: 'smooth'
                })
            }
        }
    }

    const centerOnNode = (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId)
        if (!node || !canvasRef.current) return

        const canvas = canvasRef.current
        canvas.scrollTo({
            left: node.x - canvas.offsetWidth / 2 + 50,
            top: node.y - canvas.offsetHeight / 2 + 25,
            behavior: 'smooth'
        })
        setSelectedNode(nodeId)
    }

    const clearMindMap = () => {
        if (confirm('Are you sure you want to clear the entire mind map?')) {
            setNodes([{ id: 'root', x: 250, y: 200, label: 'Central Idea', color: '#3b82f6' }])
            setConnections([])
            setSelectedNode(null)
        }
    }

    const toggleFullscreen = async () => {
        const card = cardRef.current
        if (!card) return

        try {
            if (!document.fullscreenElement) {
                await card.requestFullscreen()
                setIsFullscreen(true)
            } else {
                await document.exitFullscreen()
                setIsFullscreen(false)
            }
        } catch (err) {
            console.error('Error toggling fullscreen:', err)
        }
    }

    // Listen for fullscreen changes (e.g., user pressing ESC)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    return (
        <Card ref={cardRef} className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Mind Map
                </CardTitle>
                <CardDescription className="text-xs">Visualize ideas and connections</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-2 pt-4">
                {/* Toolbar */}
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={addNode}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Node
                    </Button>
                    <Button
                        variant={connectingFrom ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setConnectingFrom(null)}
                        disabled={!connectingFrom}
                    >
                        <Link className="h-3 w-3 mr-1" />
                        {connectingFrom ? 'Cancel Link' : 'Link Mode'}
                    </Button>
                    <div className="flex-1" />
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={resetView}
                        title="Center view on all nodes"
                    >
                        Show All
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={exportMindMap}
                    >
                        <Download className="h-3 w-3 mr-1" />
                        Export
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive"
                        onClick={clearMindMap}
                    >
                        Clear All
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                    </Button>
                </div>

                {/* Canvas */}
                <div
                    ref={canvasRef}
                    className="flex-1 border-2 border-dashed rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 relative overflow-auto"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Container for nodes - responsive to canvas size */}
                    <div className="relative w-full h-full" style={{ minHeight: '100%', minWidth: '100%' }}>
                        {/* SVG for connections - matches container size */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            {connections.map((conn, index) => {
                                const fromNode = nodes.find(n => n.id === conn.from)
                                const toNode = nodes.find(n => n.id === conn.to)
                                if (!fromNode || !toNode) return null

                                return (
                                    <g key={index}>
                                        <line
                                            x1={fromNode.x + 50}
                                            y1={fromNode.y + 25}
                                            x2={toNode.x + 50}
                                            y2={toNode.y + 25}
                                            stroke={fromNode.color}
                                            strokeWidth="2"
                                            opacity="0.6"
                                        />
                                        {/* Delete connection button */}
                                        <circle
                                            cx={(fromNode.x + toNode.x) / 2 + 50}
                                            cy={(fromNode.y + toNode.y) / 2 + 25}
                                            r="8"
                                            fill="white"
                                            stroke="#ef4444"
                                            strokeWidth="2"
                                            className="cursor-pointer pointer-events-auto"
                                            onClick={() => deleteConnection(conn.from, conn.to)}
                                        />
                                        <text
                                            x={(fromNode.x + toNode.x) / 2 + 50}
                                            y={(fromNode.y + toNode.y) / 2 + 28}
                                            fontSize="12"
                                            fill="#ef4444"
                                            textAnchor="middle"
                                            className="pointer-events-none"
                                        >
                                            ×
                                        </text>
                                    </g>
                                )
                            })}
                        </svg>

                        {/* Nodes */}
                        {nodes.map((node) => (
                            <div
                                key={node.id}
                                id={`node-${node.id}`}
                                className={cn(
                                    "absolute rounded-lg border-2 p-2 cursor-move transition-all group",
                                    selectedNode === node.id ? "ring-2 ring-offset-2 ring-primary" : "",
                                    connectingFrom === node.id ? "ring-2 ring-offset-2 ring-green-500" : ""
                                )}
                                style={{
                                    left: node.x,
                                    top: node.y,
                                    backgroundColor: node.color + '20',
                                    borderColor: node.color,
                                    width: '100px',
                                    minHeight: '50px'
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation()
                                    startDragging(node.id, e)
                                }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (connectingFrom) {
                                        startConnecting(node.id)
                                    }
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation()
                                    editNode(node)
                                }}
                            >
                                <div className="text-xs font-semibold text-center break-words" style={{ color: node.color }}>
                                    {node.label}
                                </div>

                                {/* Node actions */}
                                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            startConnecting(node.id)
                                        }}
                                        title="Connect"
                                    >
                                        <Link className="h-3 w-3" />
                                    </button>
                                    {node.id !== 'root' && (
                                        <button
                                            className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deleteNode(node.id)
                                            }}
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>

                                {/* Color palette (on hover) */}
                                {selectedNode === node.id && (
                                    <div className="absolute -bottom-8 left-0 flex gap-1 bg-white dark:bg-slate-800 p-1 rounded border shadow-lg z-10">
                                        {NODE_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-700"
                                                style={{ backgroundColor: color }}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    changeNodeColor(node.id, color)
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Instructions */}
                        {nodes.length === 1 && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg border text-center">
                                <p className="text-xs font-semibold">Quick Guide</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Click "Add Node" • Drag to move • Double-click to edit • Click "Link Mode" then nodes to connect
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="text-xs text-muted-foreground text-center">
                    {nodes.length} nodes • {connections.length} connections
                    {connectingFrom && (
                        <span className="text-green-600 font-semibold ml-2">
                            → Click another node to connect
                        </span>
                    )}
                </div>
            </CardContent>

            {/* Edit Node Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Node</DialogTitle>
                        <DialogDescription>
                            Update the node label
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newNodeLabel}
                            onChange={(e) => setNewNodeLabel(e.target.value)}
                            placeholder="Enter node label"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveNodeEdit()
                            }}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveNodeEdit} disabled={!newNodeLabel.trim()}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export Format Dialog */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export Mind Map</DialogTitle>
                        <DialogDescription>
                            Choose the format for exporting your mind map
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="json"
                                    checked={exportFormat === 'json'}
                                    onChange={(e) => setExportFormat(e.target.value as 'json' | 'png' | 'svg')}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <div className="font-medium">JSON Data</div>
                                    <div className="text-xs text-muted-foreground">
                                        Export as JSON file (can be imported later)
                                    </div>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="png"
                                    checked={exportFormat === 'png'}
                                    onChange={(e) => setExportFormat(e.target.value as 'json' | 'png' | 'svg')}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <div className="font-medium">PNG Image</div>
                                    <div className="text-xs text-muted-foreground">
                                        Export as raster image (for sharing/presentations)
                                    </div>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="svg"
                                    checked={exportFormat === 'svg'}
                                    onChange={(e) => setExportFormat(e.target.value as 'json' | 'png' | 'svg')}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <div className="font-medium">SVG Vector</div>
                                    <div className="text-xs text-muted-foreground">
                                        Export as scalable vector graphics (high quality)
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

