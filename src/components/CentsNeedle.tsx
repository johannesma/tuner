type CentsNeedleProps = {
  cents: number | null
  inTune: boolean
}

const CLAMP = 50

export function CentsNeedle({ cents, inTune }: CentsNeedleProps) {
  const value = cents == null ? 0 : Math.max(-CLAMP, Math.min(CLAMP, cents))
  const angle = (value / CLAMP) * 45

  return (
    <div className="needle" aria-hidden="true">
      <div className="needle__arc">
        <div className="needle__marks">
          <span>-50</span>
          <span>0</span>
          <span>+50</span>
        </div>
        <div className="needle__zone" />
        <div
          className={`needle__pointer ${inTune ? 'needle__pointer--tune' : ''}`}
          style={{ transform: `rotate(${angle}deg)` }}
        />
        <div className="needle__hub" />
      </div>
    </div>
  )
}
