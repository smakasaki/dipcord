import type { TaskStatus } from "#/shared/api/tasks/types";

import { Container, Loader, Paper, Text } from "@mantine/core";
import { useParams } from "@tanstack/react-router";
import { TaskDetailPanel, TaskKanbanView, TaskListView, TasksFilterBar, useSelectedTask, useTaskActions, useTasks, useTasksLoading, useViewMode } from "#/features/channel-tasks";
import { useEffect, useState } from "react";

export function TaskPage() {
    const { channelId } = useParams({ from: "/app/$channelId/tasks" });

    // Get task actions and other data
    const { refreshTasks, selectTask, setCurrentChannel } = useTaskActions();
    const isLoading = useTasksLoading();
    const tasks = useTasks();
    const viewMode = useViewMode();
    const selectedTask = useSelectedTask();

    // State for task detail panel
    const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
    const [initialTaskStatus, setInitialTaskStatus] = useState<TaskStatus>("new");

    // Load tasks when the channel ID changes
    useEffect(() => {
        if (channelId) {
            // First set the current channel
            setCurrentChannel(channelId);
            // Then refresh tasks
            refreshTasks();
        }
    }, [channelId, refreshTasks, setCurrentChannel]);

    // Handle opening the task detail panel for editing
    useEffect(() => {
        setIsTaskPanelOpen(!!selectedTask);
    }, [selectedTask]);

    // Handle closing the detail panel
    const handleCloseTaskPanel = () => {
        setIsTaskPanelOpen(false);
        selectTask(null);
    };

    // Handle creating a new task
    const handleNewTask = (initialStatus?: TaskStatus) => {
        if (initialStatus) {
            setInitialTaskStatus(initialStatus);
        }
        setIsTaskPanelOpen(true);
    };

    return (
        <Container fluid px="md" py="md">
            {/* Filter and Action Bar */}
            <TasksFilterBar
                onNewTask={() => handleNewTask()}
                onRefresh={refreshTasks}
            />

            {/* Main Content */}
            <Paper p="md" withBorder>
                {isLoading && tasks.length === 0
                    ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "50px 0" }}>
                                <Loader size="lg" />
                            </div>
                        )
                    : tasks.length === 0
                        ? (
                                <div style={{ textAlign: "center", padding: "50px 0" }}>
                                    <Text size="lg" fw={500} c="dimmed">No tasks found</Text>
                                    <Text c="dimmed" mt="xs">Create a new task to get started</Text>
                                </div>
                            )
                        : (
                                <>
                                    {viewMode === "kanban"
                                        ? (
                                                <TaskKanbanView onAddTask={status => handleNewTask(status)} />
                                            )
                                        : (
                                                <TaskListView tasks={tasks} />
                                            )}
                                </>
                            )}
            </Paper>

            {/* Task Detail Panel */}
            <TaskDetailPanel
                task={selectedTask}
                isOpen={isTaskPanelOpen}
                onClose={handleCloseTaskPanel}
                initialStatus={initialTaskStatus}
            />
        </Container>
    );
}
