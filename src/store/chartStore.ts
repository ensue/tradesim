import { create } from 'zustand'
import { createChart, IChartApi, CandlestickData, IPriceLine } from 'lightweight-charts'

interface ChartState {
  chart: IChartApi | null
  candlestickSeries: ReturnType<IChartApi['addCandlestickSeries']> | null
  entryLine: IPriceLine | null
  stopLossLine: IPriceLine | null
  takeProfitLine: IPriceLine | null
  initChart: (container: HTMLElement) => void
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
      },
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
    const { candlestickSeries } = get()
    if (candlestickSeries) {
      candlestickSeries.setData(data)
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
