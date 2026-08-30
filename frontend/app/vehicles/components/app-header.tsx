"use client"

import { Search, Bell, Moon, Sun } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { useState } from "react"

interface AppHeaderProps {
  userName?: string
  userRole?: string
}

export function AppHeader({ userName = "Dương Nguyễn", userRole = "Cư dân" }: AppHeaderProps) {
  const [isDark, setIsDark] = useState(true)

  return (
    <header className="border-b border-border bg-slate-900 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800">
            <Bell className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-3 ml-2">
            <div className="text-right">
              <div className="text-sm font-medium text-white">{userName}</div>
              <div className="text-xs text-slate-400">{userRole}</div>
            </div>
            <Avatar className="h-9 w-9 bg-blue-600 text-white">
              <AvatarFallback className="bg-blue-600 text-white font-medium">{userName.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}
