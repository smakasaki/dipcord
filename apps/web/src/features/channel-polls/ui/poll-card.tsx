import type { Poll, PollOption } from "#/entities/poll";

import {
    Badge,
    Button,
    Card,
    Divider,
    Group,
    Progress,
    Radio,
    Stack,
    Text,
    useMantineTheme,
} from "@mantine/core";
import { IconCheck, IconClock, IconUser } from "@tabler/icons-react";
import { useAuthStore } from "#/features/auth";
import { useEffect, useState } from "react";

import { canEndPoll, getPollTimeRemaining, isPollExpired, usePollActions } from "../model/selectors";

type PollCardProps = {
    poll: Poll;
};

export function PollCard({ poll }: PollCardProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(poll.userVote || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { votePoll, endPoll } = usePollActions();
    const currentUser = useAuthStore(state => state.user);
    const userId = currentUser?.id || "unknown";
    const userRoles = currentUser?.roles || [];

    // Get creator name
    const creatorName = poll.createdByUserId === "current-user"
        ? "You"
        : poll.createdByUserId === "user-1"
            ? "Maria Kim"
            : poll.createdByUserId === "user-2"
                ? "Alex Smith"
                : poll.createdByUserId === "user-3"
                    ? "John Doe"
                    : "Unknown User";

    const isActive = poll.status === "active";
    const isExpired = isPollExpired(poll);
    const shouldEnd = isActive && isExpired;
    const timeRemaining = getPollTimeRemaining(poll);
    const hasVoted = poll.userVote !== undefined;
    const userCanEndPoll = canEndPoll(poll, userId, userRoles);

    // Check if poll should be ended due to expiry
    useEffect(() => {
        if (shouldEnd) {
            endPoll(poll.id);
        }
    }, [shouldEnd, endPoll, poll.id]);

    // Handle vote submission
    const handleSubmitVote = async () => {
        if (!selectedOption || hasVoted || !isActive)
            return;

        setIsSubmitting(true);

        try {
            await votePoll({
                pollId: poll.id,
                optionId: selectedOption,
            });
        }
        catch (error) {
            console.error("Failed to vote:", error);
        }
        finally {
            setIsSubmitting(false);
        }
    };

    // Handle ending the poll manually
    const handleEndPoll = async () => {
        if (!userCanEndPoll || !isActive)
            return;

        setIsSubmitting(true);

        try {
            await endPoll(poll.id);
        }
        catch (error) {
            console.error("Failed to end poll:", error);
        }
        finally {
            setIsSubmitting(false);
        }
    };

    // Calculate max votes for scaling the progress bars
    const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
            <Group justify="space-between" mb="xs">
                <Text fw={500} size="lg">
                    {poll.title}
                </Text>
                <Group gap="xs">
                    <Badge
                        color={isActive ? (isExpired ? "yellow" : "green") : "gray"}
                        variant="filled"
                    >
                        {isActive
                            ? (isExpired ? "Expiring" : "Active")
                            : "Completed"}
                    </Badge>
                    {poll.expiresAt && (
                        <Badge
                            color="blue"
                            variant="outline"
                            leftSection={<IconClock size={14} />}
                        >
                            {timeRemaining}
                        </Badge>
                    )}
                </Group>
            </Group>

            <Text size="sm" c="dimmed" mb="md">
                {poll.description}
            </Text>

            <Divider mb="md" />

            <Text fw={500} mb="sm">
                {hasVoted || !isActive
                    ? "Results"
                    : "Options"}
                {poll.totalVotes > 0 && ` (${poll.totalVotes} votes)`}
            </Text>

            <Stack gap="sm">
                {poll.options.map((option: PollOption) => (
                    <div key={option.id}>
                        {(hasVoted || !isActive)
                            ? (
                                    <ResultOption
                                        option={option}
                                        poll={poll}
                                        maxVotes={maxVotes}
                                        selectedByUser={option.id === poll.userVote}
                                    />
                                )
                            : (
                                    <Radio
                                        value={option.id}
                                        label={option.text}
                                        checked={selectedOption === option.id}
                                        onChange={() => setSelectedOption(option.id)}
                                        mb="xs"
                                    />
                                )}
                    </div>
                ))}
            </Stack>

            {isActive && !hasVoted && (
                <Button
                    fullWidth
                    mt="md"
                    disabled={!selectedOption || isSubmitting}
                    loading={isSubmitting}
                    onClick={handleSubmitVote}
                >
                    Submit Vote
                </Button>
            )}

            {isActive && userCanEndPoll && (
                <Button
                    variant="outline"
                    color="red"
                    fullWidth
                    mt="xs"
                    disabled={isSubmitting}
                    onClick={handleEndPoll}
                >
                    End Poll
                </Button>
            )}

            <Group justify="space-between" mt="lg">
                <Group gap="xs">
                    <IconUser size={16} />
                    <Text size="sm" c="dimmed">
                        Created by
                        {" "}
                        {creatorName}
                    </Text>
                </Group>

                <Text size="sm" c="dimmed">
                    {poll.type === "anonymous" ? "Anonymous voting" : "Public voting"}
                </Text>
            </Group>
        </Card>
    );
}

type ResultOptionProps = {
    option: PollOption;
    poll: Poll;
    maxVotes: number;
    selectedByUser: boolean;
};

function ResultOption({ option, poll, selectedByUser }: ResultOptionProps) {
    const theme = useMantineTheme();

    const percentage = poll.totalVotes > 0
        ? Math.round((option.votes / poll.totalVotes) * 100)
        : 0;

    // Generate different colors for each option
    const getColor = (index: number) => {
        const colors = [
            theme.colors.blue[6],
            theme.colors.green[6],
            theme.colors.orange[6],
            theme.colors.grape[6],
            theme.colors.red[6],
            theme.colors.indigo[6],
            theme.colors.teal[6],
            theme.colors.pink[6],
        ];
        return colors[index % colors.length];
    };

    const optionIndex = poll.options.findIndex(o => o.id === option.id);
    const color = getColor(optionIndex);

    return (
        <div style={{ marginBottom: "12px" }}>
            <Group justify="space-between" mb={4}>
                <Group gap="xs">
                    {selectedByUser && <IconCheck size={16} color={theme.colors.green[6]} />}
                    <Text size="sm" fw={selectedByUser ? 500 : 400}>
                        {option.text}
                    </Text>
                </Group>
                <Text size="sm" fw={500}>
                    {option.votes}
                    {" "}
                    {option.votes === 1 ? "vote" : "votes"}
                    {" "}
                    (
                    {percentage}
                    %)
                </Text>
            </Group>

            <Progress
                value={percentage}
                color={color}
                size="md"
                radius="sm"
                striped={selectedByUser}
            />
        </div>
    );
}
