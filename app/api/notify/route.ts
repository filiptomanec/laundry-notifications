import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:your-email@example.com'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

type NotifyPayload = {
  type: "washing" | "drying"
  message?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify VAPID keys are configured
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 })
    }

    const body: NotifyPayload = await request.json()
    const { type, message } = body

    // Validate type
    if (!type || !["washing", "drying"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Must be 'washing' or 'drying'" }, { status: 400 })
    }

    const title = type === "washing" ? "Praní dokončeno!" : "Sušení dokončeno!"
    const defaultMessage =
      type === "washing"
        ? "Vaše prádlo je připraveno k vyndání z pračky."
        : "Vaše prádlo je připraveno k vyndání ze sušičky."

    const notificationPayload = JSON.stringify({
      title,
      body: message || defaultMessage,
      icon: "/icons/icon-192x192.jpg",
      badge: "/icons/icon-192x192.jpg",
      tag: `laundry-${type}`,
      data: { type },
    })

    // Get all subscriptions
    const subscriptions = global.pushSubscriptions || []

    if (subscriptions.length === 0) {
      return NextResponse.json({ error: "No subscriptions found" }, { status: 404 })
    }

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        webpush.sendNotification(subscription as webpush.PushSubscription, notificationPayload),
      ),
    )

    // Remove failed subscriptions (expired or unsubscribed)
    const failedIndexes: number[] = []
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        failedIndexes.push(index)
      }
    })

    // Remove failed subscriptions in reverse order to maintain indices
    failedIndexes.reverse().forEach((index) => {
      global.pushSubscriptions.splice(index, 1)
    })

    const successful = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      message: `Notification sent to ${successful} device(s)`,
    })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
