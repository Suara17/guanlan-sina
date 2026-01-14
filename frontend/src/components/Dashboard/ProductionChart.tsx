import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface ProductionChartProps {
  data?: any[]
}

export function ProductionChart({ data = [] }: ProductionChartProps) {
  // Use provided data or fallback to empty array
  // If data is provided but empty, the chart will be empty which is correct

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{ borderRadius: "8px" }}
        />
        <Bar
          dataKey="actual"
          fill="#adfa1d"
          radius={[4, 4, 0, 0]}
          name="Actual Output"
        />
        <Bar
          dataKey="target"
          fill="#2563eb"
          radius={[4, 4, 0, 0]}
          name="Target Output"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
