import { useState, useEffect } from 'react'
import { connect, subscribe, send } from '../services/websocket'
import { playCardSound, playDrawSound, playUnoSound, playWinSound, playInvalidSound } from '../services/sounds'

const COLOR_MAP = {
  RED: '#e74c3c',
  GREEN: '#2ecc71',
  BLUE: '#3498db',
  YELLOW: '#f1c40f',
  WILD: '#8e44ad',
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

function CardComponent({ card, onClick, disabled, invalid, width, animate }) {
  const bg = invalid ? '#c0392b' : (COLOR_MAP[card.color] || '#8e44ad')
  const cardWidth = width || 70
  const cardHeight = Math.floor(cardWidth * 1.5)
  const label = card.type === 'NUMBER' ? card.number
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
        width: cardWidth,
        height: cardHeight,
        background: bg,
        borderRadius: 6,
        border: invalid ? '3px solid #e74c3c' : '3px solid white',
        boxShadow: invalid ? '0 0 12px rgba(231,76,60,0.8)' : disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.max(10, cardWidth * 0.28),
        fontWeight: 'bold',
        color: 'white',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'transform 0.1s, background 0.1s',
        flexShrink: 0,
        transform: invalid ? 'translateY(-8px)' : 'none',
        animation: animate ? 'cardPop 0.3s ease-out' : 'cardSlideIn 0.2s ease-out',
      }}
      onMouseEnter={e => { if (!disabled && !invalid) e.currentTarget.style.transform = 'translateY(-8px)' }}
      onMouseLeave={e => { if (!invalid) e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {label}
    </div>
  )
}

