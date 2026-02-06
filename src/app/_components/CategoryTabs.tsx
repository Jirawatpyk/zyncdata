'use client'

import { useRef, useState } from 'react'
import { Building2, Lightbulb, Gamepad2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabDefinition {
  key: string
  label: string
}

interface CategoryTabsProps {
  tabs: TabDefinition[]
  children: Record<string, React.ReactNode>
}

const ICON_MAP: Record<string, LucideIcon> = {
  dxt_smart_platform: Building2,
  dxt_solutions: Lightbulb,
  dxt_game: Gamepad2,
}

export default function CategoryTabs({ tabs, children }: CategoryTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? '')
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  if (tabs.length === 0) return null

  function focusTab(key: string) {
    setActiveTab(key)
    tabRefs.current.get(key)?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent, tabIndex: number) {
    let newIndex = tabIndex
    switch (e.key) {
      case 'ArrowRight':
        newIndex = (tabIndex + 1) % tabs.length
        break
      case 'ArrowLeft':
        newIndex = (tabIndex - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        newIndex = 0
        break
      case 'End':
        newIndex = tabs.length - 1
        break
      default:
        return
    }
    e.preventDefault()
    focusTab(tabs[newIndex].key)
  }

  return (
    <div>
      {/* Tab bar */}
      <div
        className="mb-8 flex justify-center gap-8 border-b border-gray-200"
        role="tablist"
        aria-label="System categories"
      >
        {tabs.map((tab, index) => {
          const Icon = ICON_MAP[tab.key]
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.key, el)
                else tabRefs.current.delete(tab.key)
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.key}`}
              id={`tab-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.key)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'flex cursor-pointer items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'border-dxt-primary text-cyan-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {Icon && <Icon className="hidden h-4 w-4 sm:inline" aria-hidden="true" />}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content — fade-in on switch (AC#3) */}
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <div
            key={tab.key}
            role="tabpanel"
            id={`tabpanel-${tab.key}`}
            aria-labelledby={`tab-${tab.key}`}
            hidden={!isActive}
            className="focus:outline-none"
          >
            {isActive && (
              <div key={activeTab} className="animate-tab-fade-in">
                {children[tab.key]}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
