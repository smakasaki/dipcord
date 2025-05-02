import type { Poll } from "#/entities/poll";

import {
    BarChart,
    PieChart,
    RadarChart,
} from "@mantine/charts";
import { Card, SegmentedControl, Text, useMantineTheme } from "@mantine/core";
import { useState } from "react";

type PollResultsChartProps = {
    poll: Poll;
};

export function PollResultsChart({ poll }: PollResultsChartProps) {
    const [chartType, setChartType] = useState<"bar" | "pie" | "radar">("bar");
    const theme = useMantineTheme();

    // Data for the charts
    const data = poll.options.map((option, index) => {
        // Calculate percentage
        const percentage = poll.totalVotes > 0
            ? Math.round((option.votes / poll.totalVotes) * 100)
            : 0;

        return {
            name: option.text,
            votes: option.votes,
            percentage,
            color: getChartColor(index, theme),
            product: option.text, // For radar chart
            sales: option.votes, // For radar chart
        };
    });

    // Generate colors for the chart
    function getChartColor(index: number, theme: any) {
        const colors = [
            theme.colors.blue[6],
            theme.colors.green[6],
            theme.colors.orange[6],
            theme.colors.grape[6],
            theme.colors.red[6],
            theme.colors.indigo[6],
            theme.colors.teal[6],
            theme.colors.pink[6],
        ];
        return colors[index % colors.length];
    }

    // Prepare series for radar chart
    const radarSeries = [
        { name: "votes", color: "blue.6", opacity: 0.2 },
    ];

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder mt="lg">
            <Text fw={500} size="lg" mb="md">
                Final Results:
                {" "}
                {poll.title}
            </Text>

            <SegmentedControl
                value={chartType}
                onChange={value => setChartType(value as "bar" | "pie" | "radar")}
                data={[
                    { label: "Bar Chart", value: "bar" },
                    { label: "Pie Chart", value: "pie" },
                    { label: "Radar Chart", value: "radar" },
                ]}
                mb="lg"
            />

            {chartType === "bar" && (
                <BarChart
                    h={400}
                    data={data}
                    dataKey="name"
                    series={[
                        { name: "votes", color: "blue.6" },
                    ]}
                    orientation="horizontal"
                    barProps={{
                        radius: 4,
                    }}
                    tooltipProps={{
                        content: ({ payload }) => {
                            if (payload && payload.length > 0 && payload[0]) {
                                const item = payload[0];
                                const percentage = item.payload?.percentage ?? 0;
                                return `${item.value} votes (${percentage}%)`;
                            }
                            return "";
                        },
                    }}
                    tickLine="none"
                    withLegend
                />
            )}

            {chartType === "pie" && (
                <PieChart
                    h={400}
                    data={data.map(item => ({
                        name: item.name,
                        value: item.votes,
                        color: item.color,
                        percentage: item.percentage,
                    }))}
                    tooltipProps={{
                        content: ({ payload }) => {
                            if (payload && payload.length > 0 && payload[0]?.payload) {
                                const item = payload[0].payload;
                                return `${item.name}: ${item.value} votes (${item.percentage}%)`;
                            }
                            return "";
                        },
                    }}
                    withLabels
                    labelsType="percent"
                    labelsPosition="outside"
                    withTooltip
                />
            )}

            {chartType === "radar" && (
                <RadarChart
                    h={400}
                    data={data}
                    dataKey="product"
                    withPolarGrid
                    withPolarAngleAxis
                    series={radarSeries}
                    withLegend
                />
            )}
        </Card>
    );
}
