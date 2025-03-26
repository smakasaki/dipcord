import { MantineProvider } from "@mantine/core";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
// Import Mantine styles
import "@mantine/core/styles.css";

export const Route = createRootRoute({
    component: () => (
        <MantineProvider>
            <div className="app-container">
                <header>
                    <nav className="main-nav">
                        <Link to="/" className="nav-link">
                            Home
                        </Link>
                        <Link to="/channels" className="nav-link">
                            Channels
                        </Link>
                        <Link to="/profile" className="nav-link">
                            Profile
                        </Link>
                    </nav>
                </header>

                <main className="main-content">
                    <Outlet />
                </main>

                {// eslint-disable-next-line node/no-process-env
                    process.env.NODE_ENV !== "production" && <TanStackRouterDevtools />
                }
            </div>
        </MantineProvider>
    ),
});
