import { Container, Title } from "@mantine/core";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$channelId")({
    component: ChannelPage,
    beforeLoad: ({ params, location }) => {
    // Если запрошен базовый маршрут канала без указания таба (chat, tasks и т.д.),
    // делаем редирект на таб с чатом
        if (location.pathname === `/app/${params.channelId}`) {
            throw redirect({
                to: "/app/$channelId/chat",
                params: { channelId: params.channelId },
            });
        }
    },
});

const channelsMockdata = [
    { id: "1", name: "General", color: "brand-orange" },
    { id: "2", name: "Marketing", color: "brand-orange" },
    { id: "3", name: "Development", color: "brand-orange" },
    { id: "4", name: "Design", color: "brand-orange" },
    { id: "5", name: "Sales", color: "brand-orange" },
    { id: "6", name: "Support", color: "brand-orange" },
    { id: "7", name: "HR", color: "brand-orange" },
    { id: "8", name: "Finance", color: "brand-orange" },
    { id: "9", name: "Research", color: "brand-orange" },
    { id: "10", name: "Operations", color: "brand-orange" },
];

function ChannelPage() {
    const { channelId } = Route.useParams();
    const channel = channelsMockdata.find(c => c.id === channelId);

    if (!channel) {
        return <Container><Title order={3}>Channel not found</Title></Container>;
    }

    return (
        <Container fluid>
            <Outlet />
        </Container>
    );
}
