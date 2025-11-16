import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Email Unsubscribe Agent',
  description: 'AI-powered agent to unsubscribe from marketing emails',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
