import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { RAGStatus, Priority, ProjectStatus, TaskStatus } from "@/types"

interface StatusBadgeProps {
    status: RAGStatus | Priority | ProjectStatus | TaskStatus | string
    className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const getVariantAndText = () => {
        switch (status) {
            // RAG Status
            case "GREEN":
                return { variant: "success" as const, text: "On Track" }
            case "AMBER":
                return { variant: "warning" as const, text: "At Risk" }
            case "RED":
                return { variant: "destructive" as const, text: "Critical" }

            // Priority
            case "CRITICAL":
                return { variant: "destructive" as const, text: "Critical" }
            case "HIGH":
                return { variant: "destructive" as const, text: "High" }
            case "MEDIUM":
                return { variant: "warning" as const, text: "Medium" }
            case "LOW":
                return { variant: "info" as const, text: "Low" }

            // Project Status
            case "PLANNING":
                return { variant: "info" as const, text: "Planning" }
            case "IN_PROGRESS":
                return { variant: "info" as const, text: "In Progress" }
            case "ON_HOLD":
                return { variant: "warning" as const, text: "On Hold" }
            case "AT_RISK":
                return { variant: "destructive" as const, text: "At Risk" }
            case "COMPLETED":
                return { variant: "success" as const, text: "Completed" }
            case "CANCELLED":
                return { variant: "outline" as const, text: "Cancelled" }

            // Task Status
            case "BACKLOG":
                return { variant: "outline" as const, text: "Backlog" }
            case "TODO":
                return { variant: "secondary" as const, text: "To Do" }
            case "IN_REVIEW":
                return { variant: "warning" as const, text: "In Review" }
            case "BLOCKED":
                return { variant: "destructive" as const, text: "Blocked" }
            case "DONE":
                return { variant: "success" as const, text: "Done" }

            default:
                return { variant: "outline" as const, text: status }
        }
    }

    const { variant, text } = getVariantAndText()

    return (
        <Badge variant={variant} className={cn("font-medium", className)}>
            {text}
        </Badge>
    )
}

