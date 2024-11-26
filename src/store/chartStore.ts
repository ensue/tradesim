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
  drawRectangles: (ctx: CanvasRenderingContext2D, startX: number, endX: number) => void
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
      const { isDrawing, startPoint, candlestickSeries } = get()
      
      if (overlayCanvas instanceof HTMLCanvasElement && candlestickSeries) {
        const ctx = overlayCanvas.getContext('2d')
        if (ctx && isDrawing && startPoint && param.point) {
          ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
          
          const mkPrice = candlestickSeries.coordinateToPrice(param.point.y)
          if (!mkPrice) return

          const slPrice = get().slPrice!
          const slDistance = Math.abs(mkPrice - slPrice)
          const maxTpDistance = slDistance * RRR
          
          // Ograniczamy TP do maksymalnej dozwolonej odległości
          const tpPrice = mkPrice + Math.min(mkPrice - slPrice, maxTpDistance)
          const epPrice = slPrice + (tpPrice - slPrice) / (RRR + 1)

          // Konwertujemy OBLICZONE ceny na koordynaty Y
          const slY = candlestickSeries.priceToCoordinate(slPrice)!
          const epY = candlestickSeries.priceToCoordinate(epPrice)!
          const tpY = candlestickSeries.priceToCoordinate(tpPrice)!

          // Rysujemy prostokąty używając obliczonych koordynatów Y
          ctx.fillStyle = 'rgba(255, 192, 203, 0.3)'
          ctx.fillRect(
            startPoint.x,
            Math.min(slY, epY),  // używamy Math.min/max aby obsłużyć oba kierunki ruchu
            param.point.x - startPoint.x,
            Math.abs(epY - slY)
          )

          ctx.fillStyle = 'rgba(144, 238, 144, 0.3)'
          ctx.fillRect(
            startPoint.x,
            Math.min(epY, tpY),
            param.point.x - startPoint.x,
            Math.abs(tpY - epY)
          )

          set({ tpPrice, epPrice })
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

  drawRectangles: (ctx: CanvasRenderingContext2D, startX: number, endX: number) => {
    const { slPrice, tpPrice, epPrice, candlestickSeries } = get()
    if (!candlestickSeries || !slPrice || !tpPrice || !epPrice) return

    const slY = candlestickSeries.priceToCoordinate(slPrice)!
    const epY = candlestickSeries.priceToCoordinate(epPrice)!
    const tpY = candlestickSeries.priceToCoordinate(tpPrice)!

    // Rysujemy prostokąt SL -> EP
    ctx.fillStyle = 'rgba(255, 192, 203, 0.3)'
    ctx.fillRect(
      startX,
      slY,
      endX - startX,
      epY - slY
    )

    // Rysujemy prostokąt EP -> TP
    ctx.fillStyle = 'rgba(144, 238, 144, 0.3)'
    ctx.fillRect(
      startX,
      epY,
      endX - startX,
      tpY - epY
    )
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
      const tpPrice = candlestickSeries.coordinateToPrice(invertedY)
      // Obliczamy EP jako punkt środkowy między SL i TP
      const epPrice = get().slPrice! + (tpPrice - get().slPrice!) / (RRR + 1)
      
      console.log('TP point: ', { price: tpPrice })
      console.log('EP point: ', { price: epPrice })
      
      set({ 
        isDrawing: false,
        epPrice,
        tpPrice,
        endPoint: { x, y }
      })
    }
  },
}))
