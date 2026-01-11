import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { neon } from "@neondatabase/serverless"

// Neon DB client
const sql = neon(process.env.DATABASE_URL!)

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:your-email@example.com"

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

type NotifyPayload = {
    type: "washing" | "drying"
    message?: string
}

export async function POST(req: NextRequest) {
    try {
        if (!vapidPublicKey || !vapidPrivateKey) {
            return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 })
        }

        const { type, message }: NotifyPayload = await req.json()

        if (!type || !["washing", "drying"].includes(type)) {
            return NextResponse.json({ error: "Invalid type. Must be 'washing' or 'drying'" }, { status: 400 })
        }

        const title = type === "washing" ? "Praní dokončeno!" : "Sušení dokončeno!"
        const body = message ??
            (type === "washing"
                ? "Vaše prádlo je připraveno k vyndání z pračky."
                : "Vaše prádlo je připraveno k vyndání ze sušičky.")

        const payload = JSON.stringify({
            title,
            body,
            icon: "/icons/icon-192x192.jpg",
            badge: "/icons/icon-192x192.jpg",
            tag: `laundry-${type}`,
        })

        // Get all subscriptions from DB
        const subs = await sql`
            SELECT endpoint, p256dh, auth
            FROM push_subscriptions
        `

        if (subs.length === 0) {
            return NextResponse.json({ error: "No subscriptions found" }, { status: 404 })
        }

        // Send notifications
        const results = await Promise.allSettled(
            subs.map((s) =>
                webpush.sendNotification(
                    {
                        endpoint: s.endpoint,
                        keys: {
                            p256dh: s.p256dh,
                            auth: s.auth,
                        },
                    },
                    payload
                )
            )
        )

        // Remove failed subscriptions (expired / unsubscribed)
        const failedSubs = results
            .map((r, i) => ({ r, i }))
            .filter(({ r }) => r.status === "rejected")

        for (const { i } of failedSubs) {
            await sql`
        DELETE FROM push_subscriptions
        WHERE endpoint = ${subs[i].endpoint}
      `
        }

        const successful = results.filter(r => r.status === "fulfilled").length
        const failed = failedSubs.length

        return NextResponse.json({
            success: true,
            sent: successful,
            failed,
            message: `Notification sent to ${successful} device(s)`,
        })
    } catch (err: any) {
        console.error("Error sending notification:", err)
        return NextResponse.json({ error: err.message ?? err.toString() }, { status: 500 })
    }
}
