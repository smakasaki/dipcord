import { createFileRoute } from "@tanstack/react-router";
import { FeaturesCards } from "#/features/landing/ui";
import { Hero } from "#/features/landing/ui/hero";

export const Route = createFileRoute("/_public/")({
    component: Index,
});

function Index() {
    return (
        <>
            <Hero />
            <FeaturesCards />
        </>
    );
}
