export async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  if (!phoneNumber) return false;

  try {
    const response = await fetch("http://localhost:3005/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ phoneNumber, message })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[WhatsApp] Service returned error:", errText);
      return false;
    }

    console.log(`[WhatsApp] Successfully pushed message to the WhatsApp microservice!`);
    return true;
  } catch (error) {
    console.error("[WhatsApp] Failed to connect to service:", error);
    return false;
  }
}
