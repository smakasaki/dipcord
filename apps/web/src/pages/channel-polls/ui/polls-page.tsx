import { Alert, Box, Container, Loader, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useParams } from "@tanstack/react-router";
import {
    CreatePollForm,
    PollCard,
    PollResultsChart,
    PollsFilterBar,
    useActivePolls,
    useCompletedPolls,
    usePollActions,
    usePolls,
    usePollsError,
    usePollsLoading,
} from "#/features/channel-polls";
import { useEffect, useState } from "react";

export function PollsPage() {
    const { channelId } = useParams({ from: "/app/$channelId/polls" });
    const [createPollOpen, setCreatePollOpen] = useState(false);
    const [filterView, setFilterView] = useState<"all" | "active" | "completed">("all");

    const { setCurrentChannel, refreshPolls } = usePollActions();
    const isLoading = usePollsLoading();
    const error = usePollsError();
    const activePolls = useActivePolls();
    const completedPolls = useCompletedPolls();
    const allPolls = usePolls();

    // Initial setup when channelId changes
    useEffect(() => {
        if (channelId) {
            setCurrentChannel(channelId);
            refreshPolls();
        }
    }, [channelId, setCurrentChannel, refreshPolls]);

    // Filter polls based on selected view
    const visiblePolls = filterView === "all"
        ? allPolls
        : filterView === "active"
            ? activePolls
            : completedPolls;

    // Filter active polls based on current view
    const filteredActivePolls = activePolls.filter(() =>
        filterView === "all" || filterView === "active",
    );

    // Filter completed polls based on current view
    const filteredCompletedPolls = completedPolls.filter(() =>
        filterView === "all" || filterView === "completed",
    );

    return (
        <Container fluid p={0}>
            <Box pt="md" pb="md" px="md">
                <PollsFilterBar
                    onCreatePoll={() => setCreatePollOpen(true)}
                    view={filterView}
                    onViewChange={view => setFilterView(view as "all" | "active" | "completed")}
                />
            </Box>

            {error && (
                <Alert
                    icon={<IconAlertCircle size={16} />}
                    title="Error"
                    color="red"
                    m="md"
                >
                    {error}
                </Alert>
            )}

            <ScrollArea
                h="calc(100vh - 130px)"
                scrollbarSize={6}
                type="always"
                offsetScrollbars
            >
                {isLoading && allPolls.length === 0
                    ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "50px 0" }}>
                                <Loader size="lg" />
                            </div>
                        )
                    : visiblePolls.length === 0
                        ? (
                                <div style={{ textAlign: "center", padding: "50px 0" }}>
                                    <Text size="lg" fw={500} c="dimmed">
                                        No
                                        {" "}
                                        {filterView === "all" ? "" : filterView}
                                        {" "}
                                        polls found
                                    </Text>
                                    {filterView === "active" && (
                                        <Text c="dimmed" mt="xs">
                                            Create a new poll to start collecting feedback
                                        </Text>
                                    )}
                                </div>
                            )
                        : (
                                <Stack gap="lg" p="md">
                                    {/* Active Polls Section */}
                                    {filterView !== "completed" && activePolls.length > 0 && (
                                        <div>
                                            <Stack gap="md">
                                                {filteredActivePolls.map(activePoll => (
                                                    <PollCard key={activePoll.id} poll={activePoll} />
                                                ))}
                                            </Stack>
                                        </div>
                                    )}

                                    {/* Completed Polls Section */}
                                    {filterView !== "active" && completedPolls.length > 0 && (
                                        <div>
                                            <Stack gap="lg">
                                                {filteredCompletedPolls.map(completedPoll => (
                                                    <Paper key={completedPoll.id} shadow="sm" p="lg" radius="md" withBorder>
                                                        <Text fw={600} size="lg" mb="md">
                                                            {completedPoll.title}
                                                        </Text>
                                                        {completedPoll.description && (
                                                            <Text size="sm" c="dimmed" mb="lg">
                                                                {completedPoll.description}
                                                            </Text>
                                                        )}
                                                        <PollResultsChart poll={completedPoll} />
                                                        <Text size="xs" c="dimmed" mt="md" ta="right">
                                                            {completedPoll.totalVotes}
                                                            {" "}
                                                            votes total •
                                                            {" "}
                                                            {completedPoll.type === "anonymous" ? "Anonymous voting" : "Public voting"}
                                                        </Text>
                                                    </Paper>
                                                ))}
                                            </Stack>
                                        </div>
                                    )}
                                </Stack>
                            )}
            </ScrollArea>

            <CreatePollForm
                opened={createPollOpen}
                onClose={() => setCreatePollOpen(false)}
            />
        </Container>
    );
}
