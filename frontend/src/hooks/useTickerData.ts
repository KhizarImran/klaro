import { useState, useEffect } from 'react'

export interface TickerItem {
  symbol: string
  displaySymbol: string
  price: string
  change: string
  isPositive: boolean
}

interface CachedData {
  data: TickerItem[]
  timestamp: number
}

const SYMBOLS = [
  { symbol: 'BTC/USD', twelveDataSymbol: 'BTC/USD', display: 'BTC/USD' },
  { symbol: 'ETH/USD', twelveDataSymbol: 'ETH/USD', display: 'ETH/USD' },
  { symbol: 'XAU/USD', twelveDataSymbol: 'XAU/USD', display: 'XAU/USD' },
  { symbol: 'EUR/USD', twelveDataSymbol: 'EUR/USD', display: 'EUR/USD' },
  { symbol: 'GBP/USD', twelveDataSymbol: 'GBP/USD', display: 'GBP/USD' },
]

const CACHE_KEY = 'klaro_ticker_data'
const CACHE_DURATION = 30000 // 30 seconds in milliseconds

export function useTickerData() {
  const [tickerData, setTickerData] = useState<TickerItem[]>(() => {
    // Initialize with cached data if available
    const cached = getCachedData()
    return cached || getFallbackData()
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickerData = async () => {
    const apiKey = import.meta.env.VITE_TWELVE_DATA_API_KEY

    if (!apiKey || apiKey === 'your_api_key_here') {
      console.warn('Twelve Data API key not configured. Using cached/fallback data.')
      setIsLoading(false)
      return
    }

    // Check if cache is still valid
    const cached = getCachedData()
    if (cached) {
      console.log('Using cached ticker data')
      setTickerData(cached)
      setIsLoading(false)
      return
    }

    try {
      console.log('Fetching fresh ticker data from API...')
      const symbolString = SYMBOLS.map(s => s.twelveDataSymbol).join(',')

      const response = await fetch(
        `https://api.twelvedata.com/quote?symbol=${symbolString}&apikey=${apiKey}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch ticker data')
      }

      const data = await response.json()
      console.log('API Response:', data)

      // Handle both single and multiple symbol responses
      const quotes = Array.isArray(data) ? data : Object.values(data)

      const formattedData: TickerItem[] = quotes.map((quote: any, index: number) => {
        const change = parseFloat(quote.percent_change || '0')
        return {
          symbol: SYMBOLS[index].symbol,
          displaySymbol: SYMBOLS[index].display,
          price: formatPrice(quote.close || quote.price || '0', SYMBOLS[index].symbol),
          change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
          isPositive: change >= 0,
        }
      })

      // Save to cache
      setCachedData(formattedData)
      setTickerData(formattedData)
      setError(null)
      console.log('Ticker data updated and cached')
    } catch (err) {
      console.error('Error fetching ticker data:', err)
      setError('Failed to fetch live data. Using cached/fallback.')
      // Keep existing data if fetch fails
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchTickerData()

    // Refresh every 30 seconds (respecting API rate limits)
    const interval = setInterval(fetchTickerData, CACHE_DURATION)

    return () => clearInterval(interval)
  }, [])

  return { tickerData, isLoading, error }
}

// Cache helper functions
function getCachedData(): TickerItem[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const { data, timestamp }: CachedData = JSON.parse(cached)
    const now = Date.now()

    // Check if cache is still valid (within 30 seconds)
    if (now - timestamp < CACHE_DURATION) {
      return data
    }

    // Cache expired
    return null
  } catch (err) {
    console.error('Error reading cache:', err)
    return null
  }
}

function setCachedData(data: TickerItem[]): void {
  try {
    const cacheData: CachedData = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (err) {
    console.error('Error saving to cache:', err)
  }
}

function formatPrice(price: string, symbol: string): string {
  const numPrice = parseFloat(price)

  // Format based on symbol
  if (symbol.includes('BTC')) {
    return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } else if (symbol.includes('ETH') || symbol.includes('XAU')) {
    return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } else if (symbol.includes('EUR') || symbol.includes('GBP')) {
    return `$${numPrice.toFixed(4)}`
  } else if (symbol === 'SPX') {
    return numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  } else {
    return `$${numPrice.toFixed(2)}`
  }
}

function getFallbackData(): TickerItem[] {
  return [
    { symbol: 'BTC/USD', displaySymbol: 'BTC/USD', price: '$43,250.00', change: '+2.34%', isPositive: true },
    { symbol: 'ETH/USD', displaySymbol: 'ETH/USD', price: '$2,280.50', change: '+1.82%', isPositive: true },
    { symbol: 'XAU/USD', displaySymbol: 'XAU/USD', price: '$2,045.30', change: '+0.45%', isPositive: true },
    { symbol: 'EUR/USD', displaySymbol: 'EUR/USD', price: '$1.0842', change: '-0.12%', isPositive: false },
    { symbol: 'GBP/USD', displaySymbol: 'GBP/USD', price: '$1.2654', change: '+0.28%', isPositive: true },
  ]
}
