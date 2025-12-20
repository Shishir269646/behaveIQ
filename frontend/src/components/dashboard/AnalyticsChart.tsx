'use client'

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AnalyticsChartProps {
    data: any[]
    type?: 'line' | 'bar'
    dataKeys: Array<{
        key: string
        name: string
        color: string
    }>
    height?: number
}

export function AnalyticsChart({
    data,
    type = 'line',
    dataKeys,
    height = 300
}: AnalyticsChartProps) {
    if (type === 'bar') {
        return (
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {dataKeys.map(({ key, name, color }) => (
                        <Bar key={key} dataKey={key} fill={color} name={name} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {dataKeys.map(({ key, name, color }) => (
                    <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={color}
                        name={name}
                        strokeWidth={2}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    )
}