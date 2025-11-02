'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Building2, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'

interface OrgUnit {
    id: string
    name: string
    description?: string
    parentId?: string | null
    children: OrgUnit[]
    _count: {
        users: number
        children: number
    }
}

interface OrgChartProps {
    data: OrgUnit[]
    isAdmin?: boolean
    onDelete?: (id: string, name: string) => void
}

export function OrgChart({ data, isAdmin = false, onDelete }: OrgChartProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

    // Auto-expand root nodes
    useEffect(() => {
        const rootNodes = data.filter(unit => !unit.parentId)
        setExpandedNodes(new Set(rootNodes.map(node => node.id)))
    }, [data])

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const buildHierarchy = (units: OrgUnit[]): OrgUnit[] => {
        const map = new Map<string, OrgUnit>()
        const roots: OrgUnit[] = []

        // Initialize map
        units.forEach(unit => {
            map.set(unit.id, { ...unit, children: [] })
        })

        // Build hierarchy
        units.forEach(unit => {
            const node = map.get(unit.id)!
            if (unit.parentId) {
                const parent = map.get(unit.parentId)
                if (parent) {
                    parent.children.push(node)
                }
            } else {
                roots.push(node)
            }
        })

        return roots
    }

    const renderNode = (node: OrgUnit, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0
        const isExpanded = expandedNodes.has(node.id)

        return (
            <div key={node.id} className="relative">
                {/* Node Card */}
                <div
                    className={`flex items-start gap-3 transition-all ${level > 0 ? 'ml-8 mt-3' : 'mt-3'}`}
                    style={{ marginLeft: level > 0 ? `${level * 2}rem` : 0 }}
                >
                    {/* Connection Line */}
                    {level > 0 && (
                        <div className="absolute left-0 top-0 w-8 h-6 border-l-2 border-b-2 border-gray-300 dark:border-gray-600 rounded-bl-lg"
                            style={{ left: `${(level - 1) * 2}rem` }}
                        />
                    )}

                    {/* Expand/Collapse Button */}
                    {hasChildren && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 mt-2"
                            onClick={() => toggleNode(node.id)}
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                    )}

                    {/* Unit Card */}
                    <Card className={`flex-1 hover:shadow-md transition-shadow ${level === 0 ? 'border-2 border-purple-200 dark:border-purple-800' : ''}`}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-2 rounded-lg ${level === 0 ? 'bg-purple-100 dark:bg-purple-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                                            <Building2 className={`h-4 w-4 ${level === 0 ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-base">{node.name}</h3>
                                            {node.description && (
                                                <p className="text-sm text-muted-foreground">{node.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-2">
                                        <Badge variant="secondary" className="text-xs">
                                            <Users className="h-3 w-3 mr-1" />
                                            {node._count.users} {node._count.users === 1 ? 'user' : 'users'}
                                        </Badge>
                                        {hasChildren && (
                                            <Badge variant="outline" className="text-xs">
                                                {node._count.children} sub-unit{node._count.children !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Delete Button - Admin Only */}
                                {isAdmin && onDelete && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(node.id, node.name)}
                                        disabled={node._count.users > 0 || node._count.children > 0}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 h-8 w-8"
                                        title={
                                            node._count.users > 0
                                                ? 'Cannot delete: has assigned users'
                                                : node._count.children > 0
                                                    ? 'Cannot delete: has sub-units'
                                                    : 'Delete org unit'
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Render Children */}
                {hasChildren && isExpanded && (
                    <div className="relative">
                        {node.children.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    const hierarchy = buildHierarchy(data)

    if (hierarchy.length === 0) {
        return (
            <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No organizational units found</p>
                <p className="text-sm text-muted-foreground mt-2">Create your first org unit to get started</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {hierarchy.map(node => renderNode(node, 0))}
        </div>
    )
}

