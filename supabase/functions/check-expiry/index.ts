import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExpiryItem {
  entity_type: string;
  entity_id: string;
  entity_label: string;
  expiry_date: string;
  detail: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thresholds = [30, 15, 7]; // plus daily (0-6 days)

    // Collect all items with expiry dates
    const items: ExpiryItem[] = [];

    // 1. Vehicles: rca_expiry, itp_expiry, insurance_expiry
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, plate_number, rca_expiry, itp_expiry, insurance_expiry");

    for (const v of vehicles || []) {
      if (v.rca_expiry) {
        items.push({
          entity_type: "vehicle_rca",
          entity_id: v.id,
          entity_label: v.plate_number,
          expiry_date: v.rca_expiry,
          detail: `RCA pentru ${v.plate_number}`,
        });
      }
      if (v.itp_expiry) {
        items.push({
          entity_type: "vehicle_itp",
          entity_id: v.id,
          entity_label: v.plate_number,
          expiry_date: v.itp_expiry,
          detail: `ITP pentru ${v.plate_number}`,
        });
      }
      if (v.insurance_expiry) {
        items.push({
          entity_type: "vehicle_insurance",
          entity_id: v.id,
          entity_label: v.plate_number,
          expiry_date: v.insurance_expiry,
          detail: `CASCO pentru ${v.plate_number}`,
        });
      }
    }

    // 2. Trailers: itp_expiry
    const { data: trailers } = await supabase
      .from("trailers")
      .select("id, plate_number, itp_expiry");

    for (const t of trailers || []) {
      if (t.itp_expiry) {
        items.push({
          entity_type: "trailer_itp",
          entity_id: t.id,
          entity_label: t.plate_number,
          expiry_date: t.itp_expiry,
          detail: `ITP remorcă ${t.plate_number}`,
        });
      }
    }

    // 3. Drivers: license_expiry, tachograph_expiry
    const { data: drivers } = await supabase
      .from("drivers")
      .select("id, full_name, license_expiry, tachograph_expiry");

    for (const d of drivers || []) {
      if (d.license_expiry) {
        items.push({
          entity_type: "driver_license",
          entity_id: d.id,
          entity_label: d.full_name,
          expiry_date: d.license_expiry,
          detail: `Permis ${d.full_name}`,
        });
      }
      if (d.tachograph_expiry) {
        items.push({
          entity_type: "driver_tachograph",
          entity_id: d.id,
          entity_label: d.full_name,
          expiry_date: d.tachograph_expiry,
          detail: `Card tahograf ${d.full_name}`,
        });
      }
    }

    // 4. Documents with expiry_date
    const { data: docs } = await supabase
      .from("documents")
      .select("id, name, expiry_date, doc_category")
      .not("expiry_date", "is", null);

    for (const doc of docs || []) {
      if (doc.expiry_date) {
        items.push({
          entity_type: "document",
          entity_id: doc.id,
          entity_label: doc.name,
          expiry_date: doc.expiry_date,
          detail: `Document: ${doc.name}`,
        });
      }
    }

    let notificationsSent = 0;

    for (const item of items) {
      const expiryDate = new Date(item.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Skip if already expired more than 1 day ago (don't spam old ones)
      if (daysUntil < 0) continue;

      // Determine which threshold to notify for
      let notifyDaysBefore: number | null = null;

      if (daysUntil <= 6) {
        // Daily notifications: use the exact daysUntil as the key
        notifyDaysBefore = daysUntil;
      } else {
        // Check fixed thresholds
        for (const t of thresholds) {
          if (daysUntil <= t && daysUntil > (t === 30 ? 15 : t === 15 ? 7 : 6)) {
            notifyDaysBefore = t;
            break;
          }
        }
      }

      if (notifyDaysBefore === null) continue;

      // Check if already notified for this threshold
      const { data: existing } = await supabase
        .from("expiry_notifications_sent")
        .select("id")
        .eq("entity_type", item.entity_type)
        .eq("entity_id", item.entity_id)
        .eq("expiry_date", item.expiry_date)
        .eq("days_before", notifyDaysBefore)
        .maybeSingle();

      if (existing) continue;

      // Build notification message
      let urgency = "";
      let emoji = "📋";
      if (daysUntil === 0) {
        urgency = "EXPIRĂ AZI";
        emoji = "🔴";
      } else if (daysUntil <= 3) {
        urgency = `expiră în ${daysUntil} zile`;
        emoji = "🔴";
      } else if (daysUntil <= 7) {
        urgency = `expiră în ${daysUntil} zile`;
        emoji = "🟠";
      } else if (daysUntil <= 15) {
        urgency = `expiră în ${daysUntil} zile`;
        emoji = "🟡";
      } else {
        urgency = `expiră în ${daysUntil} zile`;
        emoji = "📋";
      }

      const title = `${emoji} ${item.detail} — ${urgency}`;
      const message = `${item.detail} expiră pe ${new Date(item.expiry_date).toLocaleDateString("ro-RO")}. Vă rugăm actualizați documentul.`;

      // Determine entity routing for notification click
      let entityType = "document";
      let entityId = item.entity_id;
      if (item.entity_type.startsWith("vehicle_")) {
        entityType = "vehicle";
      } else if (item.entity_type.startsWith("trailer_")) {
        entityType = "trailer";
      } else if (item.entity_type.startsWith("driver_")) {
        entityType = "driver";
      }

      // Notify all admins using the DB function
      const { error: notifyError } = await supabase.rpc("notify_admins", {
        _title: title,
        _message: message,
        _entity_type: entityType,
        _entity_id: entityId,
      });

      if (!notifyError) {
        // Record that we sent this notification
        await supabase.from("expiry_notifications_sent").insert({
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          expiry_date: item.expiry_date,
          days_before: notifyDaysBefore,
        });
        notificationsSent++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: items.length,
        notifications_sent: notificationsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
