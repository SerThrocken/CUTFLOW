import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { licenses } from "@/db/schema";
import { webEnv } from "@/env/web";
import crypto from "crypto";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
	try {
		const payload = await req.json();
		const eventType = req.headers.get("x-patreon-event") || "";

		// Basic verification: in production, verify header signatures using PATREON_WEBHOOK_SECRET

		let email = payload.data?.attributes?.email || "";
		const patreonId = payload.data?.id || "";

		if (eventType === "members:pledge:create") {
			if (!email) {
				return NextResponse.json({ error: "No email found in webhook" }, { status: 400 });
			}

			// Generate license key
			const rand = crypto.randomBytes(6).toString("hex").toUpperCase();
			const licenseKey = `CF-${rand.slice(0, 4)}-${rand.slice(4, 8)}-${rand.slice(8, 12)}`;

			// Insert license into DB
			await db.insert(licenses).values({
				id: licenseKey,
				email,
				tier: "pro",
				source: "patreon",
				subscriptionId: patreonId,
				hardwareIds: JSON.stringify([]),
				revoked: false,
			});

			const alertMessage = `🧡 **New Patreon Pledge!**\n` +
				`- **Product:** CutFlow Pro\n` +
				`- **Patron:** \`${email}\`\n` +
				`- **License Key:** \`${licenseKey}\``;
			
			await sendDiscordAlert(alertMessage);
			return NextResponse.json({ message: "Patreon license generated", license_key: licenseKey });

		} else if (eventType === "members:pledge:delete") {
			// Revoke license
			await db.update(licenses)
				.set({ revoked: true })
				.where(eq(licenses.subscriptionId, patreonId));

			const alertMessage = `💔 **Patreon Pledge Deleted**\n` +
				`- **Patron ID:** \`${patreonId}\` has cancelled their pledge. Access revoked.`;
			
			await sendDiscordAlert(alertMessage);
			return NextResponse.json({ message: "Patreon license revoked" });

		} else if (eventType === "members:pledge:update") {
			// Update details (e.g. email change or tier change)
			// Handle accordingly if tier changes are implemented
			return NextResponse.json({ message: "Patreon update logged" });
		}

		return NextResponse.json({ message: "Unhandled event" });

	} catch (error) {
		console.error("Patreon webhook error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

async function sendDiscordAlert(content: string) {
	const webhookUrl = webEnv.DISCORD_WEBHOOK_URL;
	if (!webhookUrl) return;

	try {
		await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content }),
		});
	} catch (err) {
		console.error("Failed to send Discord alert:", err);
	}
}
