import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, title, body, data } = await req.json();

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "user_id and title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get device tokens for user
    const { data: tokens, error: tokenErr } = await supabaseAdmin
      .from("device_tokens")
      .select("token, platform")
      .eq("user_id", user_id);

    if (tokenErr) {
      throw new Error(`Failed to fetch tokens: ${tokenErr.message}`);
    }

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No device tokens found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get FCM server key from secrets
    const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");
    if (!fcmServerKey) {
      return new Response(JSON.stringify({ error: "FCM_SERVER_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send to each token via FCM HTTP v1 legacy API
    let sent = 0;
    const errors: string[] = [];

    for (const { token } of tokens) {
      const fcmPayload = {
        to: token,
        notification: {
          title,
          body: body || "",
        },
        data: data || {},
      };

      const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${fcmServerKey}`,
        },
        body: JSON.stringify(fcmPayload),
      });

      const fcmResult = await fcmRes.json();

      if (fcmResult.success === 1) {
        sent++;
      } else {
        errors.push(`Token ${token.substring(0, 10)}...: ${JSON.stringify(fcmResult.results)}`);
        // Clean up invalid tokens
        if (fcmResult.results?.[0]?.error === "NotRegistered" || fcmResult.results?.[0]?.error === "InvalidRegistration") {
          await supabaseAdmin.from("device_tokens").delete().eq("token", token);
        }
      }
    }

    return new Response(JSON.stringify({ sent, total: tokens.length, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
