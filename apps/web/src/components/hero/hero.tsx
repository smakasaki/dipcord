import { Button, Container, Group, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import classes from "./hero.module.css";

export function Hero() {
    return (
        <div className={classes.wrapper}>
            <Container size={900} className={classes.inner}>
                <h1 className={classes.title}>
                    <Text component="span" variant="gradient" gradient={{ from: "blue", to: "cyan" }} inherit>
                        Объединяйте команду
                    </Text>
                    {" "}
                    и упрощайте коммуникацию вместе с Dipcord
                </h1>

                <Text className={classes.description} color="dimmed">
                    Современная платформа для видеоконференций, управления задачами и совместной работы.
                    Всё необходимое для продуктивной работы вашей команды в одном безопасном пространстве.
                </Text>

                <Group className={classes.controls}>
                    <Button
                        size="xl"
                        className={classes.control}
                        variant="gradient"
                        gradient={{ from: "blue", to: "cyan" }}
                        component={Link}
                        to="/register"
                    >
                        Начать бесплатно
                    </Button>

                    <Button
                        component={Link}
                        to="/about"
                        size="xl"
                        variant="default"
                        className={classes.control}
                    >
                        Узнать больше
                    </Button>
                </Group>
            </Container>
        </div>
    );
}
