import { createFileRoute } from "@tanstack/react-router";

import { NotFoundTitle } from "../components/notFoundTitle";

export const Route = createFileRoute("/$404")({
    component: RouteComponent,
});

function RouteComponent() {
    return <NotFoundTitle />;
}
