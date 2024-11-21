import { useEffect, useRef, useState, useCallback } from 'react'
import { useChartStore } from '../store/chartStore'
import { sampleData } from '../data/sampleData'
import { IChartApi, MouseEventParams, CandlestickData } from 'lightweight-charts'

export function Chart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const { initChart, destroyChart, loadData } = useChartStore()

  const handleCrosshairMove = useCallback((param: MouseEventParams) => {
    if (param.seriesData.size > 0) {
      const candleData = Array.from(param.seriesData.values())[0] as CandlestickData
      if (candleData) {
        setCurrentPrice(candleData.close)
      }
    }
  }, [])

  useEffect(() => {
    const chartContainer = containerRef.current
    if (chartContainer) {
      const chart = initChart(chartContainer)
      chartRef.current = chart
      loadData(sampleData)

      chart.subscribeCrosshairMove(handleCrosshairMove)
      
      return () => {
        chart.unsubscribeCrosshairMove(handleCrosshairMove)
        destroyChart()
      }
    }
  }, [initChart, destroyChart, loadData, handleCrosshairMove])

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-2 p-2 border-b border-gray-200">
        <div className="flex gap-2">
          {currentPrice && (
            <span className="px-4 py-2 bg-gray-100 rounded ml-auto">
              Price: {currentPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      <div ref={containerRef} className="flex-1" />
    </div>
  )
}
