import type { CallJoinModalRef } from "#/features/channel-calls";

import { Button, Container, Group, Loader, ScrollArea, Stack, Text, Title } from "@mantine/core";
import { IconHistory, IconPhoneCall } from "@tabler/icons-react";
import { useParams } from "@tanstack/react-router";
import { ActiveCallCard, CallHistoryItem, CallJoinModal, StartCallCard, useActiveCall, useCallActions, useCalls, useCallsLoading } from "#/features/channel-calls";
import { useEffect, useRef } from "react";

export function ChannelCallsPage() {
    const { channelId } = useParams({ from: "/app/$channelId/calls" });
    const calls = useCalls();
    const activeCall = useActiveCall();
    const isLoading = useCallsLoading();
    const { refreshCalls, startCall, endCall, joinCall, setCurrentChannel } = useCallActions();
    const callModalRef = useRef<CallJoinModalRef>(null);

    // Set channel and load calls on mount
    useEffect(() => {
        if (channelId) {
            setCurrentChannel(channelId);
            refreshCalls();
        }
    }, [channelId, setCurrentChannel, refreshCalls]);

    // Handle starting a new call
    const handleStartCall = async (data: { title: string; type: "audio" | "video" }) => {
        if (!channelId)
            return;

        const call = await startCall(channelId, data.type);
        if (call) {
            callModalRef.current?.openCall(call);
        }
    };

    // Handle joining a call
    const handleJoinCall = async () => {
        if (!activeCall)
            return;

        await joinCall(activeCall.id);
        callModalRef.current?.openCall(activeCall);
    };

    // Handle ending a call
    const handleEndCall = async () => {
        if (!activeCall)
            return;

        await endCall(activeCall.id);
        callModalRef.current?.closeCall();
    };

    // Handle closing the call modal
    const handleCloseCallModal = () => {
        refreshCalls();
    };

    return (
        <Container fluid style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }} py="md">
            <Group justify="apart" mb="lg" style={{ display: "none" }}>
                <Button
                    leftSection={<IconPhoneCall size={16} />}
                    color="green"
                    onClick={() => callModalRef.current?.openCall(activeCall!)}
                >
                    Debug Join
                </Button>
            </Group>

            {isLoading && !activeCall && calls.length === 0
                ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "50px 0" }}>
                            <Loader size="lg" />
                        </div>
                    )
                : (
                        <Stack gap="xl" pt="md" pb="lg" style={{ flex: 1, overflow: "hidden" }}>
                            {/* Active call section */}
                            {activeCall
                                ? (
                                        <ActiveCallCard
                                            call={activeCall}
                                            onJoin={handleJoinCall}
                                            onEnd={handleEndCall}
                                        />
                                    )
                                : (
                                        <StartCallCard onStartCall={handleStartCall} />
                                    )}

                            {/* Call history section */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <Group mb="md">
                                    <IconHistory size={20} />
                                    <Title order={3}>Recent Calls</Title>
                                </Group>

                                <ScrollArea style={{ flex: 1 }} offsetScrollbars scrollbarSize={5} pr="md">
                                    {calls.length === 0
                                        ? (
                                                <Text color="dimmed" ta="center" py="xl">
                                                    No previous calls in this channel
                                                </Text>
                                            )
                                        : (
                                                <Stack gap="md" pb="md">
                                                    {calls.map(call => (
                                                        <CallHistoryItem
                                                            key={call.id}
                                                            call={call}
                                                        />
                                                    ))}
                                                </Stack>
                                            )}
                                </ScrollArea>
                            </div>
                        </Stack>
                    )}

            {/* Call join modal */}
            <CallJoinModal
                ref={callModalRef}
                onClose={handleCloseCallModal}
            />
        </Container>
    );
}
