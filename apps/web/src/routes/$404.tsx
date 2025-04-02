import { createFileRoute } from "@tanstack/react-router";
import { NotFoundTitle } from "#/widgets/not-found/ui";

export const Route = createFileRoute("/$404")({
    component: RouteComponent,
});

function RouteComponent() {
    return <NotFoundTitle />;
}
