import {
    Badge,
    Card,
    Container,
    Group,
    SimpleGrid,
    Text,
    Title,
    useMantineTheme,
} from "@mantine/core";
import { IconDeviceDesktop, IconLock, IconVideo } from "@tabler/icons-react";

import classes from "./features-cards.module.css";

const features = [
    {
        title: "Безопасные видеоконференции",
        description:
        "Проводите конференции с высоким качеством видео и звука. Шифрование данных обеспечивает конфиденциальность ваших обсуждений, а встроенные инструменты совместной работы делают встречи продуктивными.",
        icon: IconVideo,
    },
    {
        title: "Контроль данных",
        description:
        "Полный контроль над вашими данными благодаря возможности развертывания на собственных серверах. Никаких утечек информации и соответствие всем требованиям законодательства о защите персональных данных.",
        icon: IconLock,
    },
    {
        title: "Работа на любых устройствах",
        description:
        "Доступ к платформе с любого устройства без установки дополнительного ПО. Работайте с компьютера, планшета или смартфона — все функции доступны через браузер.",
        icon: IconDeviceDesktop,
    },
];

export function FeaturesCards() {
    const theme = useMantineTheme();

    const featureCards = features.map(feature => (
        <Card key={feature.title} shadow="md" radius="md" className={classes.card} padding="xl">
            <feature.icon size={50} stroke={2} color={theme.colors["brand-orange"]?.[6]} />
            <Text fz="lg" fw={500} className={classes.cardTitle} mt="md">
                {feature.title}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
                {feature.description}
            </Text>
        </Card>
    ));

    return (
        <Container size="lg" py="xl">
            <Group justify="center">
                <Badge variant="filled" size="lg" color="brand-orange">
                    Преимущества Dipcord
                </Badge>
            </Group>

            <Title order={2} className={classes.title} ta="center" mt="sm">
                Современное решение для коммуникации команд
            </Title>

            <Text c="dimmed" className={classes.description} ta="center" mt="md">
                Dipcord объединяет всё необходимое для эффективной работы вашей команды в одной защищённой платформе.
                Забудьте о необходимости использовать разрозненные сервисы для разных задач.
            </Text>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" mt={50}>
                {featureCards}
            </SimpleGrid>
        </Container>
    );
}
