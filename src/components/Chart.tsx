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
      <div className="flex gap-2 p-2">
        <button 
          className={`px-4 py-2 rounded ${activeMarker === 'ep' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveMarker(current => current === 'ep' ? null : 'ep')}
        >
          EP
        </button>
        <button 
          className={`px-4 py-2 rounded ${activeMarker === 'sl' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveMarker(current => current === 'sl' ? null : 'sl')}
        >
          SL
        </button>
        <button 
          className={`px-4 py-2 rounded ${activeMarker === 'tp' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveMarker(current => current === 'tp' ? null : 'tp')}
        >
          TP
        </button>
        {currentPrice && (
          <span className="px-4 py-2 bg-gray-100 rounded">
            Price: {currentPrice.toFixed(2)}
          </span>
        )}
      </div>
      <div ref={containerRef} className="flex-1" />
    </div>
  )
}
