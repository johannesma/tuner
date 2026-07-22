import { useTuner } from './audio/useTuner'
import { TunerDisplay } from './components/TunerDisplay'
import { GUITAR_STRINGS } from './lib/notes'
import './App.css'

function App() {
  const tuner = useTuner()

  return (
    <div className="app">
      <header className="app__header">
        <p className="app__brand">Tuner</p>
        <h1 className="app__title">Browser guitar tuner</h1>
        <p className="app__lede">
          Standard EADGBE · A4 = 440 Hz · works offline after load
        </p>
      </header>

      <main className="app__main">
        <TunerDisplay
          note={tuner.note}
          frequency={tuner.frequency}
          cents={tuner.cents}
          stringName={tuner.stringName}
          isListening={tuner.isListening}
        />

        {tuner.error && (
          <p className="app__error" role="alert">
            {tuner.error}
          </p>
        )}

        <div className="app__actions">
          {tuner.isListening ? (
            <button type="button" className="btn btn--ghost" onClick={tuner.stop}>
              Stop
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => void tuner.start()}>
              Start listening
            </button>
          )}
        </div>

        <ul className="app__strings" aria-label="Standard guitar tuning">
          {GUITAR_STRINGS.map((string) => (
            <li key={string.name}>
              <span>{string.name}</span>
              <span>{string.frequency.toFixed(2)} Hz</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

export default App
