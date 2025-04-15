import type { Channel } from "#/entities/channel";

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
import { useChannels, useChannelsLoading, useFetchUserChannels } from "#/features/channels";
import { DipcordLogo } from "#/shared/ui/logos";
import { useEffect, useState } from "react";

import classes from "./channel-navbar.module.css";

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
    const channels = useChannels();
    const isChannelsLoading = useChannelsLoading();
    const { getUserChannels } = useFetchUserChannels();

    const [activeChannel, setActiveChannel] = useState("");
    const [activeSystemLink, setActiveSystemLink] = useState("");
    const [activeTab, setActiveTab] = useState("chat");

    useEffect(() => {
        getUserChannels();
    }, [getUserChannels]);

    useEffect(() => {
        if (channels.length > 0 && !activeChannel) {
            setActiveChannel(channels[0]?.id || "");
        }
    }, [channels, activeChannel]);

    // Render channel avatars for the first column
    const channelLinks = channels.map((channel: Channel) => (
        <Tooltip
            label={channel.name || ""}
            position="right"
            withArrow
            transitionProps={{ duration: 0 }}
            key={channel.id}
        >
            <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: 8 }}>
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
                        color={getChannelColor(channel.id)}
                        radius="xl"
                        size="sm"
                    >
                        {(channel.name || "").substring(0, 2)}
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
        const activeChannelData = channels.find(c => c.id === activeChannel);
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

                    {/* Updated ScrollArea with proper configuration */}
                    <ScrollArea
                        className={classes.channelScroll}
                        scrollbarSize={5}
                        type="hover"
                        offsetScrollbars
                    >
                        <div className={classes.links}>
                            {isChannelsLoading
                                ? (
                                        <div style={{ textAlign: "center", padding: "10px" }}>Loading...</div>
                                    )
                                : channelLinks}
                        </div>
                    </ScrollArea>

                    <div style={{ padding: "0 6px" }}>
                        <div className={classes.footer}>
                            {systemLinks}
                        </div>
                    </div>
                </div>

                <div className={classes.main}>
                    <Title order={4} fw={500} style={{ marginLeft: 16, marginBottom: 16 }}>
                        {title}
                    </Title>

                    {tabs.length > 0 && (
                        <div className={classes.links}>
                            {tabs}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

// Helper function to generate consistent colors for channels based on ID
function getChannelColor(channelId: string): string {
    const colors = ["brand-orange", "blue", "green", "violet", "yellow", "teal", "pink", "indigo", "cyan", "grape"];
    const hashCode = channelId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hashCode % colors.length] || "gray";
}
