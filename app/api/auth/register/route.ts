import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { imagekit } from "@/app/lib/imagekit";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const fullname = formData.get("fullname") as string;
    const email = formData.get("email") as string;
    const phone_no = formData.get("phone_no") as string;
    const password = formData.get("password") as string;
    const village = formData.get("village") as string;
    const city = formData.get("city") as string;

    const image = formData.get("profile_image") as File | null;

    if (
      !fullname ||
      !email ||
      !phone_no ||
      !password ||
      !village ||
      !city
    ) {
      return NextResponse.json(
        { error: "All fields except profile image are mandatory" },
        { status: 400 }
      );
    }

    /* ---------------- Check Existing User ---------------- */

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${email},phone_no.eq.${phone_no}`)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "Email or phone number already exists" },
        { status: 409 }
      );
    }

    /* ---------------- Hash Password ---------------- */

    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---------------- Optional Image Upload ---------------- */

    let profileImageUrl: string | null = null;
    let profileImageId: string | null = null;

    if (image) {
      const buffer = Buffer.from(await image.arrayBuffer());

      const upload = await imagekit.upload({
        file: buffer,
        fileName: `${phone_no}-${Date.now()}.jpg`,
        folder: "babariya-parivar/profile-images",
      });

      profileImageUrl = upload.url;
      profileImageId = upload.fileId;
    }

    /* ---------------- Insert User ---------------- */

    const { error } = await supabase.from("users").insert({
      fullname,
      email,
      phone_no,
      password: hashedPassword,
      village,
      city,
      profile_image_url: profileImageUrl,
      profile_image_id: profileImageId,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Registration successful",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
