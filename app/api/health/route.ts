import { supabase } from "@/app/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { error } = await supabase
      .from("users") // system table
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "unhealthy",
          api: "running",
          database: "disconnected",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: "healthy",
        api: "running",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error";

    return Response.json(
      {
        status: "unhealthy",
        error: message,
      },
      { status: 500 }
    );
  }
}
