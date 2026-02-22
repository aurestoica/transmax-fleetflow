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
    if (!callerRoles?.some(r => r.role === "owner")) throw new Error("Not authorized");

    const { action, user_id, full_name, email, phone, role } = await req.json();

    if (action === "update_profile") {
      // Update profile
      const updates: Record<string, string> = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (email !== undefined) updates.email = email;
      if (phone !== undefined) updates.phone = phone;

      const { error } = await supabaseAdmin.from("profiles").update(updates).eq("user_id", user_id);
      if (error) throw error;

      // Also update auth email if changed
      if (email) {
        await supabaseAdmin.auth.admin.updateUserById(user_id, { email });
      }

      // Update driver record if exists
      if (full_name || email || phone) {
        const driverUpdates: Record<string, string> = {};
        if (full_name) driverUpdates.full_name = full_name;
        if (email) driverUpdates.email = email;
        if (phone) driverUpdates.phone = phone;
        await supabaseAdmin.from("drivers").update(driverUpdates).eq("user_id", user_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "update_role") {
      // Remove existing roles
      await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
      // Insert new role
      const { error } = await supabaseAdmin.from("user_roles").insert({ user_id, role });
      if (error) throw error;

      // If new role is driver, ensure driver record exists
      if (role === "driver") {
        const { data: existing } = await supabaseAdmin.from("drivers").select("id").eq("user_id", user_id).single();
        if (!existing) {
          const { data: profile } = await supabaseAdmin.from("profiles").select("full_name, email").eq("user_id", user_id).single();
          await supabaseAdmin.from("drivers").insert({
            user_id,
            full_name: profile?.full_name || '',
            email: profile?.email || '',
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "delete") {
      // Prevent deleting yourself
      if (user_id === caller.id) throw new Error("Nu te poți șterge pe tine însuți");

      // Delete from auth (cascades to profiles, user_roles via FK)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (error) throw error;

      // Also clean up driver record
      await supabaseAdmin.from("drivers").delete().eq("user_id", user_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
