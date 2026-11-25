import { expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { PasswordField } from '../src/components/common/password-field'

test('PasswordField retains input properties, both adornments and the visibility toggle', () => {
  const html = renderToStaticMarkup(
    <PasswordField
      label="Password"
      readOnly
      start={<span>custom start</span>}
      end={<span>custom end</span>}
      aria-label="custom password input"
    />,
  )
  expect(html).toMatch(/<input\b[^>]*\sreadonly=""/i)
  expect(html).toMatch(/<input\b[^>]*\stype="password"/i)
  expect(html).toContain('custom start')
  expect(html).toContain('custom end')
  expect(html).toContain('aria-label="custom password input"')
  expect(html).toContain('aria-label="Show password"')
})

test('PasswordField links its label and marks errors with an accessible description', () => {
  const html = renderToStaticMarkup(
    <PasswordField id="pw" label="Password" error helperText="Too short" />,
  )
  expect(html).toContain('for="pw"')
  expect(html).toMatch(/<input\b[^>]*\saria-invalid="true"/i)
  expect(html).toMatch(/<input\b[^>]*\saria-describedby="pw-help"/i)
  expect(html).toContain('id="pw-help"')
  expect(html).toContain('Too short')
})
