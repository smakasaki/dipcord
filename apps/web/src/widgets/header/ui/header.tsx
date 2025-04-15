import { Box, Burger, Button, Divider, Drawer, Group, ScrollArea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, useLocation } from "@tanstack/react-router";
import { DipcordLogo } from "#/shared/ui";

import classes from "./header.module.css";

export function Header() {
    const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
    const location = useLocation();

    // Define the navigation items to display
    const navItems = [
        { label: "Главная", path: "/" },
        { label: "О нас", path: "/about" },
        { label: "Контакты", path: "/contact" },
    ];

    // Create navigation links
    const links = navItems.map(item => (
        <Link
            key={item.label}
            to={item.path}
            className={`${classes.link} ${location.pathname === item.path ? classes.active : ""}`}
            onClick={() => closeDrawer()}
        >
            {item.label}
        </Link>
    ));

    return (
        <Box>
            <header className={classes.header}>
                <Group justify="space-between" h="100%">
                    {/* Logo */}
                    <Group gap="xs">
                        <DipcordLogo size={32} style={{ color: "#F06418" }} />
                        <Link to="/" className={classes.logo}>
                            Dipcord
                        </Link>
                    </Group>

                    {/* Desktop Navigation */}
                    <Group h="100%" gap={0} className={classes.desktopItems}>
                        {links}
                    </Group>

                    {/* Authentication Buttons (Desktop) */}
                    <Group className={classes.desktopItems}>
                        <Button variant="default" component={Link} to="/login">
                            Войти
                        </Button>
                        <Button component={Link} to="/register">
                            Регистрация
                        </Button>
                    </Group>

                    {/* Mobile burger menu */}
                    <Burger
                        opened={drawerOpened}
                        onClick={toggleDrawer}
                        className={classes.burger}
                        size="sm"
                    />
                </Group>
            </header>

            {/* Mobile drawer */}
            <Drawer
                opened={drawerOpened}
                onClose={closeDrawer}
                size="100%"
                padding="md"
                title="Dipcord"
                zIndex={1000000}
                className={classes.hiddenDesktop}
            >
                <ScrollArea h="calc(100vh - 80px)" mx="-md">
                    <Divider my="sm" />

                    {links}

                    <Divider my="sm" />

                    <Group justify="center" grow pb="xl" px="md">
                        <Button variant="default" component={Link} to="/login" onClick={closeDrawer}>
                            Войти
                        </Button>
                        <Button component={Link} to="/register" onClick={closeDrawer}>
                            Регистрация
                        </Button>
                    </Group>
                </ScrollArea>
            </Drawer>
        </Box>
    );
}
