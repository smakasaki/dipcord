export interface Task {
    id: string;
    channelId: string;
    createdByUserId: string;
    assignedToUserId: string | null;
    title: string;
    description: string | null;
    dueDate: Date | null;
    priority: "low" | "medium" | "high";
    status: "new" | "in_progress" | "completed";
    createdAt: Date;
    updatedAt: Date;
}