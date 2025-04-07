import { Container, Group, Select, Stack, Switch, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/settings")({
    component: SettingsPage,
});

function SettingsPage() {
    return (
        <Container>
            <Title order={2} mb="xl">Settings</Title>

            <Stack gap="xl">
                <div>
                    <Title order={4} mb="md">Interface</Title>
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Text>Dark mode</Text>
                            <Switch />
                        </Group>
                        <Group justify="space-between">
                            <Text>Compact view</Text>
                            <Switch />
                        </Group>
                        <Group justify="space-between">
                            <Text>Show online status</Text>
                            <Switch defaultChecked />
                        </Group>
                    </Stack>
                </div>

                <div>
                    <Title order={4} mb="md">Notifications</Title>
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Text>Enable notifications</Text>
                            <Switch defaultChecked />
                        </Group>
                        <Group justify="space-between">
                            <Text>Sound alerts</Text>
                            <Switch defaultChecked />
                        </Group>
                        <Group justify="space-between">
                            <Text>Do not disturb</Text>
                            <Switch />
                        </Group>
                    </Stack>
                </div>

                <div>
                    <Title order={4} mb="md">Privacy</Title>
                    <Stack gap="md">
                        <Select
                            label="Who can message you"
                            data={["Everyone", "Friends only", "Nobody"]}
                            defaultValue="Everyone"
                        />
                        <Select
                            label="Who can see your online status"
                            data={["Everyone", "Friends only", "Nobody"]}
                            defaultValue="Everyone"
                        />
                    </Stack>
                </div>
            </Stack>
        </Container>
    );
}
