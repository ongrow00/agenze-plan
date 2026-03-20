import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface ThemeStore {
  theme: Theme
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light' as Theme,
      toggle: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'agenze-theme',
    }
  )
)

// Hook que aplica a classe no <html> e expõe isDark
export function useTheme() {
  const { theme, toggle } = useThemeStore()
  const isDark = theme === 'dark'

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])

  return { theme, toggle, isDark }
}
