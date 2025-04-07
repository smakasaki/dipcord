import { Avatar, ScrollArea, Title, Tooltip, UnstyledButton } from "@mantine/core";
import {
    IconChartBar,
    IconListCheck,
    IconLogout,
    IconMessages,
    IconPhoneCall,
    IconSettings,
    IconUserCircle,
} from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { DipcordLogo } from "../logos";
import classes from "./channel-navbar.module.css";

type Channel = {
    id: string;
    name: string;
    color: string;
};

type SystemLink = {
    id: string;
    icon: React.FC<any>;
    label: string;
    path: string;
};

type TabLink = {
    id: string;
    icon: React.FC<any>;
    label: string;
};

// Channel data (replace with actual data)
const channelsMockdata: Channel[] = [
    { id: "1", name: "General", color: "brand-orange" },
    { id: "2", name: "Marketing", color: "blue" },
    { id: "3", name: "Development", color: "green" },
    { id: "4", name: "Design", color: "violet" },
    { id: "5", name: "Sales", color: "yellow" },
    { id: "6", name: "Support", color: "teal" },
    { id: "7", name: "HR", color: "pink" },
    { id: "8", name: "Finance", color: "indigo" },
    { id: "9", name: "Research", color: "cyan" },
    { id: "10", name: "Operations", color: "grape" },
];

// Default channel id
const DEFAULT_CHANNEL_ID = "1";

// System links at the bottom of the first column
const systemLinksMockdata: SystemLink[] = [
    { id: "settings", icon: IconSettings, label: "Settings", path: "/app/settings" },
    { id: "profile", icon: IconUserCircle, label: "Profile", path: "/app/profile" },
    { id: "logout", icon: IconLogout, label: "Logout", path: "/logout" },
];

// Default channel tabs for messaging channels
const channelTabsMockdata: TabLink[] = [
    { id: "chat", icon: IconMessages, label: "Чат" },
    { id: "tasks", icon: IconListCheck, label: "Задачи" },
    { id: "polls", icon: IconChartBar, label: "Опросы" },
    { id: "calls", icon: IconPhoneCall, label: "Звонки" },
];

// Settings tabs
const settingsTabsMockdata = [
    "Account",
    "Privacy",
    "Notifications",
    "Interface",
    "Advanced",
    "About",
];

export function ChannelNavbar() {
    const navigate = useNavigate();

    const [activeChannel, setActiveChannel] = useState(DEFAULT_CHANNEL_ID);
    const [activeSystemLink, setActiveSystemLink] = useState("");
    const [activeTab, setActiveTab] = useState("chat");

    // Render channel avatars for the first column
    const channelLinks = channelsMockdata.map(channel => (
        <Tooltip
            label={channel.name}
            position="right"
            withArrow
            transitionProps={{ duration: 0 }}
            key={channel.id}
        >
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                <UnstyledButton
                    onClick={() => {
                        setActiveChannel(channel.id);
                        setActiveSystemLink("");
                        setActiveTab("chat");
                        navigate({
                            to: "/app/$channelId/chat",
                            params: { channelId: channel.id },
                        });
                    }}
                    className={classes.mainLink}
                    data-active={channel.id === activeChannel && !activeSystemLink ? true : undefined}
                >
                    <Avatar
                        color={channel.color}
                        radius="xl"
                        size="sm"
                    >
                        {channel.name.substring(0, 2)}
                    </Avatar>
                </UnstyledButton>
            </div>
        </Tooltip>
    ));

    // Render system links for the first column
    const systemLinks = systemLinksMockdata.map(link => (
        <Tooltip
            label={link.label}
            position="right"
            withArrow
            transitionProps={{ duration: 0 }}
            key={link.id}
        >
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                <UnstyledButton
                    onClick={() => {
                        setActiveSystemLink(link.id);
                        setActiveChannel("");
                        setActiveTab(link.id);
                        navigate({ to: link.path });
                    }}
                    className={classes.mainLink}
                    data-active={link.id === activeSystemLink ? true : undefined}
                >
                    <link.icon size={22} stroke={1.5} />
                </UnstyledButton>
            </div>
        </Tooltip>
    ));

    // Determine which tabs to show based on active selection
    let tabs: React.ReactNode[] = [];
    let title = "";

    if (activeChannel) {
    // Show channel tabs and use the channel name as title
        const activeChannelData = channelsMockdata.find(c => c.id === activeChannel);
        title = activeChannelData?.name || "";

        tabs = channelTabsMockdata.map(tab => (
            <a
                className={classes.link}
                data-active={activeTab === tab.id ? true : undefined}
                href="#"
                onClick={(event) => {
                    event.preventDefault();
                    setActiveTab(tab.id);

                    // Navigate to the appropriate tab
                    if (tab.id === "chat") {
                        navigate({
                            to: "/app/$channelId/chat",
                            params: { channelId: activeChannel },
                        });
                    }
                    else if (tab.id === "tasks") {
                        navigate({
                            to: "/app/$channelId/tasks",
                            params: { channelId: activeChannel },
                        });
                    }
                    else if (tab.id === "polls") {
                        navigate({
                            to: "/app/$channelId/polls",
                            params: { channelId: activeChannel },
                        });
                    }
                    else if (tab.id === "calls") {
                        navigate({
                            to: "/app/$channelId/calls",
                            params: { channelId: activeChannel },
                        });
                    }
                }}
                key={tab.id}
            >
                <tab.icon size={18} style={{ marginRight: 10 }} />
                {tab.label}
            </a>
        ));
    }
    else if (activeSystemLink) {
    // Show system tabs and use the system link name as title
        const activeSystemLinkData = systemLinksMockdata.find(l => l.id === activeSystemLink);
        title = activeSystemLinkData?.label || "";

        if (activeSystemLink === "settings") {
            tabs = settingsTabsMockdata.map(tab => (
                <a
                    className={classes.link}
                    data-active={activeTab === tab ? true : undefined}
                    href="#"
                    onClick={(event) => {
                        event.preventDefault();
                        setActiveTab(tab);
                    }}
                    key={tab}
                >
                    {tab}
                </a>
            ));
        }
    }

    return (
        <nav className={classes.navbar}>
            <div className={classes.wrapper}>
                <div className={classes.aside}>
                    <div className={classes.logo} style={{ display: "flex", justifyContent: "center" }}>
                        <Avatar
                            radius="xl"
                            size="md"
                            color="gray"
                            onClick={() => navigate({ to: "/app" })}
                            style={{ cursor: "pointer" }}
                        >
                            <DipcordLogo />
                        </Avatar>
                    </div>

                    {/* Scrollable channel list */}
                    <ScrollArea className={classes.channelScroll}>
                        {channelLinks}
                    </ScrollArea>

                    {/* System links at the bottom */}
                    <div className={classes.systemLinks}>
                        {systemLinks}
                    </div>
                </div>

                <div className={classes.main}>
                    <Title order={4} className={classes.title}>
                        {title}
                    </Title>

                    <div className={classes.links}>
                        {tabs}
                    </div>
                </div>
            </div>
        </nav>
    );
}
