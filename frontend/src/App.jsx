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
import Checklist from "./pages/Checklist"
import Radar from "./pages/Radar"
import Agenda from "./pages/Agenda"
import Missions from "./pages/Missions"
import ContentCenter from "./pages/ContentCenter"

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

          <Route
            path="/checklist"
            element={<Checklist />}
          />

          <Route
            path="/radar"
            element={<Radar />}
          />

          <Route
            path="/agenda"
            element={<Agenda />}
          />

          <Route
            path="/missoes"
            element={<Missions />}
          />

          <Route
            path="/conteudo"
            element={<ContentCenter />}
          />

        </Routes>

      </MainLayout>

    </BrowserRouter>
  )
}

export default App