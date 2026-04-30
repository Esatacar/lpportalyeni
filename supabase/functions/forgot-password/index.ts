import { createClient } from "npm:@supabase/supabase-js@2";
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
    const { email, new_password, code, type } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: users, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      return new Response(
        JSON.stringify({ error: "Failed to process request" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const user = users.users.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return new Response(
        JSON.stringify({ error: "No account found with this email address" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (type === "reset") {
      if (!new_password || new_password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!code) {
        return new Response(
          JSON.stringify({ error: "Reset code is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const storedCode = user.user_metadata?.reset_code;
      const expiresAt = user.user_metadata?.reset_code_expires;

      if (!storedCode || storedCode !== code) {
        return new Response(
          JSON.stringify({ error: "Invalid reset code" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (expiresAt && new Date(expiresAt) < new Date()) {
        return new Response(
          JSON.stringify({ error: "Reset code has expired. Please request a new one." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          password: new_password,
          user_metadata: {
            ...user.user_metadata,
            reset_code: null,
            reset_code_expires: null,
          },
        }
      );

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to update password" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Default: send reset code via email
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    const { error: metaError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          reset_code: resetCode,
          reset_code_expires: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      }
    );

    if (metaError) {
      return new Response(
        JSON.stringify({ error: "Failed to process request" }),
        {
          status: 500,
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

    await client.sendAsync({
      from: "esat@e2.vc",
      to: email,
      subject: "Password Reset Code - e2vc LP Portal",
      text: [
        "You requested a password reset for the e2vc LP Portal.",
        "",
        `Your reset code is: ${resetCode}`,
        "",
        "This code expires in 15 minutes.",
        "",
        "If you did not request this, please contact e2vc team.",
        "Best regards,",
        "e2vc Team",
      ].join("\n"),
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
