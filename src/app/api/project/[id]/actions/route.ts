import { createClient } from "@/lib/supabase-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as { completed?: unknown };

  if (!Array.isArray(body.completed)) {
    return Response.json(
      { error: "completed musi być tablicą" },
      { status: 400 }
    );
  }

  const completed = body.completed.filter(
    (x): x is string => typeof x === "string"
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email !== "konrad@ikonmedia.pl") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("projects")
    .update({ completed_actions: completed })
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, completed });
}
