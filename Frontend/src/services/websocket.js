import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

let client = null
const subscriptions = {}

export function connect(onConnected) {
  client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    onConnect: () => {
      console.log('WebSocket connected')
      onConnected()
    },
    onDisconnect: () => console.log('WebSocket disconnected'),
    onStompError: (frame) => console.error('STOMP error', frame),
  })
  client.activate()
}

export function disconnect() {
  if (client) client.deactivate()
}

export function subscribe(destination, callback) {
  if (!client) return
  const sub = client.subscribe(destination, (message) => {
    callback(JSON.parse(message.body))
  })
  subscriptions[destination] = sub
  return sub
}

export function unsubscribe(destination) {
  if (subscriptions[destination]) {
    subscriptions[destination].unsubscribe()
    delete subscriptions[destination]
  }
}

export function send(destination, body) {
  if (!client) return
  client.publish({
    destination: `/app${destination}`,
    body: JSON.stringify(body),
  })
}