import { useCallback, useEffect, useState } from 'react'
import { useTuner } from './audio/useTuner'
import { AlignTuner } from './components/AlignTuner'
import { SpiritualStars } from './components/SpiritualStars'
import { TunerDisplay } from './components/TunerDisplay'
import './App.css'

type TunerMode = 'traditional' | 'spiritual'

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT')
  )
}

async function toggleFullscreen() {
  const root = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void
  }
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null
    webkitExitFullscreen?: () => Promise<void> | void
  }

  const active = document.fullscreenElement ?? doc.webkitFullscreenElement
  if (active) {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
    } else {
      await doc.webkitExitFullscreen?.()
    }
    return
  }

  if (root.requestFullscreen) {
    await root.requestFullscreen()
  } else {
    await root.webkitRequestFullscreen?.()
  }
}

function App() {
  const tuner = useTuner()
  const [mode, setMode] = useState<TunerMode>('traditional')

  const isSpiritual = mode === 'spiritual'

  const toggleListening = useCallback(() => {
    if (tuner.isListening) {
      tuner.stop()
    } else {
      void tuner.start()
    }
  }, [tuner.isListening, tuner.start, tuner.stop])

  useEffect(() => {
    document.body.classList.toggle('body--spiritual', isSpiritual)
    return () => document.body.classList.remove('body--spiritual')
  }, [isSpiritual])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isTypingTarget(event.target)) return

      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault()
        toggleListening()
        return
      }

      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault()
        void toggleFullscreen().catch(() => {
          /* user denied or unsupported */
        })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleListening])

  return (
    <div className={`app ${isSpiritual ? 'app--spiritual' : ''}`}>
      {isSpiritual && (
        <>
          <SpiritualStars />
          <div className="spiritual-grain" aria-hidden="true" />
          {tuner.isListening && (
            <div
              className="spiritual-level"
              role="meter"
              aria-label="Microphone level"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(tuner.level * 100)}
            >
              <div
                className="spiritual-level__fill"
                style={{ transform: `scaleX(${Math.min(1, tuner.level)})` }}
              />
            </div>
          )}
        </>
      )}

      {!isSpiritual && (
        <header className="app__header">
          <p className="app__brand">Tuner</p>
          <p className="app__lede">
            Any note · A4 = 440 Hz · tells you when you&apos;re in tune
          </p>
        </header>
      )}

      <main className="app__main">
        {isSpiritual ? (
          <AlignTuner
            note={tuner.note}
            cents={tuner.cents}
            isListening={tuner.isListening}
          />
        ) : (
          <TunerDisplay
            note={tuner.note}
            frequency={tuner.frequency}
            cents={tuner.cents}
            isListening={tuner.isListening}
            level={tuner.level}
          />
        )}

        {tuner.error && (
          <p className="app__error" role="alert">
            {tuner.error}
          </p>
        )}
      </main>

      {tuner.isListening ? (
        <button
          type="button"
          className="listen-icon listen-icon--mute"
          onClick={toggleListening}
          aria-keyshortcuts="Space"
          aria-label="Mute microphone"
          title="Space"
        >
          <svg
            className="listen-icon__glyph"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
            <path d="M4 4l16 16" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          className="listen-icon listen-icon--mic"
          onClick={toggleListening}
          aria-keyshortcuts="Space"
          aria-label="Start listening"
          title="Space"
        >
          <svg
            className="listen-icon__glyph"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
          </svg>
        </button>
      )}

      <button
        type="button"
        className="mode-toggle"
        onClick={() =>
          setMode((prev) => (prev === 'traditional' ? 'spiritual' : 'traditional'))
        }
        aria-label={
          isSpiritual ? 'Switch to traditional tuner' : 'Switch to spiritual tuner'
        }
      >
        {isSpiritual ? 'Traditional Mode' : 'Spiritual Mode'}
      </button>
    </div>
  )
}

export default App
