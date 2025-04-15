import { Container, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
    component: AppIndexPage,
});

function AppIndexPage() {
    return (
        <Container>
            <Title order={2} mt="md">Welcome to Dipcord</Title>
            <Text mt="md">
                Select a channel from the navbar to start chatting, manage tasks, create polls, or join calls.
            </Text>
        </Container>
    );
}
