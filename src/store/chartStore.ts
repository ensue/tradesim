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
  startTime: number | null
  endTime: number | null
  slTimestamp: number | null
  tpTimestamp: number | null
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
  startTime: null,
  endTime: null,
  slTimestamp: null,
  tpTimestamp: null,

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
          
          const currentPrice = candlestickSeries.coordinateToPrice(param.point.y)
          if (!currentPrice) return

          const slPrice = get().slPrice!
          const tpPrice = currentPrice
          const epPrice = slPrice + (tpPrice - slPrice) / (RRR + 1)

          // Konwertujemy ceny na koordynaty Y
          const slY = candlestickSeries.priceToCoordinate(slPrice)!
          const epY = candlestickSeries.priceToCoordinate(epPrice)!
          const tpY = candlestickSeries.priceToCoordinate(tpPrice)!

          // Rysujemy prostokąt SL -> EP (czerwony)
          ctx.fillStyle = 'rgba(255, 192, 203, 0.3)'
          ctx.fillRect(
            startPoint.x,
            slY,
            param.point.x - startPoint.x,
            epY - slY
          )

          // Rysujemy prostokąt EP -> TP (zielony)
          ctx.fillStyle = 'rgba(144, 238, 144, 0.3)'
          ctx.fillRect(
            startPoint.x,
            epY,
            param.point.x - startPoint.x,
            tpY - epY
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
    const { slPrice, tpPrice, epPrice, candlestickSeries, chart, slTimestamp, tpTimestamp } = get()
    if (!candlestickSeries || !chart || !slPrice || !tpPrice || !epPrice || !slTimestamp || !tpTimestamp) return

    const slY = candlestickSeries.priceToCoordinate(slPrice)!
    const epY = candlestickSeries.priceToCoordinate(epPrice)!
    const tpY = candlestickSeries.priceToCoordinate(tpPrice)!

    // Konwertujemy timestampy na koordynaty X
    const slX = chart.timeScale().timeToCoordinate(slTimestamp)!
    const tpX = chart.timeScale().timeToCoordinate(tpTimestamp)!

    // Rysujemy prostokąt SL -> EP
    ctx.fillStyle = 'rgba(255, 192, 203, 0.3)'
    ctx.fillRect(
      slX,
      slY,
      tpX - slX,
      epY - slY
    )

    // Rysujemy prostokąt EP -> TP
    ctx.fillStyle = 'rgba(144, 238, 144, 0.3)'
    ctx.fillRect(
      slX,
      epY,
      tpX - slX,
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
      const timestamp = chart.timeScale().coordinateToTime(x)
      if (timestamp === null) {
        console.warn('Click outside of chart time range')
        return
      }
      
      console.log('SL point: ', { price: slPrice, time: timestamp })
      set({ 
        isDrawing: true, 
        slPrice,
        startPoint: { x, y },
        slTimestamp: timestamp
      })
    } else {
      const tpPrice = candlestickSeries.coordinateToPrice(invertedY)
      const timestamp = chart.timeScale().coordinateToTime(x)
      if (timestamp === null) {
        console.warn('Click outside of chart time range')
        return
      }
      const epPrice = get().slPrice! + (tpPrice - get().slPrice!) / (RRR + 1)
      
      console.log('TP point: ', { price: tpPrice, time: timestamp })
      console.log('EP point: ', { price: epPrice })
      
      set({ 
        isDrawing: false,
        epPrice,
        tpPrice,
        endPoint: { x, y },
        tpTimestamp: timestamp
      })
    }
  },
}))