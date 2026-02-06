'use client'

import { useState } from 'react'
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

  if (tabs.length === 0) return null

  return (
    <div>
      {/* Tab bar */}
      <div
        className="mb-8 flex justify-center gap-8 border-b border-gray-200"
        role="tablist"
        aria-label="System categories"
      >
        {tabs.map((tab) => {
          const Icon = ICON_MAP[tab.key]
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.key}`}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex cursor-pointer items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'border-dxt-primary text-dxt-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600',
              )}
            >
              {Icon && <Icon className="hidden h-4 w-4 sm:inline" aria-hidden="true" />}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tabs.map((tab) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`tabpanel-${tab.key}`}
          aria-labelledby={`tab-${tab.key}`}
          hidden={activeTab !== tab.key}
          className="focus:outline-none"
        >
          {children[tab.key]}
        </div>
      ))}
    </div>
  )
}
