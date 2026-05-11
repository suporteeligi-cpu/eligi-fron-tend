'use client'

import { useEffect } from 'react'

/**
 * Observes all `.reveal` elements and adds `.reveal-visible`
 * when they enter the viewport. Unobserves after triggering.
 */
export function useReveal(threshold = 0.15) {
  useEffect(() => {
    const elements = document.querySelectorAll<Element>('.reveal')
    if (!elements.length) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold }
    )

    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [threshold])
}