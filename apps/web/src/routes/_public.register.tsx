import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/register")({
    component: RouteComponent,
});

function RouteComponent() {
    return <div>Hello "/_public/register"!</div>;
}
