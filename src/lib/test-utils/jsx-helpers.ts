/** Shared JSX tree traversal helpers for Server Component unit tests (no jsdom). */

/** Recursively resolve function components (catches hook errors for client components). */
export function deepRender(node: unknown): unknown {
  if (!node) return node
  if (typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(deepRender)
  if (!('type' in (node as object))) return node

  const el = node as { type: unknown; props: Record<string, unknown>; key: unknown }
  if (typeof el.type === 'function') {
    try {
      const rendered = (el.type as (props: Record<string, unknown>) => unknown)(el.props)
      return deepRender(rendered)
    } catch {
      // Component uses hooks — render children only
      if (el.props?.children) return deepRender(el.props.children)
      return node
    }
  }
  // HTML element — deep render children
  if (el.props?.children) {
    return { ...node, props: { ...el.props, children: deepRender(el.props.children) } }
  }
  return node
}

/** Find the first element matching an HTML tag name. */
export function findByType(node: unknown, type: string): unknown | null {
  if (!node) return null
  if (typeof node === 'object' && node !== null && 'type' in node) {
    if ((node as { type: unknown }).type === type) return node
    const el = node as { props?: { children?: unknown } }
    if (el.props?.children) {
      if (Array.isArray(el.props.children)) {
        for (const child of el.props.children) {
          const found = findByType(child, type)
          if (found) return found
        }
      }
      return findByType(el.props.children, type)
    }
  }
  return null
}

/** Find all elements matching an HTML tag name. */
export function findAllByTag(node: unknown, tag: string): unknown[] {
  const results: unknown[] = []
  if (!node) return results
  if (typeof node === 'object' && node !== null && 'type' in node) {
    if ((node as { type: unknown }).type === tag) results.push(node)
    const el = node as { props?: { children?: unknown } }
    if (el.props?.children) {
      if (Array.isArray(el.props.children)) {
        for (const child of el.props.children) {
          results.push(...findAllByTag(child, tag))
        }
      } else {
        results.push(...findAllByTag(el.props.children, tag))
      }
    }
  }
  return results
}

/** Extract all text content from a JSX tree. */
export function extractText(node: unknown): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (!node) return ''
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (typeof node === 'object' && node !== null && 'props' in node) {
    const el = node as { props: { children?: unknown } }
    return extractText(el.props.children)
  }
  return ''
}

/** JSON.stringify with circular reference and function handling. */
export function safeStringify(node: unknown): string {
  const seen = new WeakSet()
  return JSON.stringify(node, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return undefined
      seen.add(value)
    }
    if (typeof value === 'function') return `[Function:${value.name}]`
    return value
  })
}
