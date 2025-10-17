// app/api/onboard/route.ts
import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,            // uuid from supabase.auth.signUp result
      accountName,       // e.g., "Nelson's Garden"
      fullName,          // e.g., "Nelson Chen"
      locationLabel,     // e.g., "Backyard"
      city,              // e.g., "Irvine"
      region,            // e.g., "CA"
      lat,               // optional, can be null
      lng                // optional, can be null
    } = body;

    if (!userId || !accountName || !fullName || !locationLabel) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabase();

    const { data, error } = await supabase.rpc("onboard_user_tx", {
      p_user_id: userId,
      p_account_name: accountName,
      p_full_name: fullName,
      p_location_label: locationLabel,
      p_city: city ?? null,
      p_region: region ?? null,
      p_lat: lat ?? null,
      p_lng: lng ?? null
    });

    if (error) {
      console.error("RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, result: data });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
