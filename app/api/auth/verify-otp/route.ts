import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { hashOtp } from "@/app/lib/otp";
import { generateResetToken } from "@/app/lib/resetToken";

export async function POST(req: Request) {
  const { email, otp } = await req.json();

  if (!email || !otp) {
    return NextResponse.json(
      { error: "Email and OTP required" },
      { status: 400 }
    );
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) {
    return NextResponse.json(
      { error: "Invalid OTP" },
      { status: 400 }
    );
  }

  const otpHash = hashOtp(otp);

  const { data: otpRecord } = await supabase
    .from("password_reset_otps")
    .select("id")
    .eq("user_id", user.id)
    .eq("otp_hash", otpHash)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (!otpRecord) {
    return NextResponse.json(
      { error: "Invalid or expired OTP" },
      { status: 400 }
    );
  }

  const resetToken = generateResetToken();

  // Replace OTP with reset token
  await supabase
    .from("password_reset_otps")
    .update({ reset_token: resetToken })
    .eq("id", otpRecord.id);

  return NextResponse.json({
    message: "OTP verified",
    resetToken,
  });
}
