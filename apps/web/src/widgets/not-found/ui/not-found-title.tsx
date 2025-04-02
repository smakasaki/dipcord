import { Button, Container, Group, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import classes from "./not-found-title.module.css";

export function NotFoundTitle() {
    return (
        <Container className={classes.root}>
            <div className={classes.label}>404</div>
            <Title className={classes.title}>Вы обнаружили секретное место!</Title>
            <Text c="dimmed" size="lg" ta="center" className={classes.description}>
                К сожалению, это всего лишь страница 404. Возможно, вы ошиблись при вводе адреса,
                или страница переехала по другому URL. Нам очень жаль, но здесь ничего нет.
            </Text>
            <Group justify="center">
                <Button
                    variant="subtle"
                    size="md"
                    component={Link}
                    to="/"
                >
                    Вернуться на главную страницу
                </Button>
            </Group>
        </Container>
    );
}
