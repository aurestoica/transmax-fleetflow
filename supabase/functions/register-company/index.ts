import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const {
      company_name,
      company_cif,
      company_address,
      company_email,
      company_phone,
      admin_email,
      admin_password,
      admin_full_name,
    } = await req.json();

    // Validate required fields
    if (!company_name?.trim()) throw new Error("Numele companiei este obligatoriu");
    if (!admin_email?.trim()) throw new Error("Email-ul administratorului este obligatoriu");
    if (!admin_password || admin_password.length < 6) throw new Error("Parola trebuie să aibă minim 6 caractere");
    if (!admin_full_name?.trim()) throw new Error("Numele administratorului este obligatoriu");

    // Check if email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === admin_email.trim().toLowerCase());
    if (emailExists) throw new Error("Acest email este deja înregistrat");

    // 1. Create the company (inactive, pending approval)
    const { data: newCompany, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: company_name.trim(),
        cif: company_cif?.trim() || null,
        address: company_address?.trim() || null,
        contact_email: company_email?.trim() || null,
        contact_phone: company_phone?.trim() || null,
        is_active: false,
        pending_approval: true,
      })
      .select()
      .single();

    if (companyError) throw companyError;

    // 2. Create the admin user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: admin_email.trim(),
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: admin_full_name.trim() },
    });

    if (userError) {
      // Rollback: delete the company
      await supabaseAdmin.from("companies").delete().eq("id", newCompany.id);
      throw userError;
    }

    const userId = userData.user.id;

    // 3. Assign owner role
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "owner" });

    // 4. Set company on profile
    await supabaseAdmin
      .from("profiles")
      .update({ company_id: newCompany.id, full_name: admin_full_name.trim() })
      .eq("user_id", userId);

    // 5. Notify platform owners
    const { data: platformOwners } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "platform_owner");

    if (platformOwners && platformOwners.length > 0) {
      const notifications = platformOwners.map((po) => ({
        user_id: po.user_id,
        title: "Cerere companie nouă",
        message: `${company_name.trim()} (${admin_full_name.trim()} - ${admin_email.trim()}) solicită activarea contului.`,
        entity_type: "company",
        entity_id: newCompany.id,
      }));
      await supabaseAdmin.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({ success: true, companyId: newCompany.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
