import {
  useState
} from "react"

import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function MainLayout({
  children
}) {

  const [sidebarOpen, setSidebarOpen] =
    useState(false)

  return (
    <div className="bg-slate-950 min-h-screen">

      {/* SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* CONTEÚDO */}
      <main
        className="
          lg:ml-72
          min-h-screen
          p-4
          sm:p-6
          lg:p-8
        "
      >

        <Topbar
          setSidebarOpen={setSidebarOpen}
        />

        <div className="w-full overflow-hidden">
          {children}
        </div>

      </main>

    </div>
  )
}