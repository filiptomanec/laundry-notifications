import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const runtime = "nodejs"

// Neon DB client
const sql = neon(process.env.DATABASE_URL!)

type PushSub = {
    endpoint: string
    keys: {
        p256dh: string
        auth: string
    }
}

// -------------------- POST: uložit subscription --------------------
export async function POST(request: NextRequest) {
    try {
        const subscription: PushSub = await request.json()
        const { endpoint, keys } = subscription

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
        }

        // Uložit subscription, pokud neexistuje
        await sql`
      INSERT INTO push_subscriptions (endpoint, p256dh, auth)
      VALUES (${endpoint}, ${keys.p256dh}, ${keys.auth})
      ON CONFLICT (endpoint) DO NOTHING
    `

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error saving subscription:", error)
        return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
    }
}

// -------------------- GET: počet subscriptions --------------------
export async function GET() {
    try {
        const subs = await sql`SELECT COUNT(*) AS count FROM push_subscriptions`
        return NextResponse.json({ count: Number(subs[0].count) })
    } catch (error) {
        console.error("Error fetching subscriptions:", error)
        return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }
}

// -------------------- DELETE: smazat subscription --------------------
export async function DELETE(request: NextRequest) {
    try {
        const { endpoint } = await request.json()

        if (!endpoint) {
            return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
        }

        await sql`
      DELETE FROM push_subscriptions
      WHERE endpoint = ${endpoint}
    `

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error removing subscription:", error)
        return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 })
    }
}
