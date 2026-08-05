import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { error } = await supabase
    .from("products")
    .select("id")
    .limit(1);

  return NextResponse.json({
    ok: !error,
    timestamp: new Date().toISOString(),
  });
}