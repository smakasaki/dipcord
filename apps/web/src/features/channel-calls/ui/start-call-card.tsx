import { Button, Card, Group, Radio, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconPhone, IconVideo } from "@tabler/icons-react";

type StartCallFormValues = {
    title: string;
    type: "audio" | "video";
};

type StartCallCardProps = {
    onStartCall: (data: StartCallFormValues) => void;
};

export function StartCallCard({ onStartCall }: StartCallCardProps) {
    const form = useForm<StartCallFormValues>({
        initialValues: {
            title: "",
            type: "video",
        },
        validate: {
            title: value => (value.length < 1 ? "Title is required" : null),
        },
    });

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
            <Text fw={700} size="lg" mb="md">Start a New Call</Text>

            <form onSubmit={form.onSubmit(onStartCall)}>
                <Stack>
                    <TextInput
                        label="Call Title"
                        placeholder="Team discussion"
                        {...form.getInputProps("title")}
                        required
                    />

                    <Radio.Group
                        label="Call Type"
                        {...form.getInputProps("type")}
                    >
                        <Group mt="xs">
                            <Radio
                                value="video"
                                label={(
                                    <Group gap="xs">
                                        <IconVideo size={16} />
                                        <Text>Video Call</Text>
                                    </Group>
                                )}
                            />
                            <Radio
                                value="audio"
                                label={(
                                    <Group gap="xs">
                                        <IconPhone size={16} />
                                        <Text>Audio Call</Text>
                                    </Group>
                                )}
                            />
                        </Group>
                    </Radio.Group>

                    <Group justify="right" mt="md">
                        <Button
                            type="submit"
                            leftSection={
                                form.values.type === "video"
                                    ? <IconVideo size={16} />
                                    : <IconPhone size={16} />
                            }
                            color={form.values.type === "video" ? "blue" : "green"}
                        >
                            Start Call
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Card>
    );
}
