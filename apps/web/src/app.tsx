import { Button, Card, Container, MantineProvider, Stack, Text } from "@mantine/core";
import { useState } from "react";
import "@mantine/core/styles.css";

import reactLogo from "./assets/react.svg";

import viteLogo from "/vite.svg";

import "./app.css";

function App() {
    const [count, setCount] = useState(0);

    return (
        <MantineProvider>
            <Container size="md">
                <div>
                    <a href="https://vite.dev" target="_blank">
                        <img src={viteLogo} className="logo" alt="Vite logo" />
                    </a>
                    <a href="https://react.dev" target="_blank">
                        <img src={reactLogo} className="logo react" alt="React logo" />
                    </a>
                </div>
                <h1>Vite + React + Mantine</h1>
                <Card shadow="sm" padding="lg" radius="md" withBorder mt="md">
                    <Stack align="center" gap="md">
                        <Button
                            variant="filled"
                            onClick={() => setCount(count => count + 1)}
                        >
                            count is
                            {" "}
                            {count}
                        </Button>
                        <Text>
                            Edit
                            {" "}
                            <code>src/App.tsx</code>
                            {" "}
                            and save to test HMR
                        </Text>
                    </Stack>
                </Card>
                <Text c="dimmed" ta="center" size="sm" mt="xl">
                    Click on the Vite and React logos to learn more
                </Text>
            </Container>
        </MantineProvider>
    );
}

export default App;
