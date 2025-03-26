import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    return (
        <Container size="md" mt="xl">
            <Stack align="center" gap="md">
                <Title order={1}>Welcome to Dipcord</Title>
                <Text size="lg">
                    A platform for team communication and collaboration
                </Text>
                <Button size="lg" variant="filled" color="blue">
                    Get Started
                </Button>
            </Stack>
        </Container>
    );
}
