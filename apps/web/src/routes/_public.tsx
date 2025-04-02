import { createFileRoute } from "@tanstack/react-router";
import PublicLayout from "#/shared/ui/layouts/public-layout.tsx";

export const Route = createFileRoute("/_public")({
    component: PublicLayout,
});
