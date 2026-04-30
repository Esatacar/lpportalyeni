import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SMTPClient } from "npm:emailjs@4.0.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const record = payload.record || payload;
    const email = record.email || "Unknown";
    const name = record.full_name || record.name || "Unknown";
    const createdAt = record.created_at || new Date().toISOString();

    const client = new SMTPClient({
      user: "esat@e2.vc",
      password: "klno ryhj plag fejb",
      host: "smtp.gmail.com",
      ssl: true,
    });

    await client.sendAsync({
      from: "esat@e2.vc",
      to: "esat@e2.vc",
      subject: `New Investor Portal Signup: ${email}`,
      text: [
        `A new user has signed up for the Investor Portal.`,
        ``,
        `Details:`,
        `- Email: ${email}`,
        `- Name: ${name}`,
        `- Signed up at: ${createdAt}`,
        ``,
        `Please review and approve their access in the Admin Dashboard.`,
      ].join("\n"),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending signup notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
