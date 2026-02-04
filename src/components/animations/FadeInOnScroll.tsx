'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface FadeInOnScrollProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export default function FadeInOnScroll({ children, className, delay = 0 }: FadeInOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'motion-safe:translate-y-6 motion-safe:opacity-0',
        className,
      )}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
