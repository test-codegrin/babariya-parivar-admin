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
    const image = formData.get("profile_image") as File;

    if (
      !fullname ||
      !email ||
      !phone_no ||
      !password ||
      !village ||
      !city ||
      !image
    ) {
      return NextResponse.json(
        { error: "All fields are mandatory" },
        { status: 400 }
      );
    }
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${email},phone_no.eq.${phone_no}`)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Email or phone number already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const buffer = Buffer.from(await image.arrayBuffer());

    const upload = await imagekit.upload({
      file: buffer,
      fileName: `${phone_no}.jpg`,
      folder: "babariya-parivar/profile-images",
    });

    const { error } = await supabase.from("users").insert({
      fullname,
      email,
      phone_no,
      password: hashedPassword,
      village,
      city,
      profile_image_url: upload.url,
      profile_image_id: upload.fileId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Registration successful",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
