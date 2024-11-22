import { useEffect, useRef, useCallback } from 'react'
import { useChartStore } from '../store/chartStore'
import { sampleData } from '../data/sampleData'
import { IChartApi } from 'lightweight-charts'

export function Chart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const { initChart, destroyChart, loadData, handleChartClick } = useChartStore()

  const handleClick = useCallback((event: MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      handleChartClick(x, y)
    }
  }, [handleChartClick])

  useEffect(() => {
    const chartContainer = containerRef.current
    if (chartContainer) {
      const chart = initChart(chartContainer)
      chartRef.current = chart
      loadData(sampleData)
      
      chartContainer.addEventListener('click', handleClick)
      
      return () => {
        chartContainer.removeEventListener('click', handleClick)
        destroyChart()
      }
    }
  }, [initChart, destroyChart, loadData, handleClick])

  return (
    <div className="flex flex-col h-full">
      <div ref={containerRef} className="flex-1 chart-container" />
    </div>
  )
}