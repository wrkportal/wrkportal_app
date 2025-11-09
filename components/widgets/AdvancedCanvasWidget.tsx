'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Palette,
    Square,
    Circle,
    Minus,
    ArrowUpRight,
    Type,
    Image as ImageIcon,
    Download,
    Upload,
    Trash2,
    Undo,
    Redo,
    Save,
    Move,
    MousePointer2,
    Pen,
    Maximize,
    Minimize,
    FolderOpen,
    Group,
    Ungroup
} from "lucide-react"
import { cn } from "@/lib/utils"

type DrawMode = 'draw' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'eraser' | 'select' | 'pen' | 'screenshot-area'

interface DrawElement {
    type: DrawMode | 'image'
    points?: { x: number; y: number }[]
    start?: { x: number; y: number }
    end?: { x: number; y: number }
    color: string
    fillColor?: string
    lineWidth: number
    text?: string
    imageData?: string
    imageWidth?: number
    imageHeight?: number
    id?: string
    selected?: boolean
    groupId?: string
}

export function AdvancedCanvasWidget() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textInputRef = useRef<HTMLTextAreaElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const previousDimensionsRef = useRef<{ width: number; height: number } | null>(null)
    const isScalingRef = useRef(false)

    const [isDrawing, setIsDrawing] = useState(false)
    const [mode, setMode] = useState<DrawMode>('draw')
    const [color, setColor] = useState('#000000')
    const [fillColor, setFillColor] = useState('transparent')
    const [lineWidth, setLineWidth] = useState(2)
    const [elements, setElements] = useState<DrawElement[]>([])
    const [currentElement, setCurrentElement] = useState<DrawElement | null>(null)
    const [history, setHistory] = useState<DrawElement[][]>([])
    const [historyStep, setHistoryStep] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Selection mode states
    const [selectedElement, setSelectedElement] = useState<string | null>(null)
    const [selectedElements, setSelectedElements] = useState<string[]>([])
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
    const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null)
    const [originalElements, setOriginalElements] = useState<DrawElement[]>([])
    const [isResizing, setIsResizing] = useState(false)
    const [resizeHandle, setResizeHandle] = useState<'se' | 'ne' | 'sw' | 'nw' | null>(null)

    // Text mode states
    const [editingText, setEditingText] = useState<string | null>(null)
    const [editingTextValue, setEditingTextValue] = useState('')
    const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)
    const [showTextSaveButton, setShowTextSaveButton] = useState(false)

    // Canvas save/load states
    const [canvasName, setCanvasName] = useState('Untitled Canvas')
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [showLoadDialog, setShowLoadDialog] = useState(false)
    const [saveNameInput, setSaveNameInput] = useState('')
    const [savedCanvases, setSavedCanvases] = useState<string[]>([])
    const CURRENT_CANVAS_KEY = 'current-canvas-data'
    const CANVAS_LIST_KEY = 'saved-canvas-list'

    // Group states
    const [groups, setGroups] = useState<Map<string, string[]>>(new Map())

    // Define redrawCanvas with useCallback before it's used in useEffects
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw all elements
        elements.forEach(element => {
            const isSelected = element.id === selectedElement || selectedElements.includes(element.id!)

            const drawResizeHandles = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
                const handleSize = 8
                ctx.fillStyle = '#3b82f6'

                // Four corners
                ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
                ctx.fillRect(x + width - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
                ctx.fillRect(x - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize)
                ctx.fillRect(x + width - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize)
            }

            switch (element.type) {
                case 'draw':
                case 'pen':
                    if (element.points && element.points.length > 1) {
                        ctx.strokeStyle = element.color
                        ctx.lineWidth = element.lineWidth
                        ctx.lineCap = 'round'
                        ctx.lineJoin = 'round'
                        ctx.beginPath()
                        ctx.moveTo(element.points[0].x, element.points[0].y)
                        element.points.forEach(point => ctx.lineTo(point.x, point.y))
                        ctx.stroke()

                        // Draw selection box for drawings
                        if (isSelected) {
                            const minX = Math.min(...element.points.map(p => p.x))
                            const minY = Math.min(...element.points.map(p => p.y))
                            const maxX = Math.max(...element.points.map(p => p.x))
                            const maxY = Math.max(...element.points.map(p => p.y))

                            ctx.strokeStyle = '#3b82f6'
                            ctx.lineWidth = 2
                            ctx.setLineDash([5, 5])
                            ctx.strokeRect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10)
                            ctx.setLineDash([])

                            // Draw resize handles
                            drawResizeHandles(ctx, minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10)
                        }
                    }
                    break

                case 'rectangle':
                    if (element.start && element.end) {
                        const width = element.end.x - element.start.x
                        const height = element.end.y - element.start.y

                        // Fill if fillColor is set
                        if (element.fillColor && element.fillColor !== 'transparent') {
                            ctx.fillStyle = element.fillColor
                            ctx.fillRect(element.start.x, element.start.y, width, height)
                        }

                        // Draw border
                        ctx.strokeStyle = element.color
                        ctx.lineWidth = element.lineWidth
                        ctx.strokeRect(element.start.x, element.start.y, width, height)

                        if (isSelected) {
                            ctx.strokeStyle = '#3b82f6'
                            ctx.lineWidth = 2
                            ctx.setLineDash([5, 5])
                            ctx.strokeRect(element.start.x - 5, element.start.y - 5, width + 10, height + 10)
                            ctx.setLineDash([])
                            drawResizeHandles(ctx, element.start.x - 5, element.start.y - 5, width + 10, height + 10)
                        }
                    }
                    break

                case 'circle':
                    if (element.start && element.end) {
                        const radius = Math.sqrt(
                            Math.pow(element.end.x - element.start.x, 2) +
                            Math.pow(element.end.y - element.start.y, 2)
                        )

                        ctx.beginPath()
                        ctx.arc(element.start.x, element.start.y, radius, 0, 2 * Math.PI)

                        // Fill if fillColor is set
                        if (element.fillColor && element.fillColor !== 'transparent') {
                            ctx.fillStyle = element.fillColor
                            ctx.fill()
                        }

                        // Draw border
                        ctx.strokeStyle = element.color
                        ctx.lineWidth = element.lineWidth
                        ctx.stroke()

                        if (isSelected) {
                            ctx.strokeStyle = '#3b82f6'
                            ctx.lineWidth = 2
                            ctx.setLineDash([5, 5])
                            // Draw bounding box
                            ctx.strokeRect(
                                element.start.x - radius - 5,
                                element.start.y - radius - 5,
                                radius * 2 + 10,
                                radius * 2 + 10
                            )
                            ctx.setLineDash([])
                            // Draw resize handles
                            drawResizeHandles(
                                ctx,
                                element.start.x - radius - 5,
                                element.start.y - radius - 5,
                                radius * 2 + 10,
                                radius * 2 + 10
                            )
                        }
                    }
                    break

                case 'line':
                case 'arrow':
                    if (element.start && element.end) {
                        ctx.strokeStyle = element.color
                        ctx.lineWidth = element.lineWidth
                        ctx.beginPath()
                        ctx.moveTo(element.start.x, element.start.y)
                        ctx.lineTo(element.end.x, element.end.y)
                        ctx.stroke()

                        if (element.type === 'arrow') {
                            const angle = Math.atan2(element.end.y - element.start.y, element.end.x - element.start.x)
                            const arrowLength = 15
                            ctx.beginPath()
                            ctx.moveTo(element.end.x, element.end.y)
                            ctx.lineTo(
                                element.end.x - arrowLength * Math.cos(angle - Math.PI / 6),
                                element.end.y - arrowLength * Math.sin(angle - Math.PI / 6)
                            )
                            ctx.moveTo(element.end.x, element.end.y)
                            ctx.lineTo(
                                element.end.x - arrowLength * Math.cos(angle + Math.PI / 6),
                                element.end.y - arrowLength * Math.sin(angle + Math.PI / 6)
                            )
                            ctx.stroke()
                        }

                        if (isSelected) {
                            ctx.strokeStyle = '#3b82f6'
                            ctx.lineWidth = 2
                            ctx.setLineDash([5, 5])
                            const minX = Math.min(element.start.x, element.end.x)
                            const minY = Math.min(element.start.y, element.end.y)
                            const width = Math.abs(element.end.x - element.start.x)
                            const height = Math.abs(element.end.y - element.start.y)
                            ctx.strokeRect(minX - 5, minY - 5, width + 10, height + 10)
                            ctx.setLineDash([])
                            // Draw resize handles
                            drawResizeHandles(ctx, minX - 5, minY - 5, width + 10, height + 10)
                        }
                    }
                    break

                case 'image':
                    if (element.imageData && element.start && element.imageWidth && element.imageHeight) {
                        const img = new Image()
                        img.src = element.imageData
                        ctx.drawImage(img, element.start.x, element.start.y, element.imageWidth, element.imageHeight)

                        if (isSelected) {
                            ctx.strokeStyle = '#3b82f6'
                            ctx.lineWidth = 2
                            ctx.setLineDash([5, 5])
                            ctx.strokeRect(element.start.x - 5, element.start.y - 5, element.imageWidth + 10, element.imageHeight + 10)
                            ctx.setLineDash([])
                            drawResizeHandles(ctx, element.start.x - 5, element.start.y - 5, element.imageWidth + 10, element.imageHeight + 10)
                        }
                    }
                    break

                case 'text':
                    if (element.start && element.text && element.id !== editingText) {
                        const fontSize = element.lineWidth * 8
                        ctx.font = `${fontSize}px Arial`
                        ctx.fillStyle = element.color

                        // Split text into lines and render each line
                        const lines = element.text.split('\n')
                        lines.forEach((line, index) => {
                            ctx.fillText(line, element.start!.x, element.start!.y + fontSize + (index * fontSize * 1.2))
                        })

                        if (isSelected) {
                            // Calculate bounding box for multi-line text
                            const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width))
                            const textHeight = lines.length * fontSize * 1.2

                            ctx.strokeStyle = '#3b82f6'
                            ctx.lineWidth = 2
                            ctx.setLineDash([5, 5])
                            ctx.strokeRect(element.start!.x - 5, element.start!.y - 5, maxLineWidth + 10, textHeight + 10)
                            ctx.setLineDash([])
                        }
                    }
                    break
            }
        })

        // Draw current element being drawn
        if (currentElement) {
            switch (currentElement.type) {
                case 'draw':
                case 'pen':
                    if (currentElement.points && currentElement.points.length > 1) {
                        ctx.strokeStyle = currentElement.color
                        ctx.lineWidth = currentElement.lineWidth
                        ctx.lineCap = 'round'
                        ctx.lineJoin = 'round'
                        ctx.beginPath()
                        ctx.moveTo(currentElement.points[0].x, currentElement.points[0].y)
                        currentElement.points.forEach(point => ctx.lineTo(point.x, point.y))
                        ctx.stroke()
                    }
                    break

                case 'rectangle':
                    if (currentElement.start && currentElement.end) {
                        ctx.strokeStyle = currentElement.color
                        ctx.lineWidth = currentElement.lineWidth
                        const width = currentElement.end.x - currentElement.start.x
                        const height = currentElement.end.y - currentElement.start.y
                        ctx.strokeRect(currentElement.start.x, currentElement.start.y, width, height)
                    }
                    break

                case 'circle':
                    if (currentElement.start && currentElement.end) {
                        ctx.strokeStyle = currentElement.color
                        ctx.lineWidth = currentElement.lineWidth
                        const radius = Math.sqrt(
                            Math.pow(currentElement.end.x - currentElement.start.x, 2) +
                            Math.pow(currentElement.end.y - currentElement.start.y, 2)
                        )
                        ctx.beginPath()
                        ctx.arc(currentElement.start.x, currentElement.start.y, radius, 0, 2 * Math.PI)
                        ctx.stroke()
                    }
                    break

                case 'line':
                case 'arrow':
                    if (currentElement.start && currentElement.end) {
                        ctx.strokeStyle = currentElement.color
                        ctx.lineWidth = currentElement.lineWidth
                        ctx.beginPath()
                        ctx.moveTo(currentElement.start.x, currentElement.start.y)
                        ctx.lineTo(currentElement.end.x, currentElement.end.y)
                        ctx.stroke()

                        if (currentElement.type === 'arrow') {
                            const angle = Math.atan2(currentElement.end.y - currentElement.start.y, currentElement.end.x - currentElement.start.x)
                            const arrowLength = 15
                            ctx.beginPath()
                            ctx.moveTo(currentElement.end.x, currentElement.end.y)
                            ctx.lineTo(
                                currentElement.end.x - arrowLength * Math.cos(angle - Math.PI / 6),
                                currentElement.end.y - arrowLength * Math.sin(angle - Math.PI / 6)
                            )
                            ctx.moveTo(currentElement.end.x, currentElement.end.y)
                            ctx.lineTo(
                                currentElement.end.x - arrowLength * Math.cos(angle + Math.PI / 6),
                                currentElement.end.y - arrowLength * Math.sin(angle + Math.PI / 6)
                            )
                            ctx.stroke()
                        }
                    }
                    break

                case 'screenshot-area':
                    if (currentElement.start && currentElement.end) {
                        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
                        ctx.strokeStyle = '#3b82f6'
                        ctx.lineWidth = 2
                        ctx.setLineDash([5, 5])
                        const width = currentElement.end.x - currentElement.start.x
                        const height = currentElement.end.y - currentElement.start.y
                        ctx.fillRect(currentElement.start.x, currentElement.start.y, width, height)
                        ctx.strokeRect(currentElement.start.x, currentElement.start.y, width, height)
                        ctx.setLineDash([])
                    }
                    break
            }
        }
    }, [elements, selectedElement, selectedElements, currentElement, editingText])

    // Initialize canvas and handle resizing
    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const updateCanvasSize = () => {
            const rect = container.getBoundingClientRect()
            const newWidth = rect.width - 4 // Account for border

            // Calculate new height based on fullscreen mode
            let newHeight: number
            if (isFullscreen || document.fullscreenElement) {
                newHeight = rect.height - 4 // Use full container height in fullscreen
            } else {
                const desiredHeight = window.innerHeight * 0.7 // 70% of window height
                newHeight = Math.min(rect.height - 4, desiredHeight)
            }

            // Get old dimensions before updating
            const oldWidth = canvas.width
            const oldHeight = canvas.height

            // Scale elements if dimensions changed significantly and we're not already scaling
            if (!isScalingRef.current && previousDimensionsRef.current &&
                oldHeight > 0 && Math.abs(oldHeight - newHeight) > 50) {

                isScalingRef.current = true
                const scaleY = newHeight / oldHeight

                setElements(prevElements => {
                    if (prevElements.length === 0) {
                        isScalingRef.current = false
                        return prevElements
                    }

                    const scaledElements = prevElements.map(element => {
                        const scaledElement: DrawElement = { ...element }

                        // Scale points (for draw/pen elements)
                        if (element.points) {
                            scaledElement.points = element.points.map(point => ({
                                x: point.x,
                                y: point.y * scaleY
                            }))
                        }

                        // Scale start and end positions
                        if (element.start) {
                            scaledElement.start = {
                                x: element.start.x,
                                y: element.start.y * scaleY
                            }
                        }
                        if (element.end) {
                            scaledElement.end = {
                                x: element.end.x,
                                y: element.end.y * scaleY
                            }
                        }

                        // Scale image height
                        if (element.imageHeight) {
                            scaledElement.imageHeight = element.imageHeight * scaleY
                        }

                        return scaledElement
                    })

                    setTimeout(() => {
                        isScalingRef.current = false
                    }, 100)

                    return scaledElements
                })
            }

            // Update canvas dimensions
            canvas.width = newWidth
            canvas.height = newHeight
            previousDimensionsRef.current = { width: newWidth, height: newHeight }

            redrawCanvas()
        }

        updateCanvasSize()

        const resizeObserver = new ResizeObserver(updateCanvasSize)
        resizeObserver.observe(container)

        return () => resizeObserver.disconnect()
    }, [redrawCanvas, isFullscreen])

    // Load current colors from selected element
    useEffect(() => {
        if (selectedElement) {
            const element = elements.find(el => el.id === selectedElement)
            if (element) {
                setColor(element.color)
                setFillColor(element.fillColor || 'transparent')
            }
        } else if (selectedElements.length === 1) {
            const element = elements.find(el => el.id === selectedElements[0])
            if (element) {
                setColor(element.color)
                setFillColor(element.fillColor || 'transparent')
            }
        }
    }, [selectedElement, selectedElements])

    // Load saved canvas on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(CURRENT_CANVAS_KEY)
            if (saved) {
                const data = JSON.parse(saved)
                setElements(data.elements || [])
                setCanvasName(data.name || 'Untitled Canvas')
                setHistory([data.elements || []])
                setHistoryStep(0)
            }

            // Load list of saved canvases
            const savedList = localStorage.getItem(CANVAS_LIST_KEY)
            if (savedList) {
                setSavedCanvases(JSON.parse(savedList))
            }
        } catch (e) {
            console.error('Error loading canvas:', e)
        }
    }, [])

    // Auto-save current canvas
    useEffect(() => {
        const saveTimer = setTimeout(() => {
            try {
                localStorage.setItem(CURRENT_CANVAS_KEY, JSON.stringify({
                    name: canvasName,
                    elements: elements,
                    timestamp: Date.now()
                }))
            } catch (e) {
                console.error('Error auto-saving canvas:', e)
            }
        }, 1000)

        return () => clearTimeout(saveTimer)
    }, [elements, canvasName])

    // Redraw canvas when elements change
    useEffect(() => {
        redrawCanvas()
    }, [redrawCanvas])

    // Force redraw when page becomes visible (navigating back)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Page is now visible, force a redraw
                setTimeout(() => {
                    redrawCanvas()
                }, 100)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [redrawCanvas])

    // Force initial redraw after mount
    useEffect(() => {
        const timer = setTimeout(() => {
            redrawCanvas()
        }, 100)
        return () => clearTimeout(timer)
    }, [redrawCanvas])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Delete selected elements
            if ((e.key === 'Delete' || e.key === 'Backspace') && !editingText) {
                if (selectedElements.length > 0) {
                    const newElements = elements.filter(el => !selectedElements.includes(el.id!))
                    setElements(newElements)
                    addToHistory(newElements)
                    setSelectedElements([])
                } else if (selectedElement) {
                    const newElements = elements.filter(el => el.id !== selectedElement)
                    setElements(newElements)
                    addToHistory(newElements)
                    setSelectedElement(null)
                }
            }

            // Select all
            if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !editingText) {
                e.preventDefault()
                setSelectedElements(elements.map(el => el.id!))
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedElement, selectedElements, elements, editingText])

    const drawElement = (ctx: CanvasRenderingContext2D, element: DrawElement) => {
        switch (element.type) {
            case 'draw':
            case 'pen':
                if (element.points && element.points.length > 1) {
                    ctx.strokeStyle = element.color
                    ctx.lineWidth = element.lineWidth
                    ctx.lineCap = 'round'
                    ctx.lineJoin = 'round'
                    ctx.beginPath()
                    ctx.moveTo(element.points[0].x, element.points[0].y)
                    element.points.forEach(point => ctx.lineTo(point.x, point.y))
                    ctx.stroke()
                }
                break

            case 'rectangle':
                if (element.start && element.end) {
                    const width = element.end.x - element.start.x
                    const height = element.end.y - element.start.y

                    // Fill if fillColor is set
                    if (element.fillColor && element.fillColor !== 'transparent') {
                        ctx.fillStyle = element.fillColor
                        ctx.fillRect(element.start.x, element.start.y, width, height)
                    }

                    // Draw border
                    ctx.strokeStyle = element.color
                    ctx.lineWidth = element.lineWidth
                    ctx.strokeRect(element.start.x, element.start.y, width, height)
                }
                break

            case 'circle':
                if (element.start && element.end) {
                    const radius = Math.sqrt(
                        Math.pow(element.end.x - element.start.x, 2) +
                        Math.pow(element.end.y - element.start.y, 2)
                    )
                    ctx.beginPath()
                    ctx.arc(element.start.x, element.start.y, radius, 0, 2 * Math.PI)

                    // Fill if fillColor is set
                    if (element.fillColor && element.fillColor !== 'transparent') {
                        ctx.fillStyle = element.fillColor
                        ctx.fill()
                    }

                    // Draw border
                    ctx.strokeStyle = element.color
                    ctx.lineWidth = element.lineWidth
                    ctx.stroke()
                }
                break

            case 'line':
            case 'arrow':
                if (element.start && element.end) {
                    ctx.strokeStyle = element.color
                    ctx.lineWidth = element.lineWidth
                    ctx.beginPath()
                    ctx.moveTo(element.start.x, element.start.y)
                    ctx.lineTo(element.end.x, element.end.y)
                    ctx.stroke()

                    if (element.type === 'arrow') {
                        const angle = Math.atan2(element.end.y - element.start.y, element.end.x - element.start.x)
                        const arrowLength = 15
                        ctx.beginPath()
                        ctx.moveTo(element.end.x, element.end.y)
                        ctx.lineTo(
                            element.end.x - arrowLength * Math.cos(angle - Math.PI / 6),
                            element.end.y - arrowLength * Math.sin(angle - Math.PI / 6)
                        )
                        ctx.moveTo(element.end.x, element.end.y)
                        ctx.lineTo(
                            element.end.x - arrowLength * Math.cos(angle + Math.PI / 6),
                            element.end.y - arrowLength * Math.sin(angle + Math.PI / 6)
                        )
                        ctx.stroke()
                    }
                }
                break

            case 'screenshot-area':
                if (element.start && element.end) {
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
                    ctx.strokeStyle = '#3b82f6'
                    ctx.lineWidth = 2
                    ctx.setLineDash([5, 5])
                    const width = element.end.x - element.start.x
                    const height = element.end.y - element.start.y
                    ctx.fillRect(element.start.x, element.start.y, width, height)
                    ctx.strokeRect(element.start.x, element.start.y, width, height)
                    ctx.setLineDash([])
                }
                break
        }
    }

    const drawResizeHandles = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
        const handleSize = 8
        ctx.fillStyle = '#3b82f6'

        // Four corners
        ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(x + width - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(x - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(x + width - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize)
    }

    const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }

        const rect = canvas.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    const isPointInElement = (point: { x: number; y: number }, element: DrawElement): boolean => {
        switch (element.type) {
            case 'rectangle':
                if (element.start && element.end) {
                    const minX = Math.min(element.start.x, element.end.x)
                    const maxX = Math.max(element.start.x, element.end.x)
                    const minY = Math.min(element.start.y, element.end.y)
                    const maxY = Math.max(element.start.y, element.end.y)
                    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
                }
                break

            case 'circle':
                if (element.start && element.end) {
                    const radius = Math.sqrt(
                        Math.pow(element.end.x - element.start.x, 2) +
                        Math.pow(element.end.y - element.start.y, 2)
                    )
                    const distance = Math.sqrt(
                        Math.pow(point.x - element.start.x, 2) +
                        Math.pow(point.y - element.start.y, 2)
                    )
                    // Check if point is within the circle (including interior)
                    return distance <= radius + 10
                }
                break

            case 'line':
            case 'arrow':
                if (element.start && element.end) {
                    // Calculate distance from point to line segment
                    const dx = element.end.x - element.start.x
                    const dy = element.end.y - element.start.y
                    const lengthSquared = dx * dx + dy * dy

                    if (lengthSquared === 0) {
                        // Start and end are the same point
                        const dist = Math.sqrt(
                            (point.x - element.start.x) ** 2 + (point.y - element.start.y) ** 2
                        )
                        return dist <= 10
                    }

                    // Project point onto line segment
                    let t = ((point.x - element.start.x) * dx + (point.y - element.start.y) * dy) / lengthSquared
                    t = Math.max(0, Math.min(1, t))

                    // Find closest point on segment
                    const closestX = element.start.x + t * dx
                    const closestY = element.start.y + t * dy

                    // Calculate distance to closest point
                    const distance = Math.sqrt(
                        (point.x - closestX) ** 2 + (point.y - closestY) ** 2
                    )

                    // Allow selection if within 10 pixels of the line
                    return distance <= 10
                }
                break

            case 'image':
                if (element.start && element.imageWidth && element.imageHeight) {
                    return point.x >= element.start.x &&
                        point.x <= element.start.x + element.imageWidth &&
                        point.y >= element.start.y &&
                        point.y <= element.start.y + element.imageHeight
                }
                break

            case 'text':
                if (element.start && element.text) {
                    const canvas = canvasRef.current
                    if (!canvas) return false
                    const ctx = canvas.getContext('2d')
                    if (!ctx) return false
                    const fontSize = element.lineWidth * 8
                    ctx.font = `${fontSize}px Arial`

                    // Calculate bounding box for multi-line text
                    const lines = element.text.split('\n')
                    const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width))
                    const textHeight = lines.length * fontSize * 1.2

                    return point.x >= element.start.x &&
                        point.x <= element.start.x + maxLineWidth &&
                        point.y >= element.start.y &&
                        point.y <= element.start.y + textHeight
                }
                break

            case 'draw':
            case 'pen':
                if (element.points && element.points.length > 0) {
                    // Use bounding box for easier selection
                    const minX = Math.min(...element.points.map(p => p.x))
                    const maxX = Math.max(...element.points.map(p => p.x))
                    const minY = Math.min(...element.points.map(p => p.y))
                    const maxY = Math.max(...element.points.map(p => p.y))

                    // Add padding for easier selection
                    const padding = 10

                    return point.x >= minX - padding &&
                        point.x <= maxX + padding &&
                        point.y >= minY - padding &&
                        point.y <= maxY + padding
                }
                break
        }

        return false
    }

    const getResizeHandle = (point: { x: number; y: number }, element: DrawElement): 'se' | 'ne' | 'sw' | 'nw' | null => {
        const handleSize = 8
        let bounds: { x: number; y: number; width: number; height: number } | null = null

        if (element.type === 'image' && element.start && element.imageWidth && element.imageHeight) {
            bounds = {
                x: element.start.x - 5,
                y: element.start.y - 5,
                width: element.imageWidth + 10,
                height: element.imageHeight + 10
            }
        } else if (element.type === 'rectangle' && element.start && element.end) {
            bounds = {
                x: element.start.x - 5,
                y: element.start.y - 5,
                width: element.end.x - element.start.x + 10,
                height: element.end.y - element.start.y + 10
            }
        } else if (element.type === 'circle' && element.start && element.end) {
            const radius = Math.sqrt(
                Math.pow(element.end.x - element.start.x, 2) +
                Math.pow(element.end.y - element.start.y, 2)
            )
            bounds = {
                x: element.start.x - radius - 5,
                y: element.start.y - radius - 5,
                width: radius * 2 + 10,
                height: radius * 2 + 10
            }
        } else if ((element.type === 'line' || element.type === 'arrow') && element.start && element.end) {
            const minX = Math.min(element.start.x, element.end.x)
            const maxX = Math.max(element.start.x, element.end.x)
            const minY = Math.min(element.start.y, element.end.y)
            const maxY = Math.max(element.start.y, element.end.y)
            bounds = {
                x: minX - 5,
                y: minY - 5,
                width: maxX - minX + 10,
                height: maxY - minY + 10
            }
        } else if ((element.type === 'draw' || element.type === 'pen') && element.points) {
            const minX = Math.min(...element.points.map(p => p.x))
            const maxX = Math.max(...element.points.map(p => p.x))
            const minY = Math.min(...element.points.map(p => p.y))
            const maxY = Math.max(...element.points.map(p => p.y))
            bounds = {
                x: minX - 5,
                y: minY - 5,
                width: maxX - minX + 10,
                height: maxY - minY + 10
            }
        }

        if (!bounds) return null

        // Check each corner
        if (Math.abs(point.x - bounds.x) < handleSize && Math.abs(point.y - bounds.y) < handleSize) return 'nw'
        if (Math.abs(point.x - (bounds.x + bounds.width)) < handleSize && Math.abs(point.y - bounds.y) < handleSize) return 'ne'
        if (Math.abs(point.x - bounds.x) < handleSize && Math.abs(point.y - (bounds.y + bounds.height)) < handleSize) return 'sw'
        if (Math.abs(point.x - (bounds.x + bounds.width)) < handleSize && Math.abs(point.y - (bounds.y + bounds.height)) < handleSize) return 'se'

        return null
    }

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getMousePos(e)

        // Handle text mode
        if (mode === 'text') {
            // Check if clicking on existing text
            for (let i = elements.length - 1; i >= 0; i--) {
                const element = elements[i]
                if (element.type === 'text' && isPointInElement(pos, element)) {
                    setEditingText(element.id!)
                    setEditingTextValue(element.text || '')
                    setTextPosition(element.start || null)
                    setShowTextSaveButton(true)
                    setTimeout(() => textInputRef.current?.focus(), 0)
                    return
                }
            }

            // Add new text
            const newId = Date.now().toString()
            setEditingText(newId)
            setEditingTextValue('')
            setTextPosition(pos)
            setShowTextSaveButton(true)
            setTimeout(() => textInputRef.current?.focus(), 0)
            return
        }

        // Handle selection mode
        if (mode === 'select') {
            // Check for resize handle first
            for (let i = elements.length - 1; i >= 0; i--) {
                const element = elements[i]
                if (element.id === selectedElement) {
                    const handle = getResizeHandle(pos, element)
                    if (handle) {
                        setIsResizing(true)
                        setResizeHandle(handle)
                        setIsDrawing(true)
                        return
                    }
                }
            }

            // Check for element selection
            let found = false
            for (let i = elements.length - 1; i >= 0; i--) {
                const element = elements[i]
                if (isPointInElement(pos, element)) {
                    if (e.ctrlKey || e.metaKey) {
                        if (selectedElements.includes(element.id!)) {
                            setSelectedElements(selectedElements.filter(id => id !== element.id))
                            setSelectedElement(null)
                        } else {
                            setSelectedElements([...selectedElements, element.id!])
                            setSelectedElement(element.id!)
                        }
                    } else {
                        // Check if element is part of a group
                        if (element.groupId) {
                            const groupElements = getGroupElements(element.groupId)
                            setSelectedElements(groupElements)
                            setSelectedElement(null)
                        } else {
                            setSelectedElement(element.id!)
                            setSelectedElements([])
                        }

                        // Store the original elements and drag start position for ALL element types
                        setOriginalElements([...elements])
                        setDragStartPos(pos)
                        if (element.start) {
                            setDragOffset({ x: pos.x - element.start.x, y: pos.y - element.start.y })
                        } else if (element.points && element.points.length > 0) {
                            // For pencil/draw elements, calculate offset from first point or center
                            const minX = Math.min(...element.points.map(p => p.x))
                            const minY = Math.min(...element.points.map(p => p.y))
                            setDragOffset({ x: pos.x - minX, y: pos.y - minY })
                        }
                        // Important: Set isDrawing to true for dragging to work
                        setIsDrawing(true)
                    }
                    found = true
                    break
                }
            }

            if (!found && !e.ctrlKey && !e.metaKey) {
                setSelectedElement(null)
                setSelectedElements([])
            }

            return
        }

        // Handle drawing modes
        setIsDrawing(true)

        const newElement: DrawElement = {
            type: mode,
            start: mode === 'draw' || mode === 'pen' ? undefined : pos,
            end: mode === 'draw' || mode === 'pen' ? undefined : pos,
            points: mode === 'draw' || mode === 'pen' ? [pos] : undefined,
            color,
            fillColor,
            lineWidth: mode === 'pen' ? lineWidth : mode === 'draw' ? lineWidth : lineWidth,
            id: Date.now().toString()
        }

        setCurrentElement(newElement)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return

        const pos = getMousePos(e)

        // Handle resizing
        if (mode === 'select' && isResizing && selectedElement && resizeHandle) {
            const newElements = elements.map(el => {
                if (el.id !== selectedElement) return el

                if (el.type === 'image' && el.start && el.imageWidth && el.imageHeight) {
                    const newWidth = pos.x - el.start.x
                    const newHeight = pos.y - el.start.y
                    return { ...el, imageWidth: Math.max(20, newWidth), imageHeight: Math.max(20, newHeight) }
                } else if (el.type === 'rectangle' && el.start) {
                    return { ...el, end: pos }
                } else if (el.type === 'circle' && el.start) {
                    // For circle, update the end point to resize radius
                    return { ...el, end: pos }
                } else if ((el.type === 'line' || el.type === 'arrow') && el.start) {
                    // For lines and arrows, update the end point
                    return { ...el, end: pos }
                } else if ((el.type === 'draw' || el.type === 'pen') && el.points) {
                    const minX = Math.min(...el.points.map(p => p.x))
                    const maxX = Math.max(...el.points.map(p => p.x))
                    const minY = Math.min(...el.points.map(p => p.y))
                    const maxY = Math.max(...el.points.map(p => p.y))

                    const oldWidth = maxX - minX
                    const oldHeight = maxY - minY
                    const newWidth = pos.x - minX
                    const newHeight = pos.y - minY

                    const scaleX = newWidth / oldWidth
                    const scaleY = newHeight / oldHeight

                    return {
                        ...el,
                        points: el.points.map(p => ({
                            x: minX + (p.x - minX) * scaleX,
                            y: minY + (p.y - minY) * scaleY
                        }))
                    }
                }

                return el
            })

            setElements(newElements)
            return
        }

        // Handle dragging
        if (mode === 'select' && (selectedElement || selectedElements.length > 0) && dragStartPos && !isResizing) {
            const deltaX = pos.x - dragStartPos.x
            const deltaY = pos.y - dragStartPos.y

            const elementsToMove = selectedElements.length > 0 ? selectedElements : [selectedElement!]

            const newElements = originalElements.map(el => {
                if (!elementsToMove.includes(el.id!)) return el

                // Check for points first (pen/draw elements)
                if (el.points) {
                    // For pencil/draw elements, move all points by delta
                    return {
                        ...el,
                        points: el.points.map(p => ({ x: p.x + deltaX, y: p.y + deltaY }))
                    }
                } else if (el.start) {
                    const newStart = { x: el.start.x + deltaX, y: el.start.y + deltaY }
                    if (el.end) {
                        return {
                            ...el,
                            start: newStart,
                            end: { x: el.end.x + deltaX, y: el.end.y + deltaY }
                        }
                    }
                    return { ...el, start: newStart }
                }

                return el
            })

            setElements(newElements)
            return
        }

        // Handle drawing
        if (!currentElement) return

        if (mode === 'draw' || mode === 'pen') {
            const updatedElement = {
                ...currentElement,
                points: [...(currentElement.points || []), pos]
            }
            setCurrentElement(updatedElement)
            // Trigger immediate redraw for real-time feedback
            const canvas = canvasRef.current
            if (canvas) {
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    redrawCanvas()
                }
            }
        } else if (mode === 'screenshot-area') {
            setCurrentElement({
                ...currentElement,
                end: pos
            })
        } else {
            setCurrentElement({
                ...currentElement,
                end: pos
            })
        }
    }

    const stopDrawing = () => {
        if (!isDrawing) return

        setIsDrawing(false)

        // Handle screenshot area
        if (mode === 'screenshot-area' && currentElement && currentElement.start && currentElement.end) {
            const canvas = canvasRef.current
            if (canvas) {
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    const x = Math.min(currentElement.start.x, currentElement.end.x)
                    const y = Math.min(currentElement.start.y, currentElement.end.y)
                    const width = Math.abs(currentElement.end.x - currentElement.start.x)
                    const height = Math.abs(currentElement.end.y - currentElement.start.y)

                    // Only capture if width and height are greater than 0
                    if (width > 0 && height > 0) {
                        const imageData = ctx.getImageData(x, y, width, height)
                        const tempCanvas = document.createElement('canvas')
                        tempCanvas.width = width
                        tempCanvas.height = height
                        const tempCtx = tempCanvas.getContext('2d')
                        if (tempCtx) {
                            tempCtx.putImageData(imageData, 0, 0)
                            const dataUrl = tempCanvas.toDataURL()

                            const newElement: DrawElement = {
                                type: 'image',
                                start: { x, y },
                                imageData: dataUrl,
                                imageWidth: width,
                                imageHeight: height,
                                color: '#000000',
                                lineWidth: 1,
                                id: Date.now().toString()
                            }

                            const newElements = [...elements, newElement]
                            setElements(newElements)
                            addToHistory(newElements)
                        }
                    }
                }
            }

            setCurrentElement(null)
            setMode('select')
            return
        }

        // Handle resizing/dragging in select mode
        if (mode === 'select' && (isResizing || selectedElement)) {
            addToHistory(elements)
            setIsResizing(false)
            setResizeHandle(null)
            setDragOffset(null)
            setDragStartPos(null)
            setOriginalElements([])
            setCurrentElement(null)
            return
        }

        // Add current element to elements
        if (currentElement && currentElement.type !== 'screenshot-area') {
            const newElements = [...elements, currentElement]
            setElements(newElements)
            addToHistory(newElements)
        }

        setCurrentElement(null)
        setIsResizing(false)
        setResizeHandle(null)
        setDragOffset(null)
        setDragStartPos(null)
        setOriginalElements([])
    }

    const addToHistory = (newElements: DrawElement[]) => {
        const newHistory = history.slice(0, historyStep + 1)
        newHistory.push(newElements)
        setHistory(newHistory)
        setHistoryStep(newHistory.length - 1)
    }

    const undo = () => {
        if (historyStep > 0) {
            setHistoryStep(historyStep - 1)
            setElements(history[historyStep - 1])
        }
    }

    const redo = () => {
        if (historyStep < history.length - 1) {
            setHistoryStep(historyStep + 1)
            setElements(history[historyStep + 1])
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new Image()
            img.onload = () => {
                const maxSize = 600
                let width = img.width
                let height = img.height

                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = (height / width) * maxSize
                        width = maxSize
                    } else {
                        width = (width / height) * maxSize
                        height = maxSize
                    }
                }

                const newElement: DrawElement = {
                    type: 'image',
                    start: { x: 50, y: 50 },
                    imageData: event.target?.result as string,
                    imageWidth: width,
                    imageHeight: height,
                    color: '#000000',
                    lineWidth: 1,
                    id: Date.now().toString()
                }

                const newElements = [...elements, newElement]
                setElements(newElements)
                addToHistory(newElements)
            }
            img.src = event.target?.result as string
        }
        reader.readAsDataURL(file)

        // Reset input
        e.target.value = ''
    }

    const handleTextSave = () => {
        if (!editingText || !textPosition) return

        // Find existing text element
        const existingElement = elements.find(el => el.id === editingText)

        // If text is empty, remove the element if it exists
        if (!editingTextValue || !editingTextValue.trim()) {
            if (existingElement) {
                const newElements = elements.filter(el => el.id !== editingText)
                setElements(newElements)
                addToHistory(newElements)
            }
            setEditingText(null)
            setEditingTextValue('')
            setTextPosition(null)
            setShowTextSaveButton(false)
            return
        }

        if (existingElement) {
            // Update existing
            const newElements = elements.map(el =>
                el.id === editingText ? { ...el, text: editingTextValue } : el
            )
            setElements(newElements)
            addToHistory(newElements)
        } else {
            // Add new
            const newElement: DrawElement = {
                type: 'text',
                start: textPosition,
                text: editingTextValue,
                color,
                lineWidth,
                id: editingText
            }
            const newElements = [...elements, newElement]
            setElements(newElements)
            addToHistory(newElements)
        }

        setEditingText(null)
        setEditingTextValue('')
        setTextPosition(null)
        setShowTextSaveButton(false)
    }

    const handleTextCancel = () => {
        setEditingText(null)
        setEditingTextValue('')
        setTextPosition(null)
        setShowTextSaveButton(false)
    }

    const applyColorsToSelected = () => {
        if (selectedElement || selectedElements.length > 0) {
            setElements(prevElements => {
                const updated = prevElements.map(el => {
                    const isSelected = el.id === selectedElement || selectedElements.includes(el.id!)
                    if (isSelected) {
                        return {
                            ...el,
                            color: color,
                            fillColor: fillColor
                        }
                    }
                    return el
                })
                addToHistory(updated)
                return updated
            })
        }
    }

    const clearCanvas = () => {
        if (selectedElements.length > 0) {
            if (confirm(`Delete ${selectedElements.length} selected elements?`)) {
                const newElements = elements.filter(el => !selectedElements.includes(el.id!))
                setElements(newElements)
                addToHistory(newElements)
                setSelectedElements([])
            }
        } else if (selectedElement) {
            if (confirm('Delete selected element?')) {
                const newElements = elements.filter(el => el.id !== selectedElement)
                setElements(newElements)
                addToHistory(newElements)
                setSelectedElement(null)
            }
        } else {
            if (confirm('Clear entire canvas?')) {
                setElements([])
                addToHistory([])
            }
        }
    }

    const saveAsImage = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const link = document.createElement('a')
        link.download = 'canvas.png'
        link.href = canvas.toDataURL()
        link.click()
    }

    const handleSaveCanvas = () => {
        setSaveNameInput(canvasName)
        setShowSaveDialog(true)
    }

    const confirmSaveCanvas = () => {
        if (!saveNameInput.trim()) return

        try {
            const canvasData = {
                name: saveNameInput,
                elements: elements,
                timestamp: Date.now()
            }

            // Save to specific key
            const canvasKey = `canvas-${Date.now()}`
            localStorage.setItem(canvasKey, JSON.stringify(canvasData))

            // Update saved canvases list
            const updatedList = [...savedCanvases, canvasKey]
            setSavedCanvases(updatedList)
            localStorage.setItem(CANVAS_LIST_KEY, JSON.stringify(updatedList))

            // Update current canvas name
            setCanvasName(saveNameInput)
            setShowSaveDialog(false)
        } catch (e) {
            console.error('Error saving canvas:', e)
            alert('Error saving canvas. Storage might be full.')
        }
    }

    const loadCanvas = (canvasKey: string) => {
        try {
            const saved = localStorage.getItem(canvasKey)
            if (saved) {
                const data = JSON.parse(saved)
                setElements(data.elements || [])
                setCanvasName(data.name || 'Untitled Canvas')
                setHistory([data.elements || []])
                setHistoryStep(0)
                setShowLoadDialog(false)

                // Also update current canvas
                localStorage.setItem(CURRENT_CANVAS_KEY, saved)
            }
        } catch (e) {
            console.error('Error loading canvas:', e)
        }
    }

    const deleteCanvas = (canvasKey: string) => {
        if (!confirm('Delete this canvas?')) return

        try {
            localStorage.removeItem(canvasKey)
            const updatedList = savedCanvases.filter(key => key !== canvasKey)
            setSavedCanvases(updatedList)
            localStorage.setItem(CANVAS_LIST_KEY, JSON.stringify(updatedList))
        } catch (e) {
            console.error('Error deleting canvas:', e)
        }
    }

    const getSavedCanvasData = (canvasKey: string) => {
        try {
            const saved = localStorage.getItem(canvasKey)
            if (saved) {
                const data = JSON.parse(saved)
                return data
            }
        } catch (e) {
            console.error('Error getting canvas data:', e)
        }
        return null
    }

    const groupSelectedElements = () => {
        if (selectedElements.length < 2) {
            alert('Please select at least 2 elements to group')
            return
        }

        const groupId = `group-${Date.now()}`
        const newElements = elements.map(el => {
            if (selectedElements.includes(el.id!)) {
                return { ...el, groupId }
            }
            return el
        })

        setElements(newElements)
        addToHistory(newElements)

        // Update groups map
        const newGroups = new Map(groups)
        newGroups.set(groupId, [...selectedElements])
        setGroups(newGroups)

        setSelectedElements([])
    }

    const ungroupSelectedElements = () => {
        if (selectedElements.length === 0 && !selectedElement) {
            alert('Please select a grouped element to ungroup')
            return
        }

        const elementsToUngroup = selectedElements.length > 0 ? selectedElements : [selectedElement!]

        // Find which groups these elements belong to
        const groupsToRemove = new Set<string>()
        elements.forEach(el => {
            if (el.groupId && elementsToUngroup.includes(el.id!)) {
                groupsToRemove.add(el.groupId)
            }
        })

        if (groupsToRemove.size === 0) {
            alert('Selected elements are not grouped')
            return
        }

        // Remove groupId from all elements in these groups
        const newElements = elements.map(el => {
            if (el.groupId && groupsToRemove.has(el.groupId)) {
                const { groupId, ...rest } = el
                return rest as DrawElement
            }
            return el
        })

        setElements(newElements)
        addToHistory(newElements)

        // Update groups map
        const newGroups = new Map(groups)
        groupsToRemove.forEach(groupId => newGroups.delete(groupId))
        setGroups(newGroups)
    }

    // Helper function to get all elements in a group
    const getGroupElements = (groupId: string): string[] => {
        return elements.filter(el => el.groupId === groupId).map(el => el.id!)
    }

    // Update selection to include all grouped elements
    const selectElementWithGroup = (elementId: string) => {
        const element = elements.find(el => el.id === elementId)
        if (element?.groupId) {
            const groupElements = getGroupElements(element.groupId)
            setSelectedElements(groupElements)
            setSelectedElement(null)
        } else {
            setSelectedElement(elementId)
            setSelectedElements([])
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
        <Card ref={cardRef} className="h-full min-h-[600px] w-full min-w-[600px] flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            {canvasName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Draw, annotate, and create visual content • Auto-saved
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={handleSaveCanvas}
                            title="Save Canvas"
                        >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setShowLoadDialog(true)}
                            title="Load Canvas"
                        >
                            <FolderOpen className="h-3 w-3 mr-1" />
                            Load
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                        <Button
                            variant={mode === 'select' ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setMode('select')}
                            title="Select/Move"
                        >
                            <MousePointer2 className="h-3 w-3" />
                        </Button>
                        <Button
                            variant={mode === 'pen' ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setMode('pen')}
                            title="Pen"
                        >
                            <Pen className="h-3 w-3" />
                        </Button>
                        <Button
                            variant={mode === 'draw' ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setMode('draw')}
                            title="Draw"
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                            variant={mode === 'rectangle' ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setMode('rectangle')}
                            title="Rectangle"
                        >
                            <Square className="h-3 w-3" />
                        </Button>
                        <Button
                            variant={mode === 'circle' ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setMode('circle')}
                            title="Circle"
                        >
                            <Circle className="h-3 w-3" />
                        </Button>
                        <Button
                            variant={mode === 'line' ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setMode('line')}
                            title="Line"
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                            variant={mode === 'arrow' ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setMode('arrow')}
                            title="Arrow"
                        >
                            <ArrowUpRight className="h-3 w-3" />
                        </Button>
                        <Button
                            variant={mode === 'text' ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setMode('text')}
                            title="Text"
                        >
                            <Type className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-border" />

                    <div className="flex items-center gap-1">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="h-7 w-7 rounded border cursor-pointer"
                            title="Border Color"
                        />
                        <div className="relative">
                            <input
                                type="color"
                                value={fillColor === 'transparent' ? '#ffffff' : fillColor}
                                onChange={(e) => setFillColor(e.target.value)}
                                className="h-7 w-7 rounded border cursor-pointer"
                                title="Fill Color"
                            />
                            {fillColor === 'transparent' && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-5 h-0.5 bg-red-500 rotate-45" />
                                </div>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-1.5 text-xs"
                            onClick={() => setFillColor(fillColor === 'transparent' ? '#ffffff' : 'transparent')}
                            title={fillColor === 'transparent' ? 'Enable Fill' : 'Disable Fill'}
                        >
                            {fillColor === 'transparent' ? '○' : '●'}
                        </Button>
                        {(selectedElement || selectedElements.length > 0) && (
                            <Button
                                variant="default"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={applyColorsToSelected}
                                title="Apply colors to selected shape(s)"
                            >
                                Apply
                            </Button>
                        )}
                        <select
                            value={lineWidth}
                            onChange={(e) => setLineWidth(Number(e.target.value))}
                            className="h-7 px-2 text-xs rounded border bg-background"
                            title="Line Width"
                        >
                            <option value={1}>1px</option>
                            <option value={2}>2px</option>
                            <option value={3}>3px</option>
                            <option value={5}>5px</option>
                            <option value={8}>8px</option>
                        </select>
                    </div>

                    <div className="h-6 w-px bg-border" />

                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={groupSelectedElements}
                            disabled={selectedElements.length < 2}
                            title="Group Selected Elements"
                        >
                            <Group className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={ungroupSelectedElements}
                            disabled={selectedElements.length === 0 && !selectedElement}
                            title="Ungroup Selected Elements"
                        >
                            <Ungroup className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-border" />

                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={undo}
                            disabled={historyStep <= 0}
                            title="Undo"
                        >
                            <Undo className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={redo}
                            disabled={historyStep >= history.length - 1}
                            title="Redo"
                        >
                            <Redo className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => fileInputRef.current?.click()}
                            title="Upload Image"
                        >
                            <Upload className="h-3 w-3" />
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={saveAsImage}
                            title="Save as Image"
                        >
                            <Download className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive"
                            onClick={clearCanvas}
                            title="Clear Canvas"
                        >
                            <Trash2 className="h-3 w-3" />
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
                </div>

                {/* Canvas Area */}
                <div className="flex-1 min-h-[500px] overflow-hidden rounded-lg p-2">
                    <div
                        ref={containerRef}
                        className="w-full h-full bg-white dark:bg-slate-950 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 relative"
                    >
                        <canvas
                            ref={canvasRef}
                            className={cn("absolute inset-0",
                                mode === 'select' ? 'cursor-pointer' :
                                    mode === 'screenshot-area' ? 'cursor-crosshair' :
                                        mode === 'text' ? 'cursor-text' :
                                            'cursor-crosshair'
                            )}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />

                        {/* Text Input Overlay */}
                        {editingText && textPosition && (
                            <div
                                className="absolute bg-white dark:bg-slate-800 rounded shadow-lg border-2 border-blue-500"
                                style={{
                                    left: textPosition.x,
                                    top: textPosition.y,
                                    zIndex: 1000,
                                    minWidth: '250px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <div className="p-2">
                                    <textarea
                                        ref={textInputRef}
                                        value={editingTextValue}
                                        onChange={(e) => setEditingTextValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                handleTextCancel()
                                            }
                                            e.stopPropagation()
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 p-2 w-full"
                                        style={{
                                            fontSize: `${lineWidth * 8}px`,
                                            color: color,
                                            minHeight: '60px',
                                            fontFamily: 'Arial',
                                            resize: 'vertical',
                                            whiteSpace: 'pre-wrap'
                                        }}
                                        placeholder="Type text here..."
                                    />
                                    {showTextSaveButton && (
                                        <div className="flex gap-2 mt-2 border-t pt-2">
                                            <Button
                                                size="sm"
                                                onClick={handleTextSave}
                                                className="h-7 px-3 text-xs flex-1"
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleTextCancel}
                                                className="h-7 px-3 text-xs flex-1"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="text-xs text-muted-foreground text-center">
                    {mode === 'select' && 'Click to select • Ctrl+Click for multi-select • Ctrl+A to select all'}
                    {mode === 'pen' && 'Use pen for fine writing and annotations • Switch to Select mode (cursor icon) to move drawings'}
                    {mode === 'draw' && 'Click and drag to draw • Switch to Select mode (cursor icon) to move drawings'}
                    {mode === 'rectangle' && 'Click and drag to create rectangle'}
                    {mode === 'circle' && 'Click and drag to create circle'}
                    {mode === 'line' && 'Click and drag to draw line'}
                    {mode === 'arrow' && 'Click and drag to draw arrow'}
                    {mode === 'text' && 'Click to add text or click existing text to edit • Click Save button to confirm'}
                    {mode === 'screenshot-area' && 'Click and drag to select area to capture from canvas'}
                    {' • '}
                    {elements.length} elements
                    {selectedElements.length > 0 ? ` • ${selectedElements.length} selected` : selectedElement ? ' • 1 selected' : ''}
                </div>
            </CardContent>

            {/* Save Canvas Dialog */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Canvas</DialogTitle>
                        <DialogDescription>
                            Give your canvas a name to save it for later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="canvas-name">Canvas Name</Label>
                        <Input
                            id="canvas-name"
                            value={saveNameInput}
                            onChange={(e) => setSaveNameInput(e.target.value)}
                            placeholder="Enter canvas name..."
                            className="mt-2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    confirmSaveCanvas()
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmSaveCanvas}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Load Canvas Dialog */}
            <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Load Canvas</DialogTitle>
                        <DialogDescription>
                            Select a previously saved canvas to load.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 max-h-96 overflow-y-auto">
                        {savedCanvases.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No saved canvases yet. Save your current canvas to see it here.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {savedCanvases.map((canvasKey) => {
                                    const canvasData = getSavedCanvasData(canvasKey)
                                    if (!canvasData) return null

                                    return (
                                        <div
                                            key={canvasKey}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                                            onClick={() => loadCanvas(canvasKey)}
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium">{canvasData.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(canvasData.timestamp).toLocaleDateString()} at {new Date(canvasData.timestamp).toLocaleTimeString()}
                                                    {' • '}
                                                    {canvasData.elements?.length || 0} elements
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    deleteCanvas(canvasKey)
                                                }}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
