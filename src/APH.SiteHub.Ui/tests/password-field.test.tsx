import { expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { PasswordField } from '../src/components/common/password-field'

test('PasswordField retains input properties, both adornments and other slots', () => {
  const html = renderToStaticMarkup(
    <PasswordField
      label="Password"
      slotProps={{
        input: {
          readOnly: true,
          startAdornment: <span>custom start</span>,
          endAdornment: <span>custom end</span>,
        },
        htmlInput: { 'aria-label': 'custom password input' },
      }}
    />,
  )
  expect(html).toMatch(/<input\b[^>]*\sreadonly=""/i)
  expect(html).toContain('custom start')
  expect(html).toContain('custom end')
  expect(html).toContain('aria-label="custom password input"')
  expect(html).toContain('aria-label="Show password"')
})

test('PasswordField resolves callback input slot props with the owner state', () => {
  const html = renderToStaticMarkup(
    <PasswordField
      error
      slotProps={{
        input: (state) => ({
          readOnly: true,
          endAdornment: <span>{state.error ? 'error adornment' : 'normal adornment'}</span>,
        }),
      }}
    />,
  )
  expect(html).toMatch(/<input\b[^>]*\sreadonly=""/i)
  expect(html).toContain('error adornment')
  expect(html).toContain('aria-label="Show password"')
})
