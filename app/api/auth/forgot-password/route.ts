import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { generateOtp, hashOtp } from "@/app/lib/otp";
import { sendOtpMail } from "@/app/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user (do not expose existence)
    const { data: user } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (!user) {
      return NextResponse.json({
        message: `User not found`,
      });
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    // Store OTP
    await supabase.from("password_reset_otps").insert({
      user_id: user.id,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send email
    await sendOtpMail(user.email, otp);

    return NextResponse.json({
      message: `OTP has been sent on ${email}`,
    });
  } catch (err: unknown) {
    console.error("OTP mail error:", err);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
