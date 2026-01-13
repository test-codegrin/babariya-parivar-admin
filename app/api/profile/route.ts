import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { getUserFromRequest } from "@/app/lib/auth";

export async function GET(req: Request) {
  try {

    const authUser = getUserFromRequest(req);
    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id, fullname, email, phone_no, village, city, profile_image_url, profile_image_id, created_at"
      )
      .eq("id", authUser.userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
