import React from "react";
import { io } from 'socket.io-client'

export const SocketContext = React.createContext()

export default function SocketioProvider ({ children, uri, options }) {
  const [socketIo, setSocketIo] = React.useState()
  let bar = 0

  React.useEffect(() => {
    if (bar === 0) {
      bar += 1

      const socket = io(uri, options);
      socket.on("connect", () => { console.log("Connected:", socket.id) });
      socket.on("response", () => { console.log("Response:", socket.id) });
      socket.on("message", data => { console.log("Message:", data) });
      setSocketIo(socket)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
      <SocketContext.Provider value={socketIo}>
          {children}
      </SocketContext.Provider>
  )
}