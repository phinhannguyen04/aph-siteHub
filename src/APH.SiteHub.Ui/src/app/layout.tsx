import type { Metadata } from 'next'
import { Providers } from '@/components/layout/providers'
import { themeScript } from '@/lib/theme'
import './globals.css'

export const metadata: Metadata = {
  title: 'APH SiteHub',
  description: 'Website directory and provider account management',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="sitehub-light" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static theme bootstrap script */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
