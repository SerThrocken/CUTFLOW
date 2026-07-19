import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { licenses } from "@/db/schema";
import { webEnv } from "@/env/web";
import crypto from "crypto";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
	try {
		const payload = await req.json();
		const eventType = payload.event_type;

		// Basic verification: in production, verify with PayPal's SDK/cert using PAYPAL_WEBHOOK_SECRET

		let email = "";
		let tier = "pro";
		let subscriptionId = "";
		let isSub = false;

		if (eventType === "BILLING.SUBSCRIPTION.CREATED" || eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {
			email = payload.resource.subscriber?.email_address || "";
			subscriptionId = payload.resource.id;
			tier = "pro";
			isSub = true;
		} else if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
			// One-time Lifetime/Studio payment
			email = payload.resource.billing_details?.email_address || payload.resource.payer?.email_address || "";
			subscriptionId = payload.resource.id;
			tier = "studio"; // Lifetime
		} else if (eventType === "BILLING.SUBSCRIPTION.CANCELLED") {
			// Revoke license
			const subId = payload.resource.id;
			await db.update(licenses)
				.set({ revoked: true })
				.where(eq(licenses.subscriptionId, subId));
			
			// Send to Discord
			await sendDiscordAlert(`❌ Subscription Cancelled for ${payload.resource.subscriber?.email_address || "User"}`);
			return NextResponse.json({ message: "Subscription revoked successfully" });
		} else {
			return NextResponse.json({ message: "Unhandled event type" });
		}

		if (!email) {
			return NextResponse.json({ error: "No email found in webhook" }, { status: 400 });
		}

		// Generate random license key: CF-XXXX-XXXX-XXXX
		const rand = crypto.randomBytes(6).toString("hex").toUpperCase();
		const licenseKey = `CF-${rand.slice(0, 4)}-${rand.slice(4, 8)}-${rand.slice(8, 12)}`;

		// Insert into Drizzle DB
		await db.insert(licenses).values({
			id: licenseKey,
			email,
			tier,
			source: "paypal",
			subscriptionId,
			hardwareIds: JSON.stringify([]),
			revoked: false,
		});

		// Send alert to Discord webhook
		const alertMessage = `💰 **New Purchase Alert!**\n` +
			`- **Product:** CutFlow ${tier.toUpperCase()}\n` +
			`- **Customer:** \`${email}\`\n` +
			`- **Source:** PayPal\n` +
			`- **License Key:** \`${licenseKey}\``;
		
		await sendDiscordAlert(alertMessage);

		return NextResponse.json({ message: "License generated and registered", license_key: licenseKey });

	} catch (error) {
		console.error("PayPal webhook error:", error);
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
