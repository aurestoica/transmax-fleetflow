import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is owner
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller } } = await supabaseUser.auth.getUser();
    if (!caller) throw new Error("Not authenticated");

    // Check if caller is owner
    const { data: callerRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", caller.id);
    if (!callerRoles?.some(r => r.role === "owner" || r.role === "platform_owner")) throw new Error("Not authorized");

    const { email, password, full_name, role, company_id } = await req.json();
    if (!email || !password || !full_name || !role) throw new Error("Missing fields");

    // Determine company_id: platform owners must specify; company owners use their own
    let targetCompanyId = company_id;
    if (!targetCompanyId) {
      const { data: callerProfile } = await supabaseAdmin.from("profiles").select("company_id").eq("user_id", caller.id).single();
      targetCompanyId = callerProfile?.company_id;
    }

    // Create user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (userError) throw userError;
    const userId = userData.user.id;

    // Assign role
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });

    // Set company on profile
    if (targetCompanyId) {
      await supabaseAdmin.from("profiles").update({ company_id: targetCompanyId }).eq("user_id", userId);
    }

    // If driver, create driver record
    if (role === "driver") {
      await supabaseAdmin.from("drivers").insert({
        user_id: userId,
        full_name,
        email,
        company_id: targetCompanyId,
      });
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
