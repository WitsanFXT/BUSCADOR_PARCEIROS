import { useEffect, useState } from "react"
import axios from "axios"

export default function NotificationDropdown() {

  const [notifications,
    setNotifications] =
    useState([])

  useEffect(() => {

    loadNotifications()
    

  }, [])

  async function loadNotifications() {

    try {

      const { data } =
        await axios.get(
          "http://localhost:3001/notifications"
        )

      setNotifications(data)

    } catch (err) {

      console.log(err)

    }

  }


  return (

    <div className="absolute right-0 top-16 w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">

      <div className="p-4 border-b border-slate-800">

        <h2 className="font-bold text-white">
          Notificações
        </h2>

      </div>

      {notifications.length === 0 ? (

        <div className="p-4 text-slate-400">
          Nenhuma notificação
        </div>

      ) : (

        notifications.map((item) => (

          <div
            key={item.id}
            className={`p-4 border-b border-slate-800 hover:bg-slate-800 ${
              !item.read
                ? "bg-slate-800/50"
                : ""
            }`}
          >

            <h3 className="font-bold text-white">
              {item.title}
            </h3>

            <p className="text-slate-400 text-sm mt-1">
              {item.message}
            </p>

            <span className="text-xs text-slate-500 mt-2 block">

              {new Date(
                item.created_at
              ).toLocaleString("pt-BR")}

            </span>

          </div>

        ))

      )}

    </div>

  )

}