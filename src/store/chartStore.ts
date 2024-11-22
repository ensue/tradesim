import { create } from 'zustand'
import { createChart, IChartApi, CandlestickData } from 'lightweight-charts'
import { sampleData } from '../data/sampleData'

const RRR = 1

interface ChartState {
  chart: IChartApi | null
  candlestickSeries: ReturnType<IChartApi['addCandlestickSeries']> | null
  isDrawing: boolean
  startPoint: { x: number; y: number } | null
  endPoint: { x: number; y: number } | null
  rectangleCoords: { start: { x: number; y: number }, end: { x: number; y: number } } | null
  initChart: (container: HTMLElement) => IChartApi
  destroyChart: () => void
  loadData: (data: CandlestickData[]) => void
  handleChartClick: (x: number, y: number) => void
}

export const useChartStore = create<ChartState>((set, get) => ({
  chart: null,
  candlestickSeries: null,
  isDrawing: false,
  startPoint: null,
  endPoint: null,
  rectangleCoords: null,

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

    const overlayCanvas = document.createElement('canvas')
    overlayCanvas.style.position = 'absolute'
    overlayCanvas.style.top = '0'
    overlayCanvas.style.left = '0'
    overlayCanvas.style.pointerEvents = 'none'
    overlayCanvas.style.zIndex = '20'
    overlayCanvas.width = container.clientWidth
    overlayCanvas.height = container.clientHeight
    container.appendChild(overlayCanvas)

    chart.subscribeCrosshairMove((param) => {
      const { isDrawing, startPoint } = get()
      
      if (overlayCanvas instanceof HTMLCanvasElement) {
        const ctx = overlayCanvas.getContext('2d')
        if (ctx && isDrawing && startPoint && param.point) {
          ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
          
          const x = param.point.x
          const y = overlayCanvas.height - param.point.y
          
          const width = x - startPoint.x
          const height = startPoint.y - y
          
          // Rysowanie pierwszego prostokąta (różowy - SL do EP)
          ctx.fillStyle = 'rgba(255, 192, 203, 0.3)'
          ctx.fillRect(startPoint.x, overlayCanvas.height - startPoint.y, width, height)
          
          // Rysowanie drugiego prostokąta (jasnozielony - EP do TP)
          ctx.fillStyle = 'rgba(144, 238, 144, 0.3)'
          ctx.fillRect(
            x - width,
            overlayCanvas.height - y,
            width * RRR,
            height
          )
        }
      }
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

  handleChartClick: (x: number, y: number) => {
    const { isDrawing } = get()
    
    if (!isDrawing) {
      console.log('SL point:', { x, y })
      set({ isDrawing: true, startPoint: { x, y }, endPoint: null })
    } else {
      console.log('EP point:', { x, y })
      
      // Obliczanie punktu TP
      const startPoint = get().startPoint!
      const tpX = x
      const width = x - startPoint.x
      const tpY = y + (width * RRR)
      console.log('TP point:', { x: tpX, y: tpY })
      
      set({ 
        isDrawing: false, 
        endPoint: { x, y },
        rectangleCoords: {
          start: startPoint,
          end: { x, y }
        }
      })
    }
  },
}))
