"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WashingMachineIcon } from "@/components/washing-machine-icon"
import { Loader2, LogIn } from "lucide-react"

interface LoginFormProps {
  onLogin: () => void
}

// Hardcoded credentials
const VALID_USERNAME = "martinov"
const VALID_PASSWORD = "martinov"

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simulate a small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      // Store login state permanently in localStorage (no expiration)
      localStorage.setItem("laundry_auth", "authenticated")
      localStorage.setItem("laundry_user", username)
      onLogin()
    } else {
      setError("Nesprávné jméno nebo heslo")
    }

    setIsLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <WashingMachineIcon className="w-14 h-14 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-balance">Laundry</CardTitle>
          <CardDescription className="text-balance">Přihlaste se pro povolení notifikací</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Uživatelské jméno</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Zadejte jméno"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Zadejte heslo"
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" disabled={isLoading} className="w-full h-12 text-base font-medium" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Přihlašování...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Přihlásit se
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
