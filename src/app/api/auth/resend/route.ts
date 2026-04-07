import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email, projectId } = (await request.json()) as {
      email?: string;
      projectId?: string;
    };

    if (!email) {
      return Response.json({ error: "Email jest wymagany" }, { status: 400 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://stawiamy.vercel.app";
    const next = projectId ? `/dashboard/${projectId}` : "/dashboard";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      // Surface rate limit / other errors
      return Response.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      },
      { status: 500 }
    );
  }
}
