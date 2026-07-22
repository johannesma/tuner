import { useCallback, useEffect, useRef, useState } from 'react'
import { frequencyToNote, type DetectedNote } from '../lib/notes'
import { createPitchDetector, createPitchSmoother } from './pitch'

export type TunerStatus = 'idle' | 'listening' | 'error'

export type TunerState = {
  status: TunerStatus
  error: string | null
  frequency: number | null
  note: DetectedNote | null
  cents: number | null
  clarity: boolean
  /** 0–1 mic input level for feedback */
  level: number
}

const INITIAL: TunerState = {
  status: 'idle',
  error: null,
  frequency: null,
  note: null,
  cents: null,
  clarity: false,
  level: 0,
}

const RMS_GATE = 0.0008
const MIN_HZ = 40
const MAX_HZ = 5000

function describeMicError(err: unknown): string {
  if (!(err instanceof Error)) {
    return 'Could not access the microphone.'
  }

  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    return 'Microphone permission was denied. Allow mic access and try again.'
  }

  if (err.name === 'NotFoundError') {
    return 'No microphone found. Plug one in and try again.'
  }

  if (err.name === 'SecurityError' || !window.isSecureContext) {
    return 'Microphone requires HTTPS (or localhost). Open the secure site URL.'
  }

  return err.message || 'Could not access the microphone.'
}

export function useTuner() {
  const [state, setState] = useState<TunerState>(INITIAL)
  const audioRef = useRef<{
    context: AudioContext
    stream: MediaStream
    analyser: AnalyserNode
    source: MediaStreamAudioSourceNode
    raf: number
  } | null>(null)

  const stop = useCallback(() => {
    const active = audioRef.current
    if (active) {
      cancelAnimationFrame(active.raf)
      active.source.disconnect()
      active.analyser.disconnect()
      active.stream.getTracks().forEach((track) => track.stop())
      void active.context.close()
      audioRef.current = null
    }

    setState((prev) => ({
      ...INITIAL,
      status: 'idle',
      error: prev.status === 'error' ? prev.error : null,
    }))
  }, [])

  const start = useCallback(async () => {
    if (!window.isSecureContext && location.hostname !== 'localhost') {
      setState({
        ...INITIAL,
        status: 'error',
        error:
          'Microphone requires HTTPS (or localhost). Open the secure site URL.',
      })
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setState({
        ...INITIAL,
        status: 'error',
        error: 'This browser does not support microphone access.',
      })
      return
    }

    stop()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      })

      const context = new AudioContext()
      await context.resume()

      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 4096
      analyser.smoothingTimeConstant = 0

      source.connect(analyser)

      const buffer = new Float32Array(analyser.fftSize)
      const detectPitch = createPitchDetector(context.sampleRate)
      const smooth = createPitchSmoother(3)

      audioRef.current = {
        context,
        stream,
        analyser,
        source,
        raf: 0,
      }

      setState({
        ...INITIAL,
        status: 'listening',
      })

      let lastUiAt = 0
      /** Pitch is ~45ms/call; ~10 Hz keeps the main thread responsive. */
      const UI_INTERVAL_MS = 100
      /** Keep last good reading on screen when mic level drops. */
      let held: {
        frequency: number
        note: ReturnType<typeof frequencyToNote>
        cents: number
      } | null = null

      const tick = () => {
        const active = audioRef.current
        if (!active) return

        const now = performance.now()
        if (now - lastUiAt < UI_INTERVAL_MS) {
          active.raf = requestAnimationFrame(tick)
          return
        }
        lastUiAt = now

        active.analyser.getFloatTimeDomainData(buffer)

        let sumSq = 0
        let peak = 0
        for (let i = 0; i < buffer.length; i++) {
          const sample = buffer[i] ?? 0
          sumSq += sample * sample
          const abs = Math.abs(sample)
          if (abs > peak) peak = abs
        }
        const rms = Math.sqrt(sumSq / buffer.length)
        const level = Math.min(1, Math.max(rms * 8, peak * 1.5))

        let frequency: number | null = null
        let note: ReturnType<typeof frequencyToNote> | null = null
        let cents: number | null = null
        let clarity = false

        if (rms >= RMS_GATE) {
          const raw = detectPitch(buffer)
          frequency = smooth(raw)

          if (frequency != null && frequency >= MIN_HZ && frequency <= MAX_HZ) {
            note = frequencyToNote(frequency)
            cents = note.cents
            clarity = Math.abs(note.cents) <= 50
            held = { frequency, note, cents }
          }
        }

        if (!note && held) {
          frequency = held.frequency
          note = held.note
          cents = held.cents
        }

        setState({
          status: 'listening',
          error: null,
          frequency: note ? frequency : null,
          note,
          cents: note ? cents : null,
          clarity,
          level,
        })

        active.raf = requestAnimationFrame(tick)
      }

      audioRef.current.raf = requestAnimationFrame(tick)
    } catch (err) {
      setState({
        ...INITIAL,
        status: 'error',
        error: describeMicError(err),
      })
    }
  }, [stop])

  useEffect(() => () => stop(), [stop])

  return {
    ...state,
    isListening: state.status === 'listening',
    start,
    stop,
  }
}
