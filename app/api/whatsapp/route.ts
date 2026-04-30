import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phoneNumber, message } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json({ error: "Phone number and message are required" }, { status: 400 });
    }

    const success = await sendWhatsAppMessage(phoneNumber, message);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to send WhatsApp message" }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
