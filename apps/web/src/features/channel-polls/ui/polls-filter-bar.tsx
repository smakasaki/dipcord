import {
    ActionIcon,
    Button,
    Group,
    Paper,
    SegmentedControl,
    Text,
    Tooltip,
} from "@mantine/core";
import { IconPlus, IconRefresh } from "@tabler/icons-react";

import { useActivePolls, useCompletedPolls, usePollActions } from "../model/selectors";

type PollsFilterBarProps = {
    onCreatePoll: () => void;
    view: "all" | "active" | "completed";
    onViewChange: (view: string) => void;
};

export function PollsFilterBar({ onCreatePoll, view, onViewChange }: PollsFilterBarProps) {
    const { refreshPolls } = usePollActions();
    const activePolls = useActivePolls();
    const completedPolls = useCompletedPolls();

    const handleRefresh = () => {
        refreshPolls();
    };

    return (
        <Paper p="md" withBorder mb="lg">
            <Group justify="space-between">
                <Group>
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={onCreatePoll}
                    >
                        Create Poll
                    </Button>

                    <Tooltip label="Refresh polls">
                        <ActionIcon
                            variant="subtle"
                            onClick={handleRefresh}
                            size="lg"
                        >
                            <IconRefresh size={18} />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                <Group>
                    <Text size="sm" fw={500} c="dimmed">
                        View:
                    </Text>

                    <SegmentedControl
                        value={view}
                        onChange={onViewChange}
                        data={[
                            {
                                label: `All (${activePolls.length + completedPolls.length})`,
                                value: "all",
                            },
                            {
                                label: `Active (${activePolls.length})`,
                                value: "active",
                            },
                            {
                                label: `Completed (${completedPolls.length})`,
                                value: "completed",
                            },
                        ]}
                        size="xs"
                    />
                </Group>
            </Group>
        </Paper>
    );
}
