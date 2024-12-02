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
  hasActiveRectangles: boolean
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
  hasActiveRectangles: false,

  initChart: (container: HTMLElement) => {
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      crosshair: {
        mode: 1,
        vertLine: {
          labelVisible: true,
        },
        horzLine: {
          labelVisible: true,
        },
      },
      rightPriceScale: {
        visible: true,
        autoScale: true,
        entireTextOnly: true,
      },
      timeScale: {
        visible: true,
        rightOffset: 100,
        barSpacing: 5,
        minBarSpacing: 1,
        fixLeftEdge: true,
        fixRightEdge: false,
      },
      grid: {
        vertLines: {
          visible: true,
        },
        horzLines: {
          visible: true,
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

    // Funkcja pomocnicza do przerysowywania
    const redrawOverlay = (param?: any) => {
      const ctx = overlayCanvas.getContext('2d')
      if (!ctx) return
      
      // Clear the canvas
      ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
      
      // Draw saved rectangles if they exist
      if (get().hasActiveRectangles) {
        const { slPrice, tpPrice, epPrice } = get()
        get().drawRectangles(ctx, 0, 0)
      }
      
      // Draw preview if drawing is in progress
      const { isDrawing, startPoint, candlestickSeries } = get()
      if (isDrawing && startPoint && param?.point && candlestickSeries) {
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

    // Poprawione subskrypcje zdarzeń
    chart.timeScale().subscribeVisibleLogicalRangeChange(redrawOverlay)
    chart.timeScale().subscribeVisibleTimeRangeChange(redrawOverlay)
    chart.subscribeCrosshairMove((param) => {
      redrawOverlay(param)
    })
    chart.subscribeClick(redrawOverlay)

    // Listener na zmianę rozmiaru
    const resizeObserver = new ResizeObserver(() => {
      overlayCanvas.width = container.clientWidth
      overlayCanvas.height = container.clientHeight
      chart.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight
      })
      redrawOverlay()
    })
    resizeObserver.observe(container)

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
    const { isDrawing, candlestickSeries, chart, hasActiveRectangles } = get()
    
    if (!chart || !candlestickSeries) return
    
    // Ensure we don't start new drawing if we have active rectangles
    if (hasActiveRectangles) return

    const container = chart.chartElement()
    const chartHeight = container?.clientHeight ?? 0
    const timeScale = chart.timeScale()
    
    // Oblicz cenę tak jak wcześniej
    const midY = chartHeight / 2
    const midPrice = candlestickSeries.coordinateToPrice(midY)
    if (midPrice === null) return
    
    const deltaY = midY - y
    const testY = midY - 100
    const testPrice = candlestickSeries.coordinateToPrice(testY)
    if (testPrice === null) return
    
    const pixelsPerPrice = 100 / (testPrice - midPrice)
    const price = midPrice + (deltaY / pixelsPerPrice)

    // Ekstrapolacja czasu
    const visibleRange = timeScale.getVisibleRange()
    if (!visibleRange) return

    // Pobierz widoczny zakres pikseli
    const logicalRange = timeScale.getVisibleLogicalRange()
    if (!logicalRange) return
    
    const firstPixel = timeScale.logicalToCoordinate(logicalRange.from)
    const lastPixel = timeScale.logicalToCoordinate(logicalRange.to)
    const pixelRange = lastPixel - firstPixel
    
    // Oblicz czas na podstawie proporcji pikseli
    const timeRange = visibleRange.to - visibleRange.from
    const timePerPixel = timeRange / pixelRange
    const deltaX = x - firstPixel
    const timestamp = visibleRange.from + (deltaX * timePerPixel)

    if (!isDrawing) {
      console.log('SL point: ', { price, time: timestamp })
      set({ 
        isDrawing: true, 
        slPrice: price,
        startPoint: { x, y },
        slTimestamp: timestamp
      })
    } else {
      const epPrice = get().slPrice! + (price - get().slPrice!) / (RRR + 1)
      
      console.log('TP point: ', { price, time: timestamp })
      console.log('EP point: ', { price: epPrice })
      
      set({ 
        isDrawing: false,
        epPrice,
        tpPrice: price,
        endPoint: { x, y },
        tpTimestamp: timestamp,
        hasActiveRectangles: true
      })
    }
  },
}))