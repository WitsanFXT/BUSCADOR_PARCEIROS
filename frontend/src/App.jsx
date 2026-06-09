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
import Referrals from "./pages/Referrals"
import SalesFunnel from "./pages/SalesFunnel"
import AIConversion from "./pages/AIConversion"
import AIRecommendations from "./pages/AIRecommendations"
import FollowupIntelligence from "./pages/FollowupIntelligence"
import LeadRecovery from "./pages/LeadRecovery"
import AIAssistant from "./pages/AIAssistant"

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
            path="/assistente-ia"
            element={<AIAssistant />}
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
            path="/ia-prioridades"
            element={<AIRecommendations />}
          />

          <Route
            path="/recuperacao-leads"
            element={<LeadRecovery />}
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

          <Route
            path="/funil"
            element={<SalesFunnel />}
          />

          <Route
            path="/indicacoes"
            element={<Referrals />}
          />

          <Route
            path="/ia-conversao"
            element={<AIConversion />}
          />

          <Route
            path="/followup-ia"
            element={<FollowupIntelligence />}
          />

        </Routes>

      </MainLayout>

    </BrowserRouter>
  )
}

export default App