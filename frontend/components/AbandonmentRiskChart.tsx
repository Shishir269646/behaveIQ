// frontend/components/AbandonmentRiskChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AbandonmentStat } from '@/hooks/useAbandonment';

interface AbandonmentRiskChartProps {
    data: AbandonmentStat[];
}

const AbandonmentRiskChart: React.FC<AbandonmentRiskChartProps> = ({ data }) => {
    // Sort data by date to ensure correct trend display
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart
                data={sortedData}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" label={{ value: 'Risk Score (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Sessions', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="riskScore" stroke="#8884d8" activeDot={{ r: 8 }} name="Avg. Risk Score" />
                <Line yAxisId="right" type="monotone" dataKey="sessions" stroke="#82ca9d" name="Sessions" />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default AbandonmentRiskChart;
