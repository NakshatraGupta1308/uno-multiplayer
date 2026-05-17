import { useState, useEffect } from 'react'
import { connect, subscribe, send } from '../services/websocket'

const COLOR_MAP = {
  RED: '#e74c3c',
  GREEN: '#2ecc71',
  BLUE: '#3498db',
  YELLOW: '#f1c40f',
  WILD: '#8e44ad',
}

function CardComponent({ card, onClick, disabled, small }) {
  const bg = COLOR_MAP[card.color] || '#8e44ad'
  const label = card.type === 'NUMBER'
    ? card.number
    : card.type === 'SKIP' ? '🚫'
    : card.type === 'REVERSE' ? '🔄'
    : card.type === 'DRAW_TWO' ? '+2'
    : card.type === 'WILD' ? '🌈'
    : card.type === 'WILD_DRAW_FOUR' ? '+4'
    : card.type

  return (
    <div
      onClick={disabled ? null : onClick}
      style={{
        width: small ? 50 : 70,
        height: small ? 75 : 105,
        background: bg,
        borderRadius: 8,
        border: '3px solid white',
        boxShadow: disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: small ? 14 : 20,
        fontWeight: 'bold',
        color: 'white',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'transform 0.1s',
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-8px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {label}
    </div>
  )
}

function ColorPicker({ onPick }) {
  return (
    <div style={styles.colorPicker}>
      <p style={{ margin: '0 0 12px', fontWeight: 'bold' }}>Choose a color:</p>
      <div style={{ display: 'flex', gap: 12 }}>
        {['RED', 'GREEN', 'BLUE', 'YELLOW'].map(c => (
          <div
            key={c}
            onClick={() => onPick(c)}
            style={{
              width: 48, height: 48,
              background: COLOR_MAP[c],
              borderRadius: '50%',
              cursor: 'pointer',
              border: '3px solid white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function GamePage({ playerId, roomId, onGameEnd }) {
  const [state, setGameState] = useState(null)
  const [pendingCard, setPendingCard] = useState(null)
  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
  connect(() => {
    subscribe(`/topic/game/${roomId}`, (data) => {
      setGameState(data)
      if (data.gameOver) setTimeout(onGameEnd, 3000)
    })
    setTimeout(() => send('/game.getState', { roomId }), 100)
  })
}, [roomId])

  const myPlayer = state?.players?.find(p => p.id === playerId)
  const isMyTurn = state?.players?.[state.currentPlayerIndex]?.id === playerId
  const topCard = state?.discardPile?.[state.discardPile.length - 1]

  const handlePlayCard = (card) => {
    if (!isMyTurn) return
    if (card.color === 'WILD') {
      setPendingCard(card)
      setShowColorPicker(true)
    } else {
      send('/game.playCard', { roomId, playerId, cardId: card.id, chosenColor: null })
    }
  }

  const handleColorPick = (color) => {
    send('/game.playCard', { roomId, playerId, cardId: pendingCard.id, chosenColor: color })
    setShowColorPicker(false)
    setPendingCard(null)
  }

  const handleDraw = () => {
    if (!isMyTurn) return
    send('/game.drawCard', { roomId, playerId })
  }

  if (!state) return (
    <div style={styles.center}>
      <p>Starting game...</p>
    </div>
  )

  if (state.gameOver) return (
    <div style={styles.center}>
      <h1 style={{ color: '#e74c3c' }}>Game Over!</h1>
      <p>{state.winnerId === playerId ? '🎉 You won!' : 'Better luck next time!'}</p>
      <p style={{ color: '#888' }}>Returning to lobby...</p>
    </div>
  )

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>UNO</h2>
        <div style={styles.turnBadge}>
          {isMyTurn ? '🟢 Your Turn' : `⏳ ${state.players[state.currentPlayerIndex]?.name}'s turn`}
        </div>
        <div style={{ color: '#fff', fontSize: 13 }}>
          Color: <strong style={{ color: COLOR_MAP[state.currentColor] }}>{state.currentColor}</strong>
        </div>
      </div>

      {/* Other players */}
      <div style={styles.otherPlayers}>
        {state.players.filter(p => p.id !== playerId).map(p => (
          <div key={p.id} style={styles.otherPlayer}>
            <span style={styles.otherName}>{p.name}</span>
            <span style={styles.cardCount}>{p.hand.length} cards</span>
          </div>
        ))}
      </div>

      {/* Play area */}
      <div style={styles.playArea}>
        {/* Draw pile */}
        <div style={styles.drawPile} onClick={handleDraw}>
          <div style={styles.deckCard}>🂠</div>
          <p style={styles.pileLabel}>Draw</p>
        </div>

        {/* Top card */}
        {topCard && (
          <div>
            <CardComponent card={topCard} disabled />
            <p style={styles.pileLabel}>Top Card</p>
          </div>
        )}
      </div>

      {/* Color picker */}
      {showColorPicker && <ColorPicker onPick={handleColorPick} />}

      {/* My hand */}
      <div style={styles.handSection}>
        <p style={styles.handLabel}>Your Hand ({myPlayer?.hand?.length} cards)</p>
        <div style={styles.hand}>
          {myPlayer?.hand?.map(card => (
            <CardComponent
              key={card.id}
              card={card}
              onClick={() => handlePlayCard(card)}
              disabled={!isMyTurn}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#1a6b3c', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(0,0,0,0.3)' },
  title: { color: '#fff', margin: 0, fontSize: 24 },
  turnBadge: { background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 14 },
  otherPlayers: { display: 'flex', justifyContent: 'center', gap: 20, padding: '16px 24px' },
  otherPlayer: { background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  otherName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cardCount: { color: '#aed6f1', fontSize: 12 },
  playArea: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, flex: 1, padding: 24 },
  drawPile: { display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' },
  deckCard: { width: 70, height: 105, background: '#2c3e50', borderRadius: 8, border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'white' },
  pileLabel: { color: '#fff', textAlign: 'center', margin: '8px 0 0', fontSize: 12 },
  colorPicker: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 100 },
  handSection: { background: 'rgba(0,0,0,0.3)', padding: '16px 24px' },
  handLabel: { color: '#fff', margin: '0 0 12px', fontSize: 14 },
  hand: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 },
}