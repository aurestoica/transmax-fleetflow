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

    // Create admin user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: "stoica.aure@gmail.com",
      password: "Antonia123!",
      email_confirm: true,
      user_metadata: { full_name: "Administrator" }
    });

    if (userError && !userError.message.includes("already been registered")) {
      throw userError;
    }

    let userId = userData?.user?.id;

    if (!userId) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(u => u.email === "stoica.aure@gmail.com");
      userId = existing?.id;
    }

    if (!userId) throw new Error("Could not find or create user");

    // Assign owner role
    await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "owner" }, { onConflict: "user_id,role" });

    // Update profile
    await supabaseAdmin.from("profiles").upsert({
      user_id: userId,
      full_name: "Administrator",
      email: "stoica.aure@gmail.com"
    }, { onConflict: "user_id" });

    // Seed demo data
    const { data: clients } = await supabaseAdmin.from("clients").insert([
      { company_name: "Ibérica Logistics SL", cif: "B12345678", address: "Calle Mayor 10, Madrid, España", contact_name: "Carlos Ruiz", contact_email: "carlos@iberica.es", contact_phone: "+34 612 345 678", rate_per_km: 1.45 }
    ]).select();

    const { data: drivers } = await supabaseAdmin.from("drivers").insert([
      { full_name: "Ion Popescu", phone: "+40 722 111 222", email: "ion.popescu@transmaxsib.ro", status: "available", license_number: "SB-123456", license_expiry: "2027-06-15" },
      { full_name: "Mihai Ionescu", phone: "+40 733 222 333", email: "mihai.ionescu@transmaxsib.ro", status: "available", license_number: "SB-654321", license_expiry: "2026-12-01" }
    ]).select();

    const { data: vehicles } = await supabaseAdmin.from("vehicles").insert([
      { plate_number: "SB-01-TMS", vin: "WDB96340310876543", model: "Mercedes Actros 1845", year: 2022, avg_consumption: 28.5, capacity_tons: 24, status: "available", itp_expiry: "2026-09-15", rca_expiry: "2026-03-01" },
      { plate_number: "SB-02-TMS", vin: "XLR0998HGFJ074521", model: "DAF XF 480", year: 2021, avg_consumption: 30.0, capacity_tons: 24, status: "available", itp_expiry: "2026-11-20", rca_expiry: "2026-05-15" }
    ]).select();

    const { data: trailers } = await supabaseAdmin.from("trailers").insert([
      { plate_number: "SB-03-TMS", type: "Prelată", capacity_tons: 24, status: "available", itp_expiry: "2027-01-10" },
    ]).select();

    if (clients?.[0] && drivers?.[0] && vehicles?.[0]) {
      await supabaseAdmin.from("trips").insert([
        {
          client_id: clients[0].id,
          driver_id: drivers[0].id,
          vehicle_id: vehicles[0].id,
          trailer_id: trailers?.[0]?.id,
          status: "in_transit",
          pickup_address: "Sibiu, România",
          pickup_date: new Date(Date.now() - 2 * 86400000).toISOString(),
          delivery_address: "Madrid, España",
          delivery_date: new Date(Date.now() + 1 * 86400000).toISOString(),
          cargo_type: "Piese auto",
          weight_tons: 18.5,
          distance_km: 2850,
          revenue: 4200,
          fuel_cost: 1200,
          road_taxes: 350,
          other_expenses: 150,
          driver_advance: 500
        },
        {
          client_id: clients[0].id,
          driver_id: drivers[1].id,
          vehicle_id: vehicles[1].id,
          status: "planned",
          pickup_address: "Barcelona, España",
          pickup_date: new Date(Date.now() + 3 * 86400000).toISOString(),
          delivery_address: "Cluj-Napoca, România",
          delivery_date: new Date(Date.now() + 5 * 86400000).toISOString(),
          cargo_type: "Mobilier",
          weight_tons: 12.0,
          distance_km: 2200,
          revenue: 3500,
          fuel_cost: 950,
          road_taxes: 280,
          other_expenses: 100,
          driver_advance: 400
        },
        {
          client_id: clients[0].id,
          status: "planned",
          pickup_address: "Timișoara, România",
          pickup_date: new Date(Date.now() + 7 * 86400000).toISOString(),
          delivery_address: "Valencia, España",
          delivery_date: new Date(Date.now() + 10 * 86400000).toISOString(),
          cargo_type: "Textile",
          weight_tons: 8.5,
          distance_km: 2650,
          revenue: 3800
        }
      ]);
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
