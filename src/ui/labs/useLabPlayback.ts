import { useEffect, useState } from 'react'

export function useLabPlayback(duration: number, frameIncrement = 1 / 30, stepIncrement = duration / 300) {
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setTime((current) => Math.min(duration, current + frameIncrement * speed))
    }, 1000 / 30)
    return () => window.clearInterval(timer)
  }, [duration, frameIncrement, playing, speed])

  useEffect(() => {
    if (time >= duration) setPlaying(false)
  }, [duration, time])

  return {
    time,
    playing,
    speed,
    setSpeed,
    scrub: (value: number) => {
      setPlaying(false)
      setTime(Math.max(0, Math.min(duration, value)))
    },
    playPause: () => {
      if (time >= duration) setTime(0)
      setPlaying((current) => !current)
    },
    step: () => {
      setPlaying(false)
      setTime((current) => Math.min(duration, current + stepIncrement))
    },
    reset: () => {
      setPlaying(false)
      setTime(0)
    },
  }
}
