import { SMTPClient } from "npm:emailjs@4.0.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { record } = await req.json();

    if (!record || !record.email) {
      return new Response(
        JSON.stringify({ error: "No record data provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const client = new SMTPClient({
      user: "esat@e2.vc",
      password: "klno ryhj plag fejb",
      host: "smtp.gmail.com",
      ssl: true,
    });

    const message = await client.sendAsync({
      from: "esat@e2.vc",
      to: "esat@e2.vc",
      cc: "team@e2.vc",
      subject: `New LP Portal Signup: ${record.full_name || record.email}`,
      text: [
        "A new user has signed up for the LP Portal.",
        "",
        "Details:",
        `  Name: ${record.full_name || "N/A"}`,
        `  Email: ${record.email}`,
        `  Date: ${record.created_at || new Date().toISOString()}`,
        "",
        "Please review and approve the account in the Admin Dashboard.",
      ].join("\n"),
    });

    return new Response(
      JSON.stringify({ success: true, message: "Notification email sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Email send error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
