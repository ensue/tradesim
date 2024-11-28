import { fetchRandomCryptoHistory } from '../src/services/binanceService'
import fs from 'fs/promises'
import path from 'path'

async function generateSampleData() {
  const data = await fetchRandomCryptoHistory()
  const dataString = `export const sampleData = ${JSON.stringify(data, null, 2)}`
  await fs.writeFile(
    path.resolve(process.cwd(), 'src/data/sampleData.ts'),
    dataString
  )
}

generateSampleData() 