/**
 * Plugin System
 * Allows platform owners to extend functionality with custom plugins
 */

import { FunctionDefinition } from './function-registry'
import { getFunctionRegistry } from './function-registry'

export interface SyntaxRule {
  name: string
  pattern: string | RegExp
  transform: string | ((match: RegExpMatchArray, context: any) => string)
  description?: string
}

export interface PluginHook {
  beforeQuery?: (query: any) => any
  afterQuery?: (results: any) => any
  beforeFunction?: (functionName: string, args: any[]) => any[]
  afterFunction?: (functionName: string, result: any) => any
}

export interface Plugin {
  name: string
  version: string
  description?: string
  functions?: FunctionDefinition[]
  syntax?: SyntaxRule[]
  hooks?: PluginHook
  enabled?: boolean
}

export class PluginSystem {
  private plugins: Map<string, Plugin> = new Map()
  private functionRegistry = getFunctionRegistry()

  /**
   * Load a plugin
   */
  async load(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already loaded`)
    }

    // Register plugin functions
    if (plugin.functions) {
      for (const func of plugin.functions) {
        try {
          this.functionRegistry.register(func, true) // true = custom function
        } catch (error: any) {
          console.warn(
            `Failed to register function ${func.name} from plugin ${plugin.name}:`,
            error.message
          )
        }
      }
    }

    // Store plugin
    this.plugins.set(plugin.name, {
      ...plugin,
      enabled: plugin.enabled !== false,
    })

    console.log(`Plugin ${plugin.name} v${plugin.version} loaded successfully`)
  }

  /**
   * Unload a plugin
   */
  unload(pluginName: string): boolean {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      return false
    }

    // Remove plugin functions
    if (plugin.functions) {
      for (const func of plugin.functions) {
        this.functionRegistry.remove(func.name)
      }
    }

    this.plugins.delete(pluginName)
    console.log(`Plugin ${pluginName} unloaded`)

    return true
  }

  /**
   * Get a plugin
   */
  get(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName)
  }

  /**
   * Get all plugins
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get enabled plugins
   */
  getEnabled(): Plugin[] {
    return Array.from(this.plugins.values()).filter((p) => p.enabled)
  }

  /**
   * Enable a plugin
   */
  enable(pluginName: string): boolean {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      return false
    }

    plugin.enabled = true

    // Re-register functions
    if (plugin.functions) {
      for (const func of plugin.functions) {
        try {
          this.functionRegistry.register(func, true)
        } catch (error) {
          // Function might already exist, that's okay
        }
      }
    }

    return true
  }

  /**
   * Disable a plugin
   */
  disable(pluginName: string): boolean {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      return false
    }

    plugin.enabled = false

    // Remove functions
    if (plugin.functions) {
      for (const func of plugin.functions) {
        this.functionRegistry.remove(func.name)
      }
    }

    return true
  }

  /**
   * Execute plugin hooks
   */
  executeHook(hookName: keyof PluginHook, ...args: any[]): any {
    const enabledPlugins = this.getEnabled()
    let result = args[0]

    for (const plugin of enabledPlugins) {
      if (plugin.hooks && plugin.hooks[hookName]) {
        const hook = plugin.hooks[hookName] as Function
        try {
          result = hook(result, ...args.slice(1))
        } catch (error) {
          console.error(
            `Error executing hook ${hookName} in plugin ${plugin.name}:`,
            error
          )
        }
      }
    }

    return result
  }

  /**
   * Apply syntax transformations
   */
  transformSyntax(input: string, context: any = {}): string {
    const enabledPlugins = this.getEnabled()
    let result = input

    for (const plugin of enabledPlugins) {
      if (plugin.syntax) {
        for (const rule of plugin.syntax) {
          const pattern =
            typeof rule.pattern === 'string'
              ? new RegExp(rule.pattern, 'g')
              : rule.pattern

          result = result.replace(pattern, (match, ...args) => {
            // Extract groups, offset, and string from replace callback
            // The replace callback signature is: (match, ...groups, offset, string)
            const offset = args[args.length - 2] as number
            const string = args[args.length - 1] as string
            const groups = args.slice(0, -2)

            // Create a RegExpMatchArray-like object
            const fullMatch = [match, ...groups] as RegExpMatchArray
            fullMatch.index = offset
            fullMatch.input = string

            if (typeof rule.transform === 'function') {
              return rule.transform(fullMatch, context)
            } else {
              // Simple string replacement with groups
              let transformed = rule.transform
              for (let i = 0; i < groups.length; i++) {
                transformed = transformed.replace(`$${i + 1}`, groups[i])
              }
              return transformed
            }
          })
        }
      }
    }

    return result
  }
}

// Singleton instance
let pluginSystemInstance: PluginSystem | null = null

export function getPluginSystem(): PluginSystem {
  if (!pluginSystemInstance) {
    pluginSystemInstance = new PluginSystem()
  }
  return pluginSystemInstance
}
