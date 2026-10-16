import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL
const URL = API_URL?.startsWith('http') ? new URL(API_URL).origin : window.location.origin

export function useSocket(enabled = true) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!enabled) return undefined
    const token = document.cookie
      .split('; ')
      .find(c => c.startsWith('token='))
      ?.split('=')[1]
    const connection = io(URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })
    setSocket(connection)
    connection.on('connect', () => setConnected(true))
    connection.on('disconnect', () => setConnected(false))

    return () => {
      connection.disconnect()
    }
  }, [enabled])

  return { socket, connected }
}
