import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabase } from "@/app/lib/supabaseClient";

export async function POST(req: Request) {
  const { resetToken, newPassword } = await req.json();

  if (!resetToken || !newPassword) {
    return NextResponse.json(
      { error: "Reset token and new password required" },
      { status: 400 }
    );
  }

  const { data: record } = await supabase
    .from("password_reset_otps")
    .select("id, user_id")
    .eq("reset_token", resetToken)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!record) {
    return NextResponse.json(
      { error: "Invalid or expired reset token" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await supabase
    .from("users")
    .update({ password: hashedPassword })
    .eq("id", record.user_id);

  // Delete token after successful reset
  await supabase
    .from("password_reset_otps")
    .delete()
    .eq("id", record.id);

  return NextResponse.json({
    message: "Password reset successful",
  });
}
