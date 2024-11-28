/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BINANCE_API_KEY: string
  readonly BINANCE_API_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
