'use client'

import * as React from 'react'
import { Star, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface FavoriteItem {
  id: string
  label: string
  href: string
}

const STORAGE_KEY = 'wrkportal_favorites'

export function useFavorites() {
  const [favorites, setFavorites] = React.useState<FavoriteItem[]>([])

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setFavorites(JSON.parse(stored))
  }, [])

  const addFavorite = (item: FavoriteItem) => {
    const next = [...favorites, item].slice(0, 8)
    setFavorites(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const removeFavorite = (id: string) => {
    const next = favorites.filter((f) => f.id !== id)
    setFavorites(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const isFavorite = (id: string) => favorites.some((f) => f.id === id)

  return { favorites, addFavorite, removeFavorite, isFavorite }
}

export function SidebarFavorites() {
  const { favorites, removeFavorite } = useFavorites()
  const router = useRouter()

  if (favorites.length === 0) {
    return (
      <div className="px-3 py-2">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Favorites
        </p>
        <p className="text-xs text-muted-foreground/60 italic px-2 py-1">
          Star pages to pin them here
        </p>
      </div>
    )
  }

  return (
    <div className="px-3 py-2">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
        Favorites
      </p>
      <div className="space-y-0.5">
        {favorites.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 cursor-pointer text-sm transition-colors"
            onClick={() => router.push(item.href)}
          >
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
            <span className="truncate flex-1 text-foreground/80">{item.label}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeFavorite(item.id)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove from favorites"
            >
              <Star className="h-3 w-3 text-muted-foreground hover:text-yellow-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
