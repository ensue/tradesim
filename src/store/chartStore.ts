import { create } from 'zustand'
import { createChart, IChartApi, CandlestickData, IPriceLine } from 'lightweight-charts'

interface ChartState {
  chart: IChartApi | null
  candlestickSeries: ReturnType<IChartApi['addCandlestickSeries']> | null
  entryLine: IPriceLine | null
  stopLossLine: IPriceLine | null
  takeProfitLine: IPriceLine | null
  initChart: (container: HTMLElement) => IChartApi
  destroyChart: () => void
  loadData: (data: CandlestickData[]) => void
  setEntryPrice: (price: number) => void
  setStopLoss: (price: number) => void
  setTakeProfit: (price: number) => void
}

export const useChartStore = create<ChartState>((set, get) => ({
  chart: null,
  candlestickSeries: null,
  entryLine: null,
  stopLossLine: null,
  takeProfitLine: null,

  initChart: (container: HTMLElement) => {
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#000000',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#2196F3',
          style: 1,
        },
        horzLine: {
          width: 1,
          color: '#2196F3',
          style: 1,
          labelVisible: true,
        },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        rightOffset: 6,
        barSpacing: 40,
        fixLeftEdge: true,
        fixRightEdge: true,
        borderVisible: false,
        visible: true,
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true
      },
      handleScale: {
        mouseWheel: false,
        pinch: false,
      }
    })
    
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    set({ chart, candlestickSeries })
    return chart
  },

  destroyChart: () => {
    set((state) => {
      state.chart?.remove()
      return { 
        chart: null, 
        candlestickSeries: null,
        entryLine: null,
        stopLossLine: null,
        takeProfitLine: null,
      }
    })
  },

  loadData: (data: CandlestickData[]) => {
    const { candlestickSeries, chart } = get()
    if (candlestickSeries && chart) {
      candlestickSeries.setData(data)

      // Ustaw widoczny zakres po załadowaniu danych
      setTimeout(() => {
        const timeScale = chart.timeScale()
        const points = data.length
        const visiblePoints = Math.floor(points * 0.75)  // Pokaż 75% punktów
        
        // Przesuń wykres tak, aby ostatnia świeczka była widoczna
        timeScale.setVisibleLogicalRange({
          from: points - visiblePoints,
          to: points - 1
        })
      }, 100)
    }
  },

  setEntryPrice: (price: number) => {
    const { candlestickSeries, entryLine } = get()
    if (candlestickSeries) {
      if (entryLine) {
        candlestickSeries.removePriceLine(entryLine)
      }
      const newLine = candlestickSeries.createPriceLine({
        price,
        color: '#2196F3',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Entry',
      })
      set({ entryLine: newLine })
    }
  },

  setStopLoss: (price: number) => {
    const { candlestickSeries, stopLossLine } = get()
    if (candlestickSeries) {
      if (stopLossLine) {
        candlestickSeries.removePriceLine(stopLossLine)
      }
      const newLine = candlestickSeries.createPriceLine({
        price,
        color: '#FF0000',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'SL',
      })
      set({ stopLossLine: newLine })
    }
  },

  setTakeProfit: (price: number) => {
    const { candlestickSeries, takeProfitLine } = get()
    if (candlestickSeries) {
      if (takeProfitLine) {
        candlestickSeries.removePriceLine(takeProfitLine)
      }
      const newLine = candlestickSeries.createPriceLine({
        price,
        color: '#4CAF50',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP',
      })
      set({ takeProfitLine: newLine })
    }
  },
}))
