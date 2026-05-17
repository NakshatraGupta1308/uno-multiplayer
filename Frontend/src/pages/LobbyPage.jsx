import { useState, useEffect } from 'react'
import { connect, subscribe, send, disconnect } from '../services/websocket'

export default function LobbyPage({ playerId, onJoinRoom }) {
  const [rooms, setRooms] = useState([])
  const [playerName, setPlayerName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    connect(() => {
      setConnected(true)
      subscribe('/topic/lobby', (data) => setRooms(data))
      send('/lobby.getRooms', {})
    })
    return () => disconnect()
  }, [])

  const handleCreate = () => {
    if (!playerName.trim() || !roomName.trim()) return
    subscribe('/topic/lobby', (updatedRooms) => {
      const myRoom = updatedRooms.find(r =>
        r.players.some(p => p.id === playerId)
      )
      if (myRoom) {
        subscribe(`/topic/room/${myRoom.id}`, () => {})
        onJoinRoom(myRoom.id, playerName)
      }
    })
    send('/lobby.createRoom', { roomName, playerId, playerName })
  }

  const handleJoin = (roomId) => {
    if (!playerName.trim()) return
    subscribe(`/topic/room/${roomId}`, (room) => {
      onJoinRoom(room.id, playerName)
    })
    send('/lobby.joinRoom', { roomId, playerId, playerName })
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>UNO Multiplayer</h1>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Join or Create a Game</h2>
        <input
          style={styles.input}
          placeholder="Your name"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
        />
        <div style={styles.row}>
          <input
            style={styles.input}
            placeholder="Room name"
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
          />
          <button style={styles.btnPrimary} onClick={handleCreate} disabled={!connected}>
            Create Room
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Available Rooms</h2>
        {rooms.length === 0 && <p style={styles.empty}>No rooms available. Create one!</p>}
        {rooms.map(room => (
          <div key={room.id} style={styles.roomRow}>
            <span style={styles.roomName}>{room.name}</span>
            <span style={styles.roomPlayers}>{room.players.length}/4 players</span>
            <button style={styles.btnSecondary} onClick={() => handleJoin(room.id)} disabled={!connected || !playerName.trim()}>
              Join
            </button>
          </div>
        ))}
      </div>

      <div style={styles.status}>
        {connected ? '🟢 Connected' : '🔴 Connecting...'}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: 600, margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' },
  title: { textAlign: 'center', fontSize: 36, color: '#e74c3c', marginBottom: 24 },
  subtitle: { fontSize: 18, marginBottom: 16, color: '#333' },
  card: { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, marginBottom: 12, width: '100%', boxSizing: 'border-box' },
  row: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  btnPrimary: { padding: '10px 20px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' },
  btnSecondary: { padding: '8px 16px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  roomRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #eee' },
  roomName: { flex: 1, fontWeight: 'bold' },
  roomPlayers: { color: '#888', fontSize: 13 },
  empty: { color: '#aaa', fontStyle: 'italic' },
  status: { textAlign: 'center', fontSize: 13, color: '#888' },
}