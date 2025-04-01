import { createFileRoute } from "@tanstack/react-router";

import { FeaturesCards } from "../components/features-cards";
import { Hero } from "../components/hero";

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
