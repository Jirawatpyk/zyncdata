/**
 * Server-side HTML sanitization for content fields.
 *
 * - Plain text fields: strip ALL HTML tags
 * - Rich text fields: allow only TipTap-safe HTML tags
 *
 * Defense-in-depth: TipTap StarterKit already blocks script/iframe on client,
 * but we sanitize server-side to protect against direct API calls.
 */

/** Strip ALL HTML tags — used for plain text fields (title, subtitle, etc.) */
export function stripHtml(input: string): string {
  // Remove script/style tags AND their content first
  let result = input.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  result = result.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
  // Then strip remaining tags
  return result.replace(/<[^>]*>/g, '')
}

/**
 * Allow only safe HTML tags produced by TipTap StarterKit + Link extension.
 * Strips everything else (script, iframe, style, event handlers, etc.).
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'b', 'i',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'code', 'pre',
  'hr',
])

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
}

export function sanitizeHtml(input: string): string {
  // Remove script tags and their content entirely
  let result = input.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  // Remove style tags and their content entirely
  result = result.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
  // Remove event handlers (on*)
  result = result.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
  // Remove javascript: URLs
  result = result.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')

  // Filter tags: keep allowed, strip disallowed
  result = result.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tag: string, attrs: string) => {
    const lowerTag = tag.toLowerCase()
    if (!ALLOWED_TAGS.has(lowerTag)) return ''

    // Filter attributes
    const allowedAttrs = ALLOWED_ATTRS[lowerTag]
    if (!allowedAttrs) {
      // Tag is allowed but no attributes permitted
      return match.startsWith('</') ? `</${lowerTag}>` : `<${lowerTag}>`
    }

    // Parse and filter attributes
    const filteredAttrs: string[] = []
    const attrRegex = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g
    let attrMatch
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase()
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4]
      if (allowedAttrs.has(attrName)) {
        filteredAttrs.push(`${attrName}="${attrValue}"`)
      }
    }

    if (match.startsWith('</')) return `</${lowerTag}>`
    return filteredAttrs.length > 0
      ? `<${lowerTag} ${filteredAttrs.join(' ')}>`
      : `<${lowerTag}>`
  })

  return result
}
