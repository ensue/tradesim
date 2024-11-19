import { Chart } from './components/Chart'

function App() {
  return (
    <div className="flex h-screen w-full">
      <div className="w-3/4 border-r border-black">
        <Chart />
      </div>
      <div className="w-1/4 bg-white">
        {/* Controls will go here */}
      </div>
    </div>
  )
}

export default App
