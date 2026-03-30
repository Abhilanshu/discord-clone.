import type { Metadata } from 'next'
import { Open_Sans } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { SocketProvider } from '@/components/providers/socket-provider'
import { CallProvider } from '@/components/providers/call-provider'
import { cn } from '@/lib/utils'

const font = Open_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Discord Clone',
  description: 'A 1:1 High Performance Discord Clone',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        font.className,
        "bg-[#313338]"
      )}>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="discord-theme"
          >
            <SocketProvider>
              <CallProvider>
                {children}
              </CallProvider>
            </SocketProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
