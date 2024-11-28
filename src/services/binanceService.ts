import { CandlestickData } from 'lightweight-charts'

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const
type Interval = typeof INTERVALS[number]

interface BinanceKline {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
  quoteVolume: string
  trades: number
  takerBaseVolume: string
  takerQuoteVolume: string
  ignore: string
}

export async function fetchRandomCryptoHistory(): Promise<CandlestickData[]> {
  console.log('Starting fetchRandomCryptoHistory...')
  const baseUrl = 'https://api.binance.com/api/v3'

  try {
    console.log('Fetching exchange info...')
    const exchangeInfo = await fetch(`${baseUrl}/exchangeInfo`)
    const exchangeData = await exchangeInfo.json()
    console.log('Exchange info received:', exchangeData.symbols ? 'Yes' : 'No')
    
    const usdtPairs = exchangeData.symbols
      .filter((symbol: any) => 
        symbol.status === 'TRADING' && 
        symbol.quoteAsset === 'USDT' &&
        symbol.isSpotTradingAllowed
      )
      .map((symbol: any) => symbol.symbol)
    
    console.log('Available USDT pairs:', usdtPairs.length)
    
    const randomPair = usdtPairs[Math.floor(Math.random() * usdtPairs.length)]
    const randomInterval = INTERVALS[Math.floor(Math.random() * INTERVALS.length)]
    
    console.log('Selected pair:', randomPair)
    console.log('Selected interval:', randomInterval)
    
    const now = Date.now()
    const intervalInMs = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000
    }
    const startTime = now - (3000 * intervalInMs[randomInterval])

    const klines = await fetch(
      `${baseUrl}/klines?symbol=${randomPair}&interval=${randomInterval}&startTime=${startTime}&limit=1000`
    )
    const klinesData: any[][] = await klines.json()

    const formattedData = klinesData.map(kline => ({
      time: kline[0] / 1000,
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4])
    }))

    console.log('Debug data:', JSON.stringify(formattedData, null, 2))
    return formattedData
  } catch (error) {
    console.error('Error fetching random crypto history:', error)
    return []
  }
} 