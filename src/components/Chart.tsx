import { useEffect, useRef, useState, useCallback } from 'react'
import { useChartStore } from '../store/chartStore'
import { sampleData } from '../data/sampleData'
import { MouseEventParams } from 'lightweight-charts'

type MarkerMode = 'entry' | 'sl' | 'tp' | null

export function Chart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeMarker, setActiveMarker] = useState<MarkerMode>(null)
  const { initChart, destroyChart, loadData, setEntryPrice, setStopLoss, setTakeProfit } = useChartStore()

  const handleCrosshairMove = useCallback((param: MouseEventParams) => {
    if (param.point && activeMarker) {
      const price = param.seriesPrices.get(useChartStore.getState().candlestickSeries!)
      if (price) {
        switch (activeMarker) {
          case 'entry':
            setEntryPrice(price)
            break
          case 'sl':
            setStopLoss(price)
            break
          case 'tp':
            setTakeProfit(price)
            break
        }
      }
    }
  }, [activeMarker, setEntryPrice, setStopLoss, setTakeProfit])

  useEffect(() => {
    const chartContainer = containerRef.current
    if (chartContainer) {
      const chart = initChart(chartContainer)
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
      <div className="flex gap-2 p-2">
        <button 
          className={`px-4 py-2 ${activeMarker === 'entry' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveMarker(current => current === 'entry' ? null : 'entry')}
        >
          Entry
        </button>
        <button 
          className={`px-4 py-2 ${activeMarker === 'sl' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveMarker(current => current === 'sl' ? null : 'sl')}
        >
          Stop Loss
        </button>
        <button 
          className={`px-4 py-2 ${activeMarker === 'tp' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveMarker(current => current === 'tp' ? null : 'tp')}
        >
          Take Profit
        </button>
      </div>
      <div ref={containerRef} className="flex-1" />
    </div>
  )
}
