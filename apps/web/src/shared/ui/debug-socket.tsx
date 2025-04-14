import { Badge, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";

import { socketService } from "../api/socket";

export function SocketDebug() {
    const [status, setStatus] = useState("disconnected");
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [visible, setVisible] = useState(process.env.NODE_ENV === "development");

    useEffect(() => {
        const socket = socketService.connect();

        const handleConnect = () => {
            setStatus("connected");
            setError(null);
        };

        const handleDisconnect = (reason: string) => {
            setStatus(`disconnected: ${reason}`);
        };

        const handleConnectError = (err: Error) => {
            setStatus("error");
            setError(err.message);
            setAttempts(prev => prev + 1);
        };

        // Set up listeners
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);

        // Check initial status
        if (socket.connected) {
            setStatus("connected");
        }

        // Cleanup
        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
        };
    }, []);

    if (!visible)
        return null;

    return (
        <Paper
            p="sm"
            shadow="md"
            style={{
                position: "fixed",
                bottom: 10,
                right: 10,
                zIndex: 1000,
                maxWidth: 300,
            }}
        >
            <Stack spacing="xs">
                <Group position="apart">
                    <Title order={5}>WebSocket Status</Title>
                    <Button
                        compact
                        variant="subtle"
                        onClick={() => setVisible(false)}
                    >
                        Hide
                    </Button>
                </Group>

                <Group>
                    <Text>Status:</Text>
                    <Badge
                        color={status === "connected" ? "green" : status === "error" ? "red" : "orange"}
                    >
                        {status}
                    </Badge>
                </Group>

                {error && (
                    <Text size="sm" color="red">
                        Error:
                        {" "}
                        {error}
                    </Text>
                )}

                {attempts > 0 && (
                    <Text size="sm">
                        Connection attempts:
                        {" "}
                        {attempts}
                    </Text>
                )}

                <Group>
                    <Button
                        compact
                        onClick={() => {
                            socketService.disconnect();
                            socketService.connect();
                        }}
                    >
                        Reconnect
                    </Button>
                </Group>
            </Stack>
        </Paper>
    );
}
