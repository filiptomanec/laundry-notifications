"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WashingMachineIcon } from "@/components/washing-machine-icon"
import { Bell, BellOff, Check, Loader2 } from "lucide-react"
import { LoginForm } from "@/components/login-form"

type PermissionState = "default" | "granted" | "denied" | "unsupported"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function LaundryApp() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    const [permission, setPermission] = useState<PermissionState>("default")
    const [isLoading, setIsLoading] = useState(false)
    const [isRegistered, setIsRegistered] = useState(false)
    const [isUnsubscribing, setIsUnsubscribing] = useState(false)

    useEffect(() => {
        const authStatus = localStorage.getItem("laundry_auth")
        setIsAuthenticated(authStatus === "authenticated")
    }, [])

    useEffect(() => {
        if (!isAuthenticated) return

        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            setPermission("unsupported")
            return
        }

        setPermission(Notification.permission as PermissionState)

        navigator.serviceWorker.ready.then(async (registration) => {
            const subscription = await registration.pushManager.getSubscription()
            if (subscription) {
                setIsRegistered(true)
            }
        })

        navigator.serviceWorker.register("/sw.js").catch(console.error)
    }, [isAuthenticated])

    const handleEnableNotifications = async () => {
        if (permission === "unsupported") return

        setIsLoading(true)

        try {
            const result = await Notification.requestPermission()
            setPermission(result as PermissionState)

            if (result === "granted") {
                const registration = await navigator.serviceWorker.ready

                // Get VAPID public key from server
                const response = await fetch("/api/vapid-public-key")
                const {publicKey} = await response.json()

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
                })

                // Send subscription to server
                await fetch("/api/subscribe", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(subscription),
                })

                setIsRegistered(true)
            }
        } catch (error) {
            console.error("Error enabling notifications:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDisableNotifications = async () => {
        setIsUnsubscribing(true)

        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()

            if (subscription) {
                await subscription.unsubscribe()

                await fetch("/api/subscribe", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                })
            }

            setIsRegistered(false)
        } catch (error) {
            console.error("Error disabling notifications:", error)
        } finally {
            setIsUnsubscribing(false)
        }
    }

    const handleLogin = () => {
        setIsAuthenticated(true)
    }

    const getStatusMessage = () => {
        if (permission === "unsupported") {
            return "Váš prohlížeč nepodporuje push notifikace"
        }
        if (permission === "denied") {
            return "Notifikace jsou zablokované. Povolte je v nastavení prohlížeče."
        }
        if (isRegistered) {
            return "Notifikace jsou aktivní"
        }
        return "Povolte notifikace pro upozornění na dokončení praní"
    }

    if (isAuthenticated === null) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </main>
        )
    }

    if (!isAuthenticated) {
        return <LoginForm onLogin={handleLogin} />
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-sm shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                        <WashingMachineIcon className="w-14 h-14 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-balance">Laundry</CardTitle>
                    <CardDescription className="text-balance">{getStatusMessage()}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    {permission === "granted" && isRegistered ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                                <Check className="w-8 h-8 text-accent" />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                Budete upozorněni, až praní nebo sušení skončí
                            </p>
                            <Button
                                onClick={handleDisableNotifications}
                                disabled={isUnsubscribing}
                                variant="outline"
                                className="w-full mt-2 bg-transparent"
                            >
                                {isUnsubscribing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Rušení...
                                    </>
                                ) : (
                                    <>
                                        <BellOff className="mr-2 h-4 w-4" />
                                        Zrušit notifikace
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={handleEnableNotifications}
                            disabled={isLoading || permission === "unsupported" || permission === "denied"}
                            className="w-full h-12 text-base font-medium"
                            size="lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Povolování...
                                </>
                            ) : permission === "denied" ? (
                                <>
                                    <BellOff className="mr-2 h-5 w-5" />
                                    Notifikace zablokované
                                </>
                            ) : (
                                <>
                                    <Bell className="mr-2 h-5 w-5" />
                                    Povolit notifikace
                                </>
                            )}
                        </Button>
                    )}
                </CardContent>
            </Card>

            <p className="mt-6 text-xs text-muted-foreground text-center max-w-xs">
                Aplikace vás upozorní push notifikací, když pračka nebo sušička dokončí svůj cyklus.
            </p>
        </main>
    )
}
