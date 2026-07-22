import { useCallback, useEffect, useRef, useState } from 'react'
import {
  closestGuitarString,
  centsFromTarget,
  frequencyToNote,
  type DetectedNote,
} from '../lib/notes'
import { createPitchDetector, createPitchSmoother } from './pitch'

export type TunerStatus = 'idle' | 'listening' | 'error'

export type TunerState = {
  status: TunerStatus
  error: string | null
  frequency: number | null
  note: DetectedNote | null
  cents: number | null
  stringName: string | null
  clarity: boolean
}

const INITIAL: TunerState = {
  status: 'idle',
  error: null,
  frequency: null,
  note: null,
  cents: null,
  stringName: null,
  clarity: false,
}

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
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      const context = new AudioContext()
      await context.resume()

      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0
      source.connect(analyser)

      const buffer = new Float32Array(analyser.fftSize)
      const detectPitch = createPitchDetector(context.sampleRate)
      const smooth = createPitchSmoother(5)

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

      const tick = () => {
        const active = audioRef.current
        if (!active) return

        active.analyser.getFloatTimeDomainData(buffer)

        // Silence gate: skip very quiet frames
        let rms = 0
        for (let i = 0; i < buffer.length; i++) {
          const sample = buffer[i] ?? 0
          rms += sample * sample
        }
        rms = Math.sqrt(rms / buffer.length)

        if (rms < 0.01) {
          setState((prev) => ({
            ...prev,
            frequency: null,
            note: null,
            cents: null,
            stringName: null,
            clarity: false,
          }))
        } else {
          const raw = detectPitch(buffer)
          const frequency = smooth(raw)

          if (frequency != null && frequency >= 60 && frequency <= 1200) {
            const note = frequencyToNote(frequency)
            const string = closestGuitarString(frequency)
            const cents = centsFromTarget(frequency, string.frequency)

            setState({
              status: 'listening',
              error: null,
              frequency,
              note,
              cents,
              stringName: string.name,
              clarity: Math.abs(cents) <= 50,
            })
          }
        }

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
