import type { Poll } from "#/entities/poll";

import {
    BarChart,
    DonutChart,
    PieChart,
} from "@mantine/charts";
import { Group, SegmentedControl, Text, useMantineTheme } from "@mantine/core";
import { useState } from "react";

type PollResultsChartProps = {
    poll: Poll;
};

export function PollResultsChart({ poll }: PollResultsChartProps) {
    const [chartType, setChartType] = useState<"bar" | "pie" | "donut">("bar");
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
        };
    });

    // Get winners (options with the most votes)
    const maxVotes = Math.max(...data.map(d => d.votes), 0);
    const winners = data.filter(d => d.votes === maxVotes && d.votes > 0);

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

    return (
        <>
            <Group justify="space-between" align="center" mb="xs">
                <Text fw={500} size="sm">
                    Results (
                    {poll.totalVotes}
                    {" "}
                    votes)
                </Text>
                <SegmentedControl
                    value={chartType}
                    onChange={value => setChartType(value as "bar" | "pie" | "donut")}
                    data={[
                        { label: "Bar", value: "bar" },
                        { label: "Pie", value: "pie" },
                        { label: "Donut", value: "donut" },
                    ]}
                    size="xs"
                />
            </Group>

            {chartType === "bar" && (
                <BarChart
                    h={320}
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
                    withLegend={false}
                />
            )}

            {chartType === "pie" && (
                <PieChart
                    h={320}
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

            {chartType === "donut" && (
                <DonutChart
                    h={320}
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
                    withTooltip
                    thickness={40}
                />
            )}

            {winners.length > 0 && (
                <Text size="sm" mt="md" fw={500}>
                    Winner
                    {winners.length > 1 ? "s" : ""}
                    :
                    {" "}
                    {winners.map(w => w.name).join(", ")}
                    {" "}
                    (
                    {maxVotes}
                    {" "}
                    votes)
                </Text>
            )}
        </>
    );
}