export default function GamePage({ playerId, roomId, onGameEnd }) {
  const [state, setGameState] = useState(null)
  const [pendingCard, setPendingCard] = useState(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [unoAnnouncement, setUnoAnnouncement] = useState(null)
  const [gameLog, setGameLog] = useState([])
  const [invalidCard, setInvalidCard] = useState(null)

  const isMobile = window.innerWidth < 600

  useEffect(() => {
    connect(() => {
      subscribe(`/topic/game/${roomId}`, (data) => {
        setGameState(prev => {
          const unoPlayer = data.players.find(p => p.saidUno)
          const prevUnoPlayer = prev?.players?.find(p => p.saidUno)
          if (unoPlayer && unoPlayer.id !== prevUnoPlayer?.id) {
            setUnoAnnouncement(unoPlayer.name)
            setTimeout(() => setUnoAnnouncement(null), 2000)
          }

          if (prev) {
            const prevPlayer = prev.players[prev.currentPlayerIndex]
            const currPlayer = data.players[prev.currentPlayerIndex]
            if (prevPlayer && currPlayer) {
              const prevCardCount = prevPlayer.hand.length
              const currCardCount = currPlayer.hand.length
              const topCard = data.discardPile[data.discardPile.length - 1]
              const prevTop = prev.discardPile[prev.discardPile.length - 1]

              if (currCardCount < prevCardCount && topCard?.id !== prevTop?.id) {
                const cardLabel = topCard.type === 'NUMBER'
                  ? `${topCard.color} ${topCard.number}`
                  : topCard.type === 'SKIP' ? `${topCard.color} Skip`
                  : topCard.type === 'REVERSE' ? `${topCard.color} Reverse`
                  : topCard.type === 'DRAW_TWO' ? `${topCard.color} +2`
                  : topCard.type === 'WILD' ? 'Wild'
                  : topCard.type === 'WILD_DRAW_FOUR' ? 'Wild +4'
                  : `${topCard.color} ${topCard.type}`
                setGameLog(log => [`${prevPlayer.name} played ${cardLabel}`, ...log].slice(0, 8))
              } else if (currCardCount > prevCardCount) {
                setGameLog(log => [`${prevPlayer.name} drew a card`, ...log].slice(0, 8))
              }
            }
          }
          return data
        })

        if (data.gameOver) {
          const winner = data.players.find(p => p.id === data.winnerId)
          setGameLog(log => [`🏆 ${winner?.name} won the game!`, ...log])
          playWinSound()
          setTimeout(onGameEnd, 5000)
        }
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
      playCardSound()
    } else {
      const top = state.discardPile[state.discardPile.length - 1]
      const valid = card.color === 'WILD'
        || card.color === state.currentColor
        || (card.type === 'NUMBER' && card.number === top.number)
        || (card.type !== 'NUMBER' && card.type === top.type)
      if (!valid) {
        setInvalidCard(card.id)
        playInvalidSound()
        setTimeout(() => setInvalidCard(null), 600)
        return
      }
      send('/game.playCard', { roomId, playerId, cardId: card.id, chosenColor: null })
      playCardSound()
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
    playDrawSound()
  }

  if (!state) return (
    <div style={styles.center}>
      <p>Starting game...</p>
    </div>
  )

  if (state.gameOver) {
    const winner = state.players.find(p => p.id === state.winnerId)
    const iWon = state.winnerId === playerId
    return (
      <div style={styles.winScreen}>
        <div style={styles.winCard}>
          <div style={styles.winEmoji}>{iWon ? '🏆' : '😔'}</div>
          <h1 style={{ ...styles.winTitle, color: iWon ? '#f1c40f' : '#e74c3c' }}>
            {iWon ? 'You Won!' : 'You Lost!'}
          </h1>
          <p style={styles.winSubtitle}>
            {iWon ? 'Congratulations!' : `${winner?.name} won this round`}
          </p>
          <div style={styles.winLog}>
            {gameLog.map((entry, i) => (
              <div key={i} style={{ ...styles.logEntry, opacity: 1 - i * 0.1 }}>
                {entry}
              </div>
            ))}
          </div>
          <p style={styles.winRedirect}>Returning to lobby in 5 seconds...</p>
        </div>
      </div>
    )
  }

  const cardCount = myPlayer?.hand?.length || 1
  const cardWidth = Math.min(70, Math.floor((window.innerWidth - 48) / cardCount) - 4)

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
            {p.saidUno && <span style={styles.unoBadge}>UNO!</span>}
          </div>
        ))}
      </div>

      {/* Game Log -- hidden on mobile */}
      {gameLog.length > 0 && !isMobile && (
        <div style={styles.gameLog}>
          {gameLog.map((entry, i) => (
            <div key={i} style={{ ...styles.logEntry, opacity: 1 - i * 0.1, fontSize: 12 }}>
              {entry}
            </div>
          ))}
        </div>
      )}

      {/* Play area */}
      <div style={styles.playArea}>
        <div style={styles.drawPile} onClick={handleDraw}>
          <div style={styles.deckCard}>🂠</div>
          <p style={styles.pileLabel}>Draw</p>
        </div>
        {topCard && (
          <div key={topCard.id}>
            <CardComponent card={topCard} disabled width={70} animate />
            <p style={styles.pileLabel}>Top Card</p>
          </div>
        )}
      </div>

      {/* Color picker */}
      {showColorPicker && <ColorPicker onPick={handleColorPick} />}

      {/* UNO announcement overlay */}
      {unoAnnouncement && (
        <div style={styles.unoAnnouncement}>
          🃏 {unoAnnouncement} says UNO!
        </div>
      )}

      {/* UNO Button */}
      {myPlayer?.hand?.length === 1 && !state.gameOver && (
        <div style={styles.unoSection}>
          <button
            style={styles.unoBtn}
            onClick={() => {
              send('/game.sayUno', { roomId, playerId })
              playUnoSound()
            }}
          >
            🃏 UNO!
          </button>
        </div>
      )}

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
              invalid={invalidCard === card.id}
              width={cardWidth}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#1a6b3c', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', overflowX: 'hidden', maxWidth: '100vw' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.3)' },
  title: { color: '#fff', margin: 0, fontSize: 20 },
  turnBadge: { background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 12 },
  otherPlayers: { display: 'flex', justifyContent: 'center', gap: 12, padding: '8px 16px' },
  otherPlayer: { background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '8px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  otherName: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  cardCount: { color: '#aed6f1', fontSize: 11 },
  unoBadge: { background: '#e74c3c', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 'bold' },
  gameLog: { position: 'fixed', right: 8, top: 60, background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: '8px 12px', width: 220, maxHeight: 200, overflow: 'hidden' },
  logEntry: { color: '#fff', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  playArea: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, flex: 1, padding: 16 },
  drawPile: { display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' },
  deckCard: { width: 70, height: 105, background: '#2c3e50', borderRadius: 8, border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'white' },
  pileLabel: { color: '#fff', textAlign: 'center', margin: '8px 0 0', fontSize: 12 },
  colorPicker: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 100 },
  unoAnnouncement: { position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', background: '#e74c3c', color: '#fff', fontSize: 36, fontWeight: 'bold', padding: '24px 48px', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 200, letterSpacing: 2 },
  handSection: { background: 'rgba(0,0,0,0.3)', padding: '12px 16px' },
  handLabel: { color: '#fff', margin: '0 0 8px', fontSize: 13 },
  hand: { display: 'flex', gap: 4, flexWrap: 'nowrap', justifyContent: 'center', paddingBottom: 8 },
  unoSection: { display: 'flex', justifyContent: 'center', padding: '8px 0' },
  unoBtn: { padding: '12px 40px', background: '#e74c3c', color: '#fff', border: '4px solid #fff', borderRadius: 50, fontSize: 22, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', letterSpacing: 2 },
  winScreen: { minHeight: '100vh', background: '#1a6b3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' },
  winCard: { background: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: '48px 64px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 300 },
  winEmoji: { fontSize: 80, marginBottom: 16 },
  winTitle: { fontSize: 48, fontWeight: 'bold', margin: '0 0 8px' },
  winSubtitle: { color: '#aaa', fontSize: 18, margin: '0 0 24px' },
  winLog: { background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, maxHeight: 200, overflow: 'hidden' },
  winRedirect: { color: '#888', fontSize: 13 },
}