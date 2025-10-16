// app/dashboard/layout.tsx
import SideBar from './sidebar'
import React from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SideBar isOpen={false} onToggle={function (open: boolean): void {
              throw new Error('Function not implemented.')
          } } />
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  )
}
