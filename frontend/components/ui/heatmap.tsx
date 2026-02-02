import React, { useEffect, useRef } from 'react'
import h337 from 'heatmap.js'

interface HeatmapPoint {
  x: number
  y: number
  value: number
}

interface HeatmapProps {
  data: HeatmapPoint[]
}

const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  const heatmapContainerRef = useRef<HTMLDivElement>(null)
  const heatmapInstanceRef = useRef<h337.Heatmap<'value', 'x', 'y'> | null>(
    null
  )

  useEffect(() => {
    const currentContainer = heatmapContainerRef.current

    if (!currentContainer) {
      return
    }

    const initializeHeatmap = () => {
      if (heatmapInstanceRef.current) {
        // Instead of remove(), manually clear the container
        const canvas = currentContainer.querySelector('canvas')
        if (canvas) {
          currentContainer.removeChild(canvas)
        }
      }
      heatmapInstanceRef.current = h337.create({
        container: currentContainer,
        radius: 50,
        maxOpacity: 0.6,
        minOpacity: 0.1,
        blur: 0.75,
      })
      updateHeatmapData()
    }

    const updateHeatmapData = () => {
      if (!heatmapInstanceRef.current || !data) {
        return
      }
      const max = Math.max(...data.map((point) => point.value), 0)
      const heatmapData = {
        min: 0,
        max: max,
        data: data,
      }
      heatmapInstanceRef.current.setData(heatmapData)
    }

    initializeHeatmap()

    const resizeObserver = new ResizeObserver(() => {
      if (heatmapInstanceRef.current && currentContainer) {
        initializeHeatmap()
      }
    })

    resizeObserver.observe(currentContainer)

    return () => {
      resizeObserver.unobserve(currentContainer)
      if (heatmapInstanceRef.current) {
        const canvas = currentContainer.querySelector('canvas')
        if (canvas) {
          currentContainer.removeChild(canvas)
        }
        heatmapInstanceRef.current = null
      }
    }
  }, [data])

  return (
    <div
      ref={heatmapContainerRef}
      style={{ position: 'relative' }} // Remove fixed width/height
      className='w-full h-full heatmap-container' // Use Tailwind for responsive sizing
    />
  )
}

export default Heatmap
