import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "#/shared/ui";

export const Route = createFileRoute("/_public")({
    component: PublicLayout,
});
