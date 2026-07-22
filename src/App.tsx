import { useCallback, useEffect, useState } from 'react'
import { useTuner } from './audio/useTuner'
import { AlignTuner } from './components/AlignTuner'
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

      <button
        type="button"
        className={`listen-toggle ${tuner.isListening ? 'listen-toggle--active' : ''}`}
        onClick={toggleListening}
        aria-keyshortcuts="Space"
        title="Space"
      >
        {tuner.isListening ? 'Stop' : 'Start listening'}
        <span className="listen-toggle__hint">Space</span>
      </button>

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
