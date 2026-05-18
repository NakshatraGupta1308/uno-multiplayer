import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

let client = null
let connected = false
let pendingCallbacks = []

export function connect(onConnected) {
  if (connected) {
    onConnected()
    return
  }

  if (client) {
    pendingCallbacks.push(onConnected)
    return
  }

  pendingCallbacks.push(onConnected)

  client = new Client({
    webSocketFactory: () => new SockJS('https://uno-multiplayer-backend.onrender.com/ws'),
    onConnect: () => {
      console.log('WebSocket connected')
      connected = true
      pendingCallbacks.forEach(cb => cb())
      pendingCallbacks = []
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected')
      connected = false
      client = null
    },
    onStompError: (frame) => console.error('STOMP error', frame),
    reconnectDelay: 5000,
  })

  client.activate()
}

export function disconnect() {
  // no-op: keep connection alive across pages
}

export function subscribe(destination, callback) {
  if (!client || !connected) return
  const sub = client.subscribe(destination, (message) => {
    callback(JSON.parse(message.body))
  })
  return sub
}

export function send(destination, body) {
  if (!client || !connected) return
  client.publish({
    destination: `/app${destination}`,
    body: JSON.stringify(body),
  })
}