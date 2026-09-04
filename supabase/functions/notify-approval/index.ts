import { SMTPClient } from "npm:emailjs@4.0.3";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the caller is an authenticated admin
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role, is_approved")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin" || !profile.is_approved) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
