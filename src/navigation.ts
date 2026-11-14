import { useSyncExternalStore } from 'react'

export const routes = {
  overview: { href: '#/', label: 'Overview', title: 'Agricultural Rotation Planning' },
  planner: { href: '#/planner', label: 'Rotation Planner', title: 'Crop Rotation Planner' },
  observations: { href: '#/observations', label: 'Earth Observations', title: 'Earth Observations' },
  research: { href: '#/research', label: 'Research & Sources', title: 'Research & Methodology' },
} as const

export type Page = keyof typeof routes

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function currentPage(): Page {
  const hash = window.location.hash
  if (hash === '#scenarios') return 'planner'
  if (hash === '#nasa-analysis') return 'observations'
  if (hash === '#sources' || hash === '#research-example') return 'research'
  return (Object.keys(routes) as Page[]).find((page) => routes[page].href === hash) ?? 'overview'
}

export function usePage() {
  return useSyncExternalStore(subscribe, currentPage, (): Page => 'overview')
}
