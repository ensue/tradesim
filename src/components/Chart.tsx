import { useEffect, useRef, useState, useCallback } from 'react'
import { useChartStore } from '../store/chartStore'
import { sampleData } from '../data/sampleData'
import { IChartApi, MouseEventParams, CandlestickData } from 'lightweight-charts'

type MarkerMode = 'ep' | 'sl' | 'tp' | null

export function Chart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [activeMarker, setActiveMarker] = useState<MarkerMode>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const { initChart, destroyChart, loadData, setEntryPrice, setStopLoss, setTakeProfit } = useChartStore()

  const handleCrosshairMove = useCallback((param: MouseEventParams) => {
    if (param.seriesData.size > 0) {
      const candleData = Array.from(param.seriesData.values())[0] as CandlestickData
      if (candleData) {
        setCurrentPrice(candleData.close)
      }
    }
  }, [])

  const handleClick = useCallback(() => {
    if (!activeMarker || currentPrice === null) return

    switch (activeMarker) {
      case 'ep':
        setEntryPrice(currentPrice)
        break
      case 'sl':
        setStopLoss(currentPrice)
        break
      case 'tp':
        setTakeProfit(currentPrice)
        break
    }
    setActiveMarker(null)
  }, [activeMarker, currentPrice, setEntryPrice, setStopLoss, setTakeProfit])

  useEffect(() => {
    const chartContainer = containerRef.current
    if (chartContainer) {
      const chart = initChart(chartContainer)
      chartRef.current = chart
      loadData(sampleData)

      chart.subscribeCrosshairMove(handleCrosshairMove)
      chartContainer.addEventListener('click', handleClick)
      
      return () => {
        chart.unsubscribeCrosshairMove(handleCrosshairMove)
        chartContainer.removeEventListener('click', handleClick)
        destroyChart()
      }
    }
  }, [initChart, destroyChart, loadData, handleClick, handleCrosshairMove])

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-2 p-2 border-b border-gray-200">
        <div className="flex gap-2">
          <button 
            className={`px-4 py-2 rounded transition-colors ${
              activeMarker === 'ep' 
                ? 'bg-blue-500 text-white ring-2 ring-blue-300' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setActiveMarker(current => current === 'ep' ? null : 'ep')}
          >
            EP
          </button>
          <button 
            className={`px-4 py-2 rounded transition-colors ${
              activeMarker === 'sl' 
                ? 'bg-red-500 text-white ring-2 ring-red-300' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setActiveMarker(current => current === 'sl' ? null : 'sl')}
          >
            SL
          </button>
          <button 
            className={`px-4 py-2 rounded transition-colors ${
              activeMarker === 'tp' 
                ? 'bg-green-500 text-white ring-2 ring-green-300' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setActiveMarker(current => current === 'tp' ? null : 'tp')}
          >
            TP
          </button>
          {currentPrice && (
            <span className="px-4 py-2 bg-gray-100 rounded ml-auto">
              Price: {currentPrice.toFixed(2)}
            </span>
          )}
        </div>
        {activeMarker && (
          <div className="text-sm text-gray-600">
            Kliknij na wykresie, aby ustawić {activeMarker.toUpperCase()} linię
          </div>
        )}
      </div>
      <div ref={containerRef} className="flex-1" />
    </div>
  )
}
