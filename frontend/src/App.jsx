import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom"

import MainLayout from "./layouts/MainLayout"

import Dashboard from "./pages/Dashboard"
import SearchPartners from "./pages/SearchPartners"
import CRM from "./pages/CRM"
import Automation from "./pages/Automation"

function App() {

  return (
    <BrowserRouter>

      <MainLayout>

        <Routes>

          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/buscar"
            element={<SearchPartners />}
          />

          <Route
            path="/crm"
            element={<CRM />}
          />

          <Route
            path="/automacao"
            element={<Automation />}
          />

        </Routes>

      </MainLayout>

    </BrowserRouter>
  )
}

export default App