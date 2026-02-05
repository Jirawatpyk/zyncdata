/**
 * ESLint rule: no-dark-classes
 *
 * Flags any Tailwind `dark:` prefixed classes in string/template literals.
 * This project uses CSS custom properties for theming — dark: utility classes
 * from shadcn/ui must be stripped during implementation.
 *
 * @see Epic 2 Retrospective Action Item P1
 */

/** @type {import('eslint').Rule.RuleModule} */
const noDarkClasses = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Tailwind dark: prefixed classes',
    },
    messages: {
      noDarkClass:
        'Remove dark: class "{{className}}". This project uses CSS custom properties for theming, not dark: utilities.',
    },
    schema: [],
  },
  create(context) {
    const DARK_CLASS_PATTERN = /\bdark:[^\s"'`]+/g

    function checkForDarkClasses(node, value) {
      let match
      DARK_CLASS_PATTERN.lastIndex = 0
      while ((match = DARK_CLASS_PATTERN.exec(value)) !== null) {
        context.report({
          node,
          messageId: 'noDarkClass',
          data: { className: match[0] },
        })
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          checkForDarkClasses(node, node.value)
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          checkForDarkClasses(node, quasi.value.raw)
        }
      },
    }
  },
}

export default noDarkClasses
