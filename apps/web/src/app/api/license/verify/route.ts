import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { licenses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { license_key, hardware_id } = body;

		if (!license_key || !hardware_id) {
			return NextResponse.json({ error: "Missing license_key or hardware_id" }, { status: 400 });
		}

		// Find the license
		const [license] = await db.select().from(licenses).where(eq(licenses.id, license_key)).limit(1);

		if (!license) {
			return NextResponse.json({ status: "invalid", message: "License not found" }, { status: 404 });
		}

		if (license.revoked) {
			return NextResponse.json({ status: "revoked", message: "License has been revoked" });
		}

		// Check expiration date
		if (license.expiresAt && new Date() > new Date(license.expiresAt)) {
			return NextResponse.json({ status: "expired", message: "License has expired" });
		}

		// Parse allowed hardware IDs
		let hardwareList: string[] = [];
		if (license.hardwareIds) {
			try {
				hardwareList = JSON.parse(license.hardwareIds);
			} catch (_) {
				hardwareList = [];
			}
		}

		// Verify device or register new device if limits permit (2 computers, 1 mobile share rule simulated)
		if (hardwareList.includes(hardware_id)) {
			return NextResponse.json({ status: "active", tier: license.tier });
		}

		// Limit to 3 devices total
		if (hardwareList.length >= 3) {
			return NextResponse.json({ 
				status: "device_limit_reached", 
				message: "This license is already registered on the maximum of 3 devices." 
			}, { status: 403 });
		}

		// Register new device
		hardwareList.push(hardware_id);
		await db.update(licenses)
			.set({ hardwareIds: JSON.stringify(hardwareList) })
			.where(eq(licenses.id, license_key));

		return NextResponse.json({ status: "active", tier: license.tier });

	} catch (error) {
		console.error("License validation error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
