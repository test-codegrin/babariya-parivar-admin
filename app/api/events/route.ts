import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { imagekit } from "@/app/lib/imagekit";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const event_name = formData.get("event_name") as string;
    const event_details = formData.get("event_details") as string;
    const event_date = formData.get("event_date") as string;
    const event_time = formData.get("event_time") as string;

    const image = formData.get("event_image") as File;
    const detailsFile = formData.get("event_details_file") as File | null;

    if (
      !event_name ||
      !event_details ||
      !event_date ||
      !event_time ||
      !image
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    /* ---------------- Upload Event Image (Required) ---------------- */

    const imageBuffer = Buffer.from(await image.arrayBuffer());

    const imageUpload = await imagekit.upload({
      file: imageBuffer,
      fileName: `${Date.now()}-${image.name}`,
      folder: "babariya-parivar/event-image",
    });

    /* ---------------- Upload Details File (Optional) ---------------- */

    let detailsFileUrl: string | null = null;
    let detailsFileId: string | null = null;

    if (detailsFile) {
      const detailsBuffer = Buffer.from(
        await detailsFile.arrayBuffer()
      );

      const detailsUpload = await imagekit.upload({
        file: detailsBuffer,
        fileName: `${Date.now()}-${detailsFile.name}`,
        folder: "babariya-parivar/event-files",
      });

      detailsFileUrl = detailsUpload.url;
      detailsFileId = detailsUpload.fileId;
    }

    /* ---------------- Insert into Database ---------------- */

    const { error } = await supabase.from("events").insert({
      event_name,
      event_details,
      event_image_url: imageUpload.url,
      event_image_id: imageUpload.fileId,
      event_details_file_url: detailsFileUrl,
      event_details_file_id: detailsFileId,
      event_date,
      event_time,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Event created successfully",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Server error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      events: data,
    });
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
