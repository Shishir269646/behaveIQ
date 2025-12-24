"use client";

import React, { useEffect, useRef } from 'react';
import h337 from 'heatmap.js';

interface HeatmapPoint {
    x: number;
    y: number;
    value: number;
}

interface HeatmapProps {
    data: HeatmapPoint[];
    width: number;
    height: number;
}

const Heatmap: React.FC<HeatmapProps> = ({ data, width, height }) => {
    const heatmapContainerRef = useRef<HTMLDivElement>(null);
    const heatmapInstanceRef = useRef<h337.Heatmap<'value', 'x', 'y'> | null>(null);

    useEffect(() => {
        if (!heatmapContainerRef.current) {
            return;
        }

        // Initialize heatmap instance if it doesn't exist
        if (!heatmapInstanceRef.current) {
            heatmapInstanceRef.current = h337.create({
                container: heatmapContainerRef.current,
                radius: 50, // Adjust radius for better visuals
                maxOpacity: 0.6,
                minOpacity: 0.1,
                blur: .75,
            });
        }

        const heatmapInstance = heatmapInstanceRef.current;

        // Find max value for scaling
        const max = Math.max(...data.map(point => point.value), 0);

        const heatmapData = {
            min: 0, // Heatmap.js typically expects a min value for scaling
            max: max,
            data: data,
        };

        heatmapInstance.setData(heatmapData);

    }, [data]);

    return (
        <div
            ref={heatmapContainerRef}
            style={{ width: `${width}px`, height: `${height}px`, position: 'relative' }}
            className="heatmap-container"
        />
    );
};

export default Heatmap;
