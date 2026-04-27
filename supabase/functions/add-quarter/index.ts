import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const serviceClient = createClient(supabaseUrl, serviceKey);

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || profile.role !== "admin") {
      return jsonResponse({ error: "Admin access required" }, 403);
    }

    const { quarter, year } = await req.json();
    if (
      !quarter ||
      !year ||
      ![1, 2, 3, 4].includes(quarter) ||
      year < 2021 ||
      year > 2099
    ) {
      return jsonResponse({ error: "Invalid quarter or year" }, 400);
    }

    const { data, error } = await serviceClient.rpc("add_quarter_columns", {
      p_quarter: quarter,
      p_year: year,
    });

    if (error) {
      return jsonResponse(
        { error: "Failed to add columns", details: error.message },
        500
      );
    }

    return jsonResponse({
      success: true,
      message: `Q${quarter} ${year} columns added successfully`,
    });
  } catch (err) {
    return jsonResponse(
      { error: "Internal server error", details: String(err) },
      500
    );
  }
});
