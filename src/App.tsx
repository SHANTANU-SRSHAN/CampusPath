import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RouteProvider } from './context/RouteContext'
import { AlgorithmPage } from './pages/AlgorithmPage'
import { HomePage } from './pages/HomePage'
import { MapPage } from './pages/MapPage'
import { PathFinderPage } from './pages/PathFinderPage'

function App() {
  return (
    <BrowserRouter>
      <RouteProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="find-path" element={<PathFinderPage />} />
            <Route path="algorithm" element={<AlgorithmPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </RouteProvider>
    </BrowserRouter>
  )
}

export default App
