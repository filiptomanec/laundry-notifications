import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for subscriptions (use a database in production)
// This will be imported by the notify endpoint
declare global {
    // eslint-disable-next-line no-var
    var pushSubscriptions: PushSubscriptionJSON[]
}

if (!global.pushSubscriptions) {
    global.pushSubscriptions = []
}

export async function POST(request: NextRequest) {
    try {
        const subscription = await request.json()

        // Check if subscription already exists
        const exists = global.pushSubscriptions.some((sub) => sub.endpoint === subscription.endpoint)

        if (!exists) {
            global.pushSubscriptions.push(subscription)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error saving subscription:", error)
        return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        count: global.pushSubscriptions.length,
    })
}

export async function DELETE(request: NextRequest) {
    try {
        const { endpoint } = await request.json()

        const index = global.pushSubscriptions.findIndex((sub) => sub.endpoint === endpoint)

        if (index !== -1) {
            global.pushSubscriptions.splice(index, 1)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error removing subscription:", error)
        return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 })
    }
}
