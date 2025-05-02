import type { CreatePollData } from "#/entities/poll";

import {
    ActionIcon,
    Button,
    Checkbox,
    Divider,
    Group,
    Modal,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconCalendar, IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

import { usePollActions } from "../model/selectors";

type CreatePollFormProps = {
    opened: boolean;
    onClose: () => void;
};

export function CreatePollForm({ opened, onClose }: CreatePollFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { createPoll } = usePollActions();

    const form = useForm<{
        title: string;
        description: string;
        options: string[];
        type: "anonymous" | "public";
        expiresAt: Date | null;
        hasExpiry: boolean;
    }>({
        initialValues: {
            title: "",
            description: "",
            options: ["", ""],
            type: "anonymous",
            expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Default: 24h from now
            hasExpiry: true,
        },
        validate: {
            title: value => (!value.trim() ? "Title is required" : null),
            options: (value: string[]) => {
                // Validate overall array
                const validOptions = value.filter(o => o && o.trim().length > 0);
                if (validOptions.length < 2) {
                    return "At least two valid options are required";
                }

                // Validate individual options
                for (let i = 0; i < value.length; i++) {
                    if (value[i] && !value[i].trim()) {
                        return `Option ${i + 1} cannot be empty`;
                    }
                }

                return null;
            },
        },
    });

    const handleSubmit = async () => {
        const validation = form.validate();

        if (validation.hasErrors)
            return;

        setIsSubmitting(true);

        // Filter out empty options and prepare the data
        const validOptions = form.values.options.filter(o => o && o.trim().length > 0);

        const pollData: CreatePollData = {
            title: form.values.title,
            description: form.values.description,
            options: validOptions,
            type: form.values.type,
            expiresAt: form.values.hasExpiry ? form.values.expiresAt : null,
        };

        try {
            await createPoll(pollData);
            onClose();
            form.reset();
        }
        catch (error) {
            console.error("Failed to create poll:", error);
        }
        finally {
            setIsSubmitting(false);
        }
    };

    const addOption = () => {
        if (form.values.options.length < 20) {
            form.insertListItem("options", "");
        }
    };

    const removeOption = (index: number) => {
        if (form.values.options.length > 2) {
            form.removeListItem("options", index);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Create New Poll"
            size="lg"
            overlayProps={{ blur: 3 }}
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        label="Poll Title"
                        placeholder="Enter poll title"
                        required
                        {...form.getInputProps("title")}
                    />

                    <Textarea
                        label="Description"
                        placeholder="What is this poll about?"
                        minRows={2}
                        {...form.getInputProps("description")}
                    />

                    <Divider label="Poll Options" labelPosition="center" />

                    <Stack gap="xs">
                        {form.values.options.map((_, index) => (
                            <Group key={index} align="center" gap="xs">
                                <TextInput
                                    placeholder={`Option ${index + 1}`}
                                    style={{ flex: 1 }}
                                    {...form.getInputProps(`options.${index}`)}
                                />

                                <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    onClick={() => removeOption(index)}
                                    disabled={form.values.options.length <= 2}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Group>
                        ))}

                        <Button
                            leftSection={<IconPlus size={16} />}
                            variant="light"
                            onClick={addOption}
                            disabled={form.values.options.length >= 20}
                            size="xs"
                        >
                            Add Option
                        </Button>

                        <Text size="xs" c="dimmed">
                            {form.values.options.length}
                            /20 options
                        </Text>
                    </Stack>

                    <Divider label="Poll Settings" labelPosition="center" />

                    <Select
                        label="Voting Type"
                        data={[
                            { value: "anonymous", label: "Anonymous (voters are not visible)" },
                            { value: "public", label: "Public (voters are visible)" },
                        ]}
                        defaultValue="anonymous"
                        {...form.getInputProps("type")}
                    />

                    <Checkbox
                        label="Set expiry time"
                        checked={form.values.hasExpiry}
                        onChange={event => form.setFieldValue("hasExpiry", event.currentTarget.checked)}
                    />

                    {form.values.hasExpiry && (
                        <DateTimePicker
                            label="Expires At"
                            placeholder="Select date and time"
                            valueFormat="DD MMM YYYY hh:mm A"
                            minDate={new Date()}
                            leftSection={<IconCalendar size={16} />}
                            clearable={false}
                            {...form.getInputProps("expiresAt")}
                        />
                    )}

                    <Group justify="right" mt="md">
                        <Button variant="subtle" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            Create Poll
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
