import { create } from 'zustand'
import { createChart, IChartApi, CandlestickData } from 'lightweight-charts'

interface ChartState {
  chart: IChartApi | null
  candlestickSeries: ReturnType<IChartApi['addCandlestickSeries']> | null
  initChart: (container: HTMLElement) => IChartApi
  destroyChart: () => void
  loadData: (data: CandlestickData[]) => void
}

export const useChartStore = create<ChartState>((set, get) => ({
  chart: null,
  candlestickSeries: null,

  initChart: (container: HTMLElement) => {
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
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
      }
    })
  },

  loadData: (data: CandlestickData[]) => {
    const { candlestickSeries } = get()
    if (candlestickSeries) {
      candlestickSeries.setData(data)
    }
  },
}))
