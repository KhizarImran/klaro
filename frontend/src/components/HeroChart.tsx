import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "Jan", value: 186 },
  { month: "Feb", value: 205 },
  { month: "Mar", value: 237 },
  { month: "Apr", value: 273 },
  { month: "May", value: 209 },
  { month: "Jun", value: 314 },
  { month: "Jul", value: 285 },
  { month: "Aug", value: 342 },
  { month: "Sep", value: 378 },
  { month: "Oct", value: 425 },
  { month: "Nov", value: 462 },
  { month: "Dec", value: 490 },
]

const chartConfig = {
  value: {
    label: "Portfolio Value",
    color: "hsl(160, 84%, 39%)", // Emerald green
  },
} satisfies ChartConfig

export function HeroChart() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ChartContainer config={chartConfig} className="h-[400px] w-full">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
            top: 12,
            bottom: 12,
          }}
        >
          <CartesianGrid
            vertical={false}
            stroke="oklch(25% 0.01 240)"
            strokeOpacity={0.3}
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: 'oklch(65% 0.01 240)', fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: 'oklch(65% 0.01 240)', fontSize: 12 }}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <defs>
            <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(160, 84%, 39%)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="hsl(160, 84%, 39%)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <Area
            dataKey="value"
            type="monotone"
            fill="url(#fillValue)"
            fillOpacity={0.4}
            stroke="hsl(160, 84%, 39%)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
