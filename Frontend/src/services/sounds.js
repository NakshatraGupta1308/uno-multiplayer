const AudioContext = window.AudioContext || window.webkitAudioContext

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    oscillator.type = type
    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch (e) {
    console.log('Audio not supported')
  }
}

export function playCardSound() {
  playTone(440, 0.1, 'sine', 0.2)
}

export function playDrawSound() {
  playTone(220, 0.15, 'sine', 0.2)
}

export function playUnoSound() {
  playTone(660, 0.1, 'sine', 0.3)
  setTimeout(() => playTone(880, 0.2, 'sine', 0.3), 100)
}

export function playWinSound() {
  playTone(523, 0.1, 'sine', 0.3)
  setTimeout(() => playTone(659, 0.1, 'sine', 0.3), 100)
  setTimeout(() => playTone(784, 0.1, 'sine', 0.3), 200)
  setTimeout(() => playTone(1047, 0.3, 'sine', 0.3), 300)
}

export function playInvalidSound() {
  playTone(150, 0.2, 'sawtooth', 0.2)
}