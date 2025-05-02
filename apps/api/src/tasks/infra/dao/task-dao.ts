import type { CreateTaskData, Task, TaskFilter, UpdateTaskData } from "@dipcord/domain";

import { and, count, eq, inArray, isNotNull, isNull } from "drizzle-orm";

import type { Pagination, SortBy } from "#commons/app/index.js";
import type { Database } from "#commons/infra/plugins/database.js";

import { buildSortBy } from "#commons/infra/dao/utils.js";
import { tasks } from "#db/schema/index.js";

import type { TaskRepository } from "../../app/ports/outgoing.js";

/**
 * Task Data Access Object
 * Implements TaskRepository interface using Drizzle ORM
 */
export class TaskDao implements TaskRepository {
    /**
     * Create a new TaskDao
     * @param db Drizzle database instance
     */
    constructor(private readonly db: Database) {}

    /**
     * Create a new task
     * @param data Task data
     * @returns Created task
     */
    async createTask(data: CreateTaskData & { createdByUserId: string }): Promise<Task> {
        const result = await this.db
            .insert(tasks)
            .values({
                channelId: data.channelId,
                createdByUserId: data.createdByUserId,
                assignedToUserId: data.assignedToUserId || null,
                title: data.title,
                description: data.description || null,
                dueDate: data.dueDate || null,
                priority: data.priority || "medium",
                status: "new",
            })
            .returning();

        if (!result[0]) {
            throw new Error("Task not created");
        }

        return this.mapToDomainTask(result[0]);
    }

    /**
     * Find task by ID
     * @param taskId Task ID
     * @returns Task or null if not found
     */
    async findTaskById(taskId: string): Promise<Task | null> {
        const result = await this.db
            .select()
            .from(tasks)
            .where(eq(tasks.id, taskId))
            .limit(1);

        if (!result[0]) {
            return null;
        }

        return this.mapToDomainTask(result[0]);
    }

    /**
     * Find tasks with filtering, pagination and sorting
     * @param filter Task filters
     * @param pagination Pagination parameters
     * @param sortBy Sort configuration
     * @returns Tasks with count
     */
    async findTasks(
        filter: TaskFilter,
        pagination: Pagination,
        sortBy: SortBy<Task>,
    ): Promise<{
            tasks: Task[];
            count: number;
        }> {
        // Build where conditions based on filters
        const conditions = [eq(tasks.channelId, filter.channelId)];

        if (filter.status && filter.status.length > 0) {
            conditions.push(inArray(tasks.status, filter.status));
        }

        if (filter.assignedToUserId) {
            conditions.push(eq(tasks.assignedToUserId, filter.assignedToUserId));
        }

        // Get count of total tasks matching filters
        const countResult = await this.db
            .select({ value: count() })
            .from(tasks)
            .where(and(...conditions));

        const total = countResult[0]?.value ?? 0;

        // Get tasks with pagination and sorting
        const result = await this.db
            .select()
            .from(tasks)
            .where(and(...conditions))
            .limit(pagination.limit)
            .offset(pagination.offset)
            .orderBy(...buildSortBy(sortBy));

        return {
            tasks: result.map(task => this.mapToDomainTask(task)),
            count: total,
        };
    }

    /**
     * Update task
     * @param taskId Task ID
     * @param data Update data
     * @returns Updated task
     */
    async updateTask(taskId: string, data: UpdateTaskData): Promise<Task> {
        // Build update object based on provided data
        const updateData: Partial<typeof tasks.$inferInsert> = {
            updatedAt: new Date(),
        };

        if (data.title !== undefined) {
            updateData.title = data.title;
        }

        if (data.description !== undefined) {
            updateData.description = data.description;
        }

        if (data.dueDate !== undefined) {
            updateData.dueDate = data.dueDate;
        }

        if (data.priority !== undefined) {
            updateData.priority = data.priority;
        }

        if (data.assignedToUserId !== undefined) {
            updateData.assignedToUserId = data.assignedToUserId;
        }

        if (data.status !== undefined) {
            updateData.status = data.status;
        }

        const result = await this.db
            .update(tasks)
            .set(updateData)
            .where(eq(tasks.id, taskId))
            .returning();

        if (!result[0]) {
            throw new Error(`Task with ID ${taskId} not found`);
        }

        return this.mapToDomainTask(result[0]);
    }

    /**
     * Delete task
     * @param taskId Task ID
     * @returns Deleted task
     */
    async deleteTask(taskId: string): Promise<Task> {
        const result = await this.db
            .delete(tasks)
            .where(eq(tasks.id, taskId))
            .returning();

        if (!result[0]) {
            throw new Error(`Task with ID ${taskId} not found`);
        }

        return this.mapToDomainTask(result[0]);
    }

    /**
     * Map database task entity to domain task entity
     * @param task Database task entity
     * @returns Domain task entity
     */
    private mapToDomainTask(task: typeof tasks.$inferSelect): Task {
        return {
            id: task.id,
            channelId: task.channelId,
            createdByUserId: task.createdByUserId,
            assignedToUserId: task.assignedToUserId,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority as "low" | "medium" | "high",
            status: task.status as "new" | "in_progress" | "completed",
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        };
    }
}
