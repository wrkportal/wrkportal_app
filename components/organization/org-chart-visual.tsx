'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface User {
    id: string
    firstName: string
    lastName: string
    role: string
    avatar?: string
    department?: string
}

interface OrgNode {
    user: User
    children: OrgNode[]
    level: number
}

interface OrgChartVisualProps {
    users: User[]
    isAdmin?: boolean
    onDelete?: (id: string, name: string) => void
}

export function OrgChartVisual({ users, isAdmin = false, onDelete }: OrgChartVisualProps) {
    const [orgTree, setOrgTree] = useState<OrgNode[]>([])

    useEffect(() => {
        buildOrgTree()
    }, [users])

    const buildOrgTree = () => {
        // Sort users by role hierarchy
        const roleHierarchy: Record<string, number> = {
            'TENANT_SUPER_ADMIN': 1,
            'ORG_ADMIN': 1,
            'EXECUTIVE': 2,
            'PMO_LEAD': 2,
            'PROJECT_MANAGER': 3,
            'RESOURCE_MANAGER': 3,
            'FINANCE_CONTROLLER': 3,
            'TEAM_MEMBER': 4,
            'CLIENT_STAKEHOLDER': 4,
            'COMPLIANCE_AUDITOR': 4,
            'INTEGRATION_ADMIN': 4,
        }

        const usersByLevel: Record<number, User[]> = {}

        users.forEach(user => {
            const level = roleHierarchy[user.role] || 4
            if (!usersByLevel[level]) {
                usersByLevel[level] = []
            }
            usersByLevel[level].push(user)
        })

        // Build tree structure
        const tree: OrgNode[] = []
        const levels = Object.keys(usersByLevel).sort()

        levels.forEach(levelStr => {
            const level = parseInt(levelStr)
            usersByLevel[level].forEach(user => {
                tree.push({
                    user,
                    children: [],
                    level,
                })
            })
        })

        setOrgTree(tree)
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
    }

    const getLevelColor = (level: number) => {
        switch (level) {
            case 1:
                return {
                    bg: 'bg-gradient-to-br from-green-400 to-emerald-500',
                    border: 'border-green-300',
                    text: 'text-green-900',
                }
            case 2:
                return {
                    bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
                    border: 'border-blue-300',
                    text: 'text-blue-900',
                }
            case 3:
                return {
                    bg: 'bg-gradient-to-br from-gray-400 to-gray-500',
                    border: 'border-gray-300',
                    text: 'text-gray-900',
                }
            default:
                return {
                    bg: 'bg-gradient-to-br from-blue-100 to-blue-200',
                    border: 'border-blue-200',
                    text: 'text-blue-800',
                }
        }
    }

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            'TENANT_SUPER_ADMIN': 'Super Admin',
            'ORG_ADMIN': 'Organization Admin',
            'EXECUTIVE': 'Executive',
            'PMO_LEAD': 'PMO Lead',
            'PROJECT_MANAGER': 'Project Manager',
            'RESOURCE_MANAGER': 'Resource Manager',
            'FINANCE_CONTROLLER': 'Finance Controller',
            'TEAM_MEMBER': 'Team Member',
            'CLIENT_STAKEHOLDER': 'Client Stakeholder',
            'COMPLIANCE_AUDITOR': 'Compliance Auditor',
            'INTEGRATION_ADMIN': 'Integration Admin',
        }
        return labels[role] || role
    }

    const renderNode = (node: OrgNode, index: number, totalAtLevel: number) => {
        const colors = getLevelColor(node.level)
        const isEmployee = node.level === 4

        if (isEmployee) {
            return (
                <div key={node.user.id} className="relative">
                    {/* Connecting Line */}
                    <div className="absolute left-1/2 -top-6 w-0.5 h-6 bg-blue-300" />

                    <div className="bg-blue-100 dark:bg-blue-950 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-3 min-w-[140px] relative">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-center flex-1">
                                <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                                    {node.user.firstName} {node.user.lastName}
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    {getRoleLabel(node.user.role)}
                                </p>
                            </div>
                            {isAdmin && onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(node.user.id, `${node.user.firstName} ${node.user.lastName}`)}
                                    className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div key={node.user.id} className="flex flex-col items-center relative">
                {/* Connecting Line from top */}
                {node.level > 1 && (
                    <div className="absolute left-1/2 -top-8 w-0.5 h-8 bg-blue-300" />
                )}

                {/* Manager Node */}
                <div className="relative group">
                    <Avatar className={`h-24 w-24 border-4 ${colors.border} shadow-lg ${colors.bg}`}>
                        <AvatarImage src={node.user.avatar} />
                        <AvatarFallback className="text-white text-xl font-bold bg-transparent">
                            {getInitials(node.user.firstName, node.user.lastName)}
                        </AvatarFallback>
                    </Avatar>

                    {isAdmin && onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(node.user.id, `${node.user.firstName} ${node.user.lastName}`)}
                            className="absolute -top-2 -right-2 h-6 w-6 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                <div className="mt-2 text-center bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {node.user.firstName} {node.user.lastName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {getRoleLabel(node.user.role)}
                    </p>
                    {node.user.department && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {node.user.department}
                        </p>
                    )}
                </div>
            </div>
        )
    }

    const groupByLevel = () => {
        const levels: Record<number, OrgNode[]> = {}
        orgTree.forEach(node => {
            if (!levels[node.level]) {
                levels[node.level] = []
            }
            levels[node.level].push(node)
        })
        return levels
    }

    const leveledNodes = groupByLevel()
    const sortedLevels = Object.keys(leveledNodes).sort()

    if (orgTree.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No users to display in org chart</p>
            </div>
        )
    }

    return (
        <div className="w-full overflow-x-auto pb-8">
            <div className="min-w-max mx-auto p-8">
                <div className="flex flex-col items-center gap-12">
                    {sortedLevels.map((levelStr) => {
                        const level = parseInt(levelStr)
                        const nodesAtLevel = leveledNodes[level]

                        return (
                            <div key={level} className="relative w-full">
                                {/* Horizontal Connector Line for multiple nodes */}
                                {nodesAtLevel.length > 1 && level > 1 && (
                                    <div className="absolute top-0 left-0 right-0 flex justify-center">
                                        <div
                                            className="h-0.5 bg-blue-300"
                                            style={{
                                                width: `${(nodesAtLevel.length - 1) * 250}px`,
                                                marginTop: '-32px'
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="flex justify-center items-start gap-8 flex-wrap">
                                    {nodesAtLevel.map((node, index) => (
                                        <div key={node.user.id} className="relative">
                                            {renderNode(node, index, nodesAtLevel.length)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

