import {
  useState,
  useEffect
} from "react"

import {
  Bell,
  Target,
  Plus,
  Menu
} from "lucide-react"

import api from "../services/api"

import NewLeadModal from "../components/NewLeadModal"
import GlobalSearch from "../components/GlobalSearch"
import NotificationDropdown from "../components/NotificationDropdown"

export default function Topbar({
  setSidebarOpen
}) {

  const [showModal,
    setShowModal] =
    useState(false)

  const [metaPercent,
    setMetaPercent] =
    useState(0)

  const [showNotifications,
    setShowNotifications] =
    useState(false)

  const [unreadCount,
    setUnreadCount] =
    useState(0)

  useEffect(() => {

  loadNotifications()
  loadMeta()

  const shouldOpenModal =
    localStorage.getItem("openNewLeadModal")

  if (shouldOpenModal === "true") {
    setShowModal(true)
    localStorage.removeItem("openNewLeadModal")
  }

  const interval =
  setInterval(() => {

    loadMeta()

  }, 60000)

  return () =>
    clearInterval(interval)

}, [])

  async function loadNotifications() {

  try {

    const response =
      await api.get(
        "/notifications"
      )

    const notifications =
      response.data

    const unread =
      notifications.filter(
        notification =>
          notification.read === false
      )

    setUnreadCount(
      unread.length
    )

  } catch (err) {

    console.log(err)

  }

}

  async function loadMeta() {

  try {

    const response =
      await api.get(
        "/checklist"
      )

    const total =
      response.data.length

    const percent =
      Math.min(
        Math.round(
          (total / 10) * 100
        ),
        100
      )

    setMetaPercent(percent)

  } catch (err) {

    console.log(err)

  }

}

  async function toggleNotifications() {

  const isOpening =
    !showNotifications

  setShowNotifications(
    isOpening
  )

  if (isOpening) {

    setUnreadCount(0)

  }

}

  return (
    <>
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 mb-8">

        <div className="flex flex-col xl:flex-row xl:items-center gap-5">

          {/* ESQUERDA */}
          <div className="flex items-center justify-between w-full xl:w-auto">

            <div className="flex items-center gap-4">

              <button
                onClick={() =>
                  setSidebarOpen(true)
                }
                className="lg:hidden bg-red-600 p-3 rounded-2xl"
              >

                <Menu
                  size={22}
                  className="text-white"
                />

              </button>

              <div>

                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  MotoLead Pro
                </h1>

                <p className="text-slate-400 text-sm mt-1">
                  CRM Yamaha Partners
                </p>

              </div>

            </div>

          </div>

          {/* BUSCA */}
          <div className="flex-1">
            <GlobalSearch />
          </div>

          {/* DIREITA */}
          <div className="flex items-center gap-3">

            <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl">

              <Target
                size={18}
                className="text-green-400"
              />

              <div>

                <p className="text-xs text-slate-400">
                  Meta
                </p>

                <p className="text-sm font-bold text-white">
                  {metaPercent}%
                </p>

              </div>

            </div>

            {/* NOVO LEAD */}
            <button
              onClick={() =>
                setShowModal(true)
              }
              className="bg-red-600 hover:bg-red-700 transition px-5 py-4 rounded-2xl flex items-center gap-2 font-bold text-white"
            >

              <Plus size={18} />

              <span className="hidden sm:block">
                Novo Lead
              </span>

            </button>

            {/* NOTIFICAÇÕES */}
            <div className="relative">

              <button
                onClick={
                  toggleNotifications
                }
                className="
                  relative
                  bg-slate-800
                  border
                  border-slate-700
                  hover:bg-slate-700
                  transition
                  p-4
                  rounded-2xl
                "
              >

                <Bell
                  size={20}
                  className="text-white"
                />

                {unreadCount > 0 && (

                  <div
                    className="
                      absolute
                      -top-2
                      -right-2
                      bg-red-600
                      text-white
                      text-xs
                      font-bold
                      min-w-[22px]
                      h-[22px]
                      rounded-full
                      flex
                      items-center
                      justify-center
                      border-2
                      border-slate-900
                    "
                  >

                    {unreadCount}

                  </div>

                )}

              </button>

              {showNotifications && (
                <NotificationDropdown />
              )}

            </div>

            {/* PERFIL */}
            <div className="hidden xl:flex items-center gap-3 bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl">

              <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white font-bold">
                W
              </div>

              <div>

                <p className="text-sm font-bold text-white">
                  Witsan Cunha
                </p>

                <p className="text-xs text-slate-400">
                  Yamaha Comercial
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      <NewLeadModal
        open={showModal}
        onClose={() =>
          setShowModal(false)
        }
        onSuccess={() => {
          window.location.reload()
        }}
      />
    </>
  )

}