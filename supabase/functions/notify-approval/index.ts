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
    const { record, old_record } = await req.json();

    if (!record || !record.email) {
      return new Response(
        JSON.stringify({ error: "No record data provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Only send email if user was just approved (changed from not approved to approved)
    const wasApproved = old_record && !old_record.is_approved && record.is_approved;
    if (!wasApproved) {
      return new Response(
        JSON.stringify({ message: "No approval change, skipping email" }),
        {
          status: 200,
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

    const userName = record.full_name || "Investor";

    await client.sendAsync({
      from: "esat@e2.vc",
      to: record.email,
      cc: "esat@e2.vc",
      subject: "Your e2vc LP Portal Account Has Been Approved",
      text: [
        `Hi ${userName},`,
        "",
        "Great news! Your account on the e2vc LP Portal has been approved.",
        "",
        "You can now sign in and access your investor dashboard: https://lpportal.e2.vc",
        "",
        "If you have any questions, please don't hesitate to reach out.",
        "",
        "Best regards,",
        "e2vc Team",
      ].join("\n"),
    });

    return new Response(
      JSON.stringify({ success: true, message: "Approval email sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Approval email error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send approval email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
