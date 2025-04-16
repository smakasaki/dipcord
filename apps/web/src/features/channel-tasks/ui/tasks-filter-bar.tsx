import type { TaskStatus } from "#/shared/api/tasks/types";

import {
    Button,
    Checkbox,
    Group,
    Menu,
    SegmentedControl,
    TextInput,
} from "@mantine/core";
import {
    IconAdjustmentsHorizontal,
    IconCalendarTime,
    IconFilter,
    IconPlus,
    IconSearch,
    IconSortAscending,
    IconSortDescending,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { useTaskActions } from "../model";

type TasksFilterBarProps = {
    onNewTask: () => void;
    onRefresh: () => void;
};

// Define the extended task actions interface
type ExtendedTaskActions = {
    setViewMode: (mode: "kanban" | "list") => void;
    setFilterMyTasks: (value: boolean) => void;
    setFilterStatus: (status: TaskStatus | null) => void;
    setSearchQuery: (query: string) => void;
    setSortBy: (sortBy: string) => void;
    viewMode: "kanban" | "list";
    filterMyTasks: boolean;
    filterStatus: TaskStatus | null;
    searchQuery: string;
    // Original task actions properties will be included as well
    refreshTasks: () => Promise<void>;
    createTask: (taskData: any) => Promise<any>;
    updateTask: (taskId: string, taskData: any) => Promise<any>;
    deleteTask: (taskId: string) => Promise<boolean>;
    updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<any>;
    selectTask: (taskId: string | null) => void;
};

export function TasksFilterBar({ onNewTask, onRefresh }: TasksFilterBarProps) {
    // Use type assertion to treat useTaskActions as ExtendedTaskActions
    const taskActions = useTaskActions() as unknown as ExtendedTaskActions;

    const {
        setViewMode,
        setFilterMyTasks,
        setFilterStatus,
        setSearchQuery,
        setSortBy,
        viewMode,
        filterMyTasks,
        filterStatus,
        searchQuery,
    } = taskActions;

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

    // Apply search query after user stops typing
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (localSearchQuery !== searchQuery) {
                setSearchQuery(localSearchQuery);
                onRefresh();
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [localSearchQuery, searchQuery, setSearchQuery, onRefresh]);

    // Handle view mode change
    const handleViewModeChange = (value: string) => {
        setViewMode(value as "kanban" | "list");
    };

    // Handle filter changes
    const handleMyTasksChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilterMyTasks(event.currentTarget.checked);
        onRefresh();
    };

    const handleStatusFilterChange = (status: TaskStatus | null) => {
        setFilterStatus(status);
        onRefresh();
    };

    // Handle sort changes
    const handleSortChange = (sortBy: string) => {
        setSortBy(sortBy);
        onRefresh();
    };

    return (
        <Group justify="space-between" mb="md">
            <Group>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={onNewTask}
                >
                    New Task
                </Button>

                <Menu position="bottom-start" shadow="md">
                    <Menu.Target>
                        <Button
                            variant="light"
                            leftSection={<IconFilter size={16} />}
                            color={filterMyTasks || filterStatus ? "blue" : undefined}
                        >
                            Filter
                        </Button>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Label>Task Filters</Menu.Label>

                        <Menu.Item closeMenuOnClick={false}>
                            <Checkbox
                                label="My Tasks"
                                checked={filterMyTasks}
                                onChange={handleMyTasksChange}
                            />
                        </Menu.Item>

                        <Menu.Divider />
                        <Menu.Label>Status</Menu.Label>

                        <Menu.Item
                            color={filterStatus === null ? "blue" : undefined}
                            onClick={() => handleStatusFilterChange(null)}
                        >
                            All Statuses
                        </Menu.Item>
                        <Menu.Item
                            color={filterStatus === "new" ? "blue" : undefined}
                            onClick={() => handleStatusFilterChange("new")}
                        >
                            New
                        </Menu.Item>
                        <Menu.Item
                            color={filterStatus === "in_progress" ? "blue" : undefined}
                            onClick={() => handleStatusFilterChange("in_progress")}
                        >
                            In Progress
                        </Menu.Item>
                        <Menu.Item
                            color={filterStatus === "completed" ? "blue" : undefined}
                            onClick={() => handleStatusFilterChange("completed")}
                        >
                            Completed
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>

                <TextInput
                    placeholder="Search tasks..."
                    leftSection={<IconSearch size={16} />}
                    value={localSearchQuery}
                    onChange={e => setLocalSearchQuery(e.currentTarget.value)}
                    style={{ width: 200 }}
                />
            </Group>

            <Group>
                <Menu position="bottom-end" shadow="md">
                    <Menu.Target>
                        <Button
                            variant="subtle"
                            leftSection={<IconAdjustmentsHorizontal size={16} />}
                        >
                            Sort
                        </Button>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Label>Sort Tasks By</Menu.Label>

                        <Menu.Item
                            leftSection={<IconCalendarTime size={16} />}
                            onClick={() => handleSortChange("dueDate.asc")}
                            rightSection={<IconSortAscending size={16} />}
                        >
                            Due Date (Earliest)
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<IconCalendarTime size={16} />}
                            onClick={() => handleSortChange("dueDate.desc")}
                            rightSection={<IconSortDescending size={16} />}
                        >
                            Due Date (Latest)
                        </Menu.Item>

                        <Menu.Item
                            onClick={() => handleSortChange("priority.desc")}
                            rightSection={<IconSortDescending size={16} />}
                        >
                            Priority (High to Low)
                        </Menu.Item>
                        <Menu.Item
                            onClick={() => handleSortChange("priority.asc")}
                            rightSection={<IconSortAscending size={16} />}
                        >
                            Priority (Low to High)
                        </Menu.Item>

                        <Menu.Item
                            onClick={() => handleSortChange("title.asc")}
                            rightSection={<IconSortAscending size={16} />}
                        >
                            Title (A-Z)
                        </Menu.Item>
                        <Menu.Item
                            onClick={() => handleSortChange("title.desc")}
                            rightSection={<IconSortDescending size={16} />}
                        >
                            Title (Z-A)
                        </Menu.Item>

                        <Menu.Item
                            onClick={() => handleSortChange("createdAt.desc")}
                            rightSection={<IconSortDescending size={16} />}
                        >
                            Created (Newest First)
                        </Menu.Item>
                        <Menu.Item
                            onClick={() => handleSortChange("createdAt.asc")}
                            rightSection={<IconSortAscending size={16} />}
                        >
                            Created (Oldest First)
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>

                <SegmentedControl
                    data={[
                        { label: "Kanban", value: "kanban" },
                        { label: "List", value: "list" },
                    ]}
                    value={viewMode}
                    onChange={handleViewModeChange}
                />
            </Group>
        </Group>
    );
}
