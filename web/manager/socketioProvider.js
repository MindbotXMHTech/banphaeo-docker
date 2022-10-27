import React from "react";
import { io } from 'socket.io-client'

export const SocketContext = React.createContext()

export default function SocketioProvider ({ children, uri, options }) {
  const [socketIo, setSocketIo] = React.useState()
  let bar = 0

  console.log("create socket at uri: " + uri)
  console.log("init : " + socketIo + ' ' + bar)

  React.useEffect(() => {
    console.log("log : " + socketIo + ' ' + bar)
    if (bar === 0) {
      console.log("set : " + socketIo + ' ' + bar)
      bar += 1

      const socket = io(uri, options);
      console.log("init socket")
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