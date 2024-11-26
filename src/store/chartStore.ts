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
  slPrice: number | null
  epPrice: number | null
  tpPrice: number | null
}

export const useChartStore = create<ChartState>((set, get) => ({
  chart: null,
  candlestickSeries: null,
  isDrawing: false,
  startPoint: null,
  endPoint: null,
  rectangleCoords: null,
  slPrice: null,
  epPrice: null,
  tpPrice: null,

  initChart: (container: HTMLElement) => {
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      crosshair: {
        mode: 0,
        vertLine: {
          labelVisible: false,
        },
        horzLine: {
          labelVisible: false,
        },
      },
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
      const { isDrawing, startPoint, slPrice, candlestickSeries } = get()
      
      if (overlayCanvas instanceof HTMLCanvasElement && candlestickSeries) {
        const ctx = overlayCanvas.getContext('2d')
        if (ctx && isDrawing && startPoint && param.point && slPrice) {
          ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
          
          const currentPrice = candlestickSeries.coordinateToPrice(param.point.y)
          if (!currentPrice) return
          
          // Konwertujemy ceny na koordynaty Y
          const slY = candlestickSeries.priceToCoordinate(slPrice)!
          const currentY = candlestickSeries.priceToCoordinate(currentPrice)!
          const tpY = candlestickSeries.priceToCoordinate(currentPrice + (currentPrice - slPrice) * RRR)!
          
          // Rysujemy prostokąty używając przeliczonych koordynatów Y
          ctx.fillStyle = 'rgba(144, 238, 144, 0.3)' // zielony dla TP
          ctx.fillRect(
            startPoint.x,
            currentY,
            param.point.x - startPoint.x,
            tpY - currentY
          )
          
          ctx.fillStyle = 'rgba(255, 192, 203, 0.3)' // czerwony dla SL
          ctx.fillRect(
            startPoint.x,
            slY,
            param.point.x - startPoint.x,
            currentY - slY
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
    const { isDrawing, candlestickSeries, chart } = get()
    
    if (!chart || !candlestickSeries) return
    
    const container = chart.chartElement()
    const chartHeight = container?.clientHeight ?? 0
    const invertedY = chartHeight - y
    
    if (!isDrawing) {
      const slPrice = candlestickSeries.coordinateToPrice(invertedY)
      console.log('SL point: ', { price: slPrice })
      set({ 
        isDrawing: true, 
        slPrice,
        startPoint: { x, y }
      })
    } else {
      const epPrice = candlestickSeries.coordinateToPrice(invertedY)
      const priceDiff = epPrice - get().slPrice!
      const tpPrice = epPrice + (priceDiff * RRR)
      
      console.log('EP point: ', { price: epPrice })
      console.log('TP point: ', { price: tpPrice })
      
      // Konwertujemy ceny z powrotem na koordynaty do rysowania
      const slY = candlestickSeries.priceToCoordinate(get().slPrice!)!
      const epY = candlestickSeries.priceToCoordinate(epPrice)!
      const tpY = candlestickSeries.priceToCoordinate(tpPrice)!
      
      set({ 
        isDrawing: false,
        epPrice,
        tpPrice,
        endPoint: { x, y },
        rectangleCoords: {
          start: { x: get().startPoint!.x, y: chartHeight - slY },
          end: { x, y: chartHeight - epY }
        }
      })
    }
  },
}))
