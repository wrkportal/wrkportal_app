/**
 * Keyboard Shortcuts System
 * Provides keyboard shortcuts for common actions
 */

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: () => void
  description: string
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private enabled: boolean = true

  register(shortcut: KeyboardShortcut) {
    const key = this.getKeyString(shortcut)
    this.shortcuts.set(key, shortcut)
  }

  unregister(key: string) {
    this.shortcuts.delete(key)
  }

  handleKeyDown(event: KeyboardEvent) {
    if (!this.enabled) return

    const key = this.getKeyStringFromEvent(event)
    const shortcut = this.shortcuts.get(key)

    if (shortcut) {
      event.preventDefault()
      shortcut.action()
    }
  }

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }

  private getKeyString(shortcut: KeyboardShortcut): string {
    const parts: string[] = []
    if (shortcut.ctrl) parts.push('ctrl')
    if (shortcut.shift) parts.push('shift')
    if (shortcut.alt) parts.push('alt')
    if (shortcut.meta) parts.push('meta')
    parts.push(shortcut.key.toLowerCase())
    return parts.join('+')
  }

  private getKeyStringFromEvent(event: KeyboardEvent): string {
    const parts: string[] = []
    if (event.ctrlKey) parts.push('ctrl')
    if (event.shiftKey) parts.push('shift')
    if (event.altKey) parts.push('alt')
    if (event.metaKey) parts.push('meta')
    parts.push(event.key.toLowerCase())
    return parts.join('+')
  }

  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }
}

// Global instance
export const keyboardShortcuts = new KeyboardShortcutManager()

// Common shortcuts
export const commonShortcuts: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrl: true,
    action: () => {
      // Open command palette or search
      const event = new CustomEvent('open-command-palette')
      window.dispatchEvent(event)
    },
    description: 'Open command palette',
  },
  {
    key: 'n',
    ctrl: true,
    action: () => {
      // Create new item
      const event = new CustomEvent('create-new')
      window.dispatchEvent(event)
    },
    description: 'Create new',
  },
  {
    key: 's',
    ctrl: true,
    action: () => {
      // Save
      const event = new CustomEvent('save')
      window.dispatchEvent(event)
    },
    description: 'Save',
  },
  {
    key: '/',
    action: () => {
      // Focus search
      const event = new CustomEvent('focus-search')
      window.dispatchEvent(event)
    },
    description: 'Focus search',
  },
]

