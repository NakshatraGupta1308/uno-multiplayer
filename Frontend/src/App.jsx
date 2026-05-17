import { useState } from 'react'
import LobbyPage from './pages/LobbyPage'
import RoomPage from './pages/RoomPage'
import GamePage from './pages/GamePage'

function App() {
  const [page, setPage] = useState('lobby')
  const [roomId, setRoomId] = useState(null)
  const [playerId] = useState(() => crypto.randomUUID())
  const [playerName, setPlayerName] = useState('')

  const goToRoom = (rid, name) => {
    setRoomId(rid)
    setPlayerName(name)
    setPage('room')
  }

  const goToGame = () => setPage('game')
  const goToLobby = () => { setRoomId(null); setPage('lobby') }

  if (page === 'lobby') return <LobbyPage playerId={playerId} onJoinRoom={goToRoom} />
  if (page === 'room') return <RoomPage playerId={playerId} playerName={playerName} roomId={roomId} onGameStart={goToGame} onLeave={goToLobby} />
  if (page === 'game') return <GamePage playerId={playerId} roomId={roomId} onGameEnd={goToLobby} />
}

export default App