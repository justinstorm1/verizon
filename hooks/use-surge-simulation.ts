"use client"

import { useCallback, useEffect, useState } from "react"

import { DEMO } from "@/lib/config"
import { advanceDemo, initialDemoState, startSurge } from "@/lib/simulate"

/** Drives the live demo: ticks the pure simulation engine on an interval. */
export function useSurgeSimulation() {
  const [state, setState] = useState(initialDemoState)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => setState(advanceDemo), DEMO.tickMs)
    return () => window.clearInterval(id)
  }, [paused])

  const start = useCallback(() => {
    setPaused(false)
    setState(startSurge)
  }, [])
  const reset = useCallback(() => {
    setPaused(false)
    setState(initialDemoState())
  }, [])
  const togglePause = useCallback(() => setPaused((p) => !p), [])

  return { state, paused, start, reset, togglePause }
}
