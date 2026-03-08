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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Create platform owner: stoica.aure@yahoo.com
    const { data: platformData, error: platformError } = await supabaseAdmin.auth.admin.createUser({
      email: "stoica.aure@yahoo.com",
      password: "Antonia123!",
      email_confirm: true,
      user_metadata: { full_name: "Platform Owner" }
    });

    let platformUserId = platformData?.user?.id;
    if (platformError && platformError.message.includes("already been registered")) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      platformUserId = existingUsers?.users?.find(u => u.email === "stoica.aure@yahoo.com")?.id;
    } else if (platformError) {
      throw platformError;
    }

    if (platformUserId) {
      // Remove any existing roles and set platform_owner
      await supabaseAdmin.from("user_roles").delete().eq("user_id", platformUserId);
      await supabaseAdmin.from("user_roles").insert({ user_id: platformUserId, role: "platform_owner" });
      await supabaseAdmin.from("profiles").upsert({
        user_id: platformUserId,
        full_name: "Platform Owner",
        email: "stoica.aure@yahoo.com"
      }, { onConflict: "user_id" });
    }

    // 2. Fix gmail account: make it company owner (not platform_owner)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const gmailUser = existingUsers?.users?.find(u => u.email === "stoica.aure@gmail.com");
    
    if (gmailUser) {
      // Remove platform_owner, set owner
      await supabaseAdmin.from("user_roles").delete().eq("user_id", gmailUser.id);
      await supabaseAdmin.from("user_roles").insert({ user_id: gmailUser.id, role: "owner" });

      // Ensure company exists and assign
      let { data: companies } = await supabaseAdmin.from("companies").select("id").eq("name", "TRANS MAX SIB");
      let companyId = companies?.[0]?.id;

      if (!companyId) {
        const { data: newCompany } = await supabaseAdmin.from("companies").insert({
          name: "TRANS MAX SIB",
          cif: "RO12345678",
          address: "Sibiu, România",
          contact_email: "stoica.aure@gmail.com"
        }).select().single();
        companyId = newCompany?.id;
      }

      if (companyId) {
        await supabaseAdmin.from("profiles").update({ company_id: companyId }).eq("user_id", gmailUser.id);
        
        // Assign existing drivers, vehicles, trailers, clients, trips to this company if unassigned
        await supabaseAdmin.from("drivers").update({ company_id: companyId }).is("company_id", null);
        await supabaseAdmin.from("vehicles").update({ company_id: companyId }).is("company_id", null);
        await supabaseAdmin.from("trailers").update({ company_id: companyId }).is("company_id", null);
        await supabaseAdmin.from("clients").update({ company_id: companyId }).is("company_id", null);
        await supabaseAdmin.from("trips").update({ company_id: companyId }).is("company_id", null);
      }
    } else {
      // Create gmail user as company owner
      const { data: userData } = await supabaseAdmin.auth.admin.createUser({
        email: "stoica.aure@gmail.com",
        password: "Antonia123!",
        email_confirm: true,
        user_metadata: { full_name: "Administrator" }
      });

      if (userData?.user) {
        await supabaseAdmin.from("user_roles").insert({ user_id: userData.user.id, role: "owner" });
        
        let { data: companies } = await supabaseAdmin.from("companies").select("id").eq("name", "TRANS MAX SIB");
        let companyId = companies?.[0]?.id;
        if (!companyId) {
          const { data: newCompany } = await supabaseAdmin.from("companies").insert({
            name: "TRANS MAX SIB", cif: "RO12345678", address: "Sibiu, România", contact_email: "stoica.aure@gmail.com"
          }).select().single();
          companyId = newCompany?.id;
        }
        if (companyId) {
          await supabaseAdmin.from("profiles").update({ company_id: companyId }).eq("user_id", userData.user.id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, platformUserId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
