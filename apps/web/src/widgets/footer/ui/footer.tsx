import { Anchor, Container, Group, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { DipcordLogo } from "#/shared/ui/logos";

import classes from "./footer.module.css";

const links = [
    { link: "/about", label: "О нас" },
    { link: "/contact", label: "Контакты" },
    { link: "/privacy", label: "Политика конфиденциальности" },
    { link: "/terms", label: "Условия использования" },
];

export function Footer() {
    const items = links.map(link => (
        <Anchor
            component={Link}
            to={link.link}
            c="dimmed"
            key={link.label}
            size="sm"
        >
            {link.label}
        </Anchor>
    ));

    return (
        <div className={classes.footer}>
            <Container className={classes.inner}>
                <Group gap="xs">
                    <DipcordLogo size={24} style={{ color: "#F06418" }} />
                    <Link to="/" className={classes.logo}>
                        Dipcord
                    </Link>
                </Group>
                <Group className={classes.links}>{items}</Group>
            </Container>
            <Container>
                <Text className={classes.copyright}>
                    © 2025 Dipcord. Все права защищены.
                </Text>
            </Container>
        </div>
    );
}
