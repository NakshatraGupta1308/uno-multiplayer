import { useState, useEffect } from 'react'
import { connect, subscribe, send } from '../services/websocket'

export default function RoomPage({ playerId, playerName, roomId, onGameStart, onLeave }) {
  const [room, setRoom] = useState(null)

  useEffect(() => {
    connect(() => {
      subscribe(`/topic/room/${roomId}`, (data) => {
        setRoom(data)
        if (data.gameStarted) onGameStart()
      })
      setTimeout(() => send('/room.getState', { roomId }), 100)
    })
  }, [roomId])

  const handleStart = () => {
    send('/game.start', { roomId })
  }

  const isHost = room?.players?.[0]?.id === playerId

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>UNO Multiplayer</h1>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Room: {room?.name ?? roomId}</h2>
        <p style={styles.roomId}>Room Code: <strong>{roomId}</strong></p>

        <h3 style={styles.playersTitle}>Players ({room?.players?.length ?? 0}/4)</h3>
        <div style={styles.playerList}>
          {room?.players?.map((p, i) => (
            <div key={p.id} style={styles.playerRow}>
              <span style={styles.playerIcon}>🃏</span>
              <span style={styles.playerName}>{p.name}</span>
              {i === 0 && <span style={styles.hostBadge}>Host</span>}
              {p.id === playerId && <span style={styles.youBadge}>You</span>}
            </div>
          ))}
        </div>

        <div style={styles.actions}>
          {isHost ? (
            <button
              style={room?.players?.length >= 2 ? styles.btnStart : styles.btnDisabled}
              onClick={handleStart}
              disabled={!room || room.players.length < 2}
            >
              {room?.players?.length >= 2 ? 'Start Game' : 'Waiting for players...'}
            </button>
          ) : (
            <p style={styles.waiting}>Waiting for host to start the game...</p>
          )}
          <button style={styles.btnLeave} onClick={onLeave}>Leave Room</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: 600, margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' },
  title: { textAlign: 'center', fontSize: 36, color: '#e74c3c', marginBottom: 24 },
  subtitle: { fontSize: 22, marginBottom: 4, color: '#333' },
  roomId: { color: '#888', fontSize: 13, marginBottom: 20 },
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  playersTitle: { fontSize: 16, color: '#555', marginBottom: 12 },
  playerList: { marginBottom: 24 },
  playerRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #eee' },
  playerIcon: { fontSize: 20 },
  playerName: { flex: 1, fontWeight: 'bold' },
  hostBadge: { background: '#f39c12', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11 },
  youBadge: { background: '#3498db', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11 },
  actions: { display: 'flex', flexDirection: 'column', gap: 10 },
  btnStart: { padding: '12px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' },
  btnDisabled: { padding: '12px', background: '#bdc3c7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16 },
  btnLeave: { padding: '10px', background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  waiting: { color: '#888', fontStyle: 'italic', textAlign: 'center' },
}