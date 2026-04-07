import { createClient } from "@/lib/supabase-server";

export const maxDuration = 120;

const ADMIN_EMAIL = "konrad@ikonmedia.pl";

const BASE_SYSTEM_PROMPT = `You are an AI assistant helping Konrad (admin of stawiamy.ai) work on client projects.

You have full context of this project:
- Original client prompt
- AI classification (description, features, timeline, package, price)
- Client form details (target users, tech preferences, etc.)
- Attachments uploaded by client
- AI-generated brief (markdown)
- AI-generated artifact (n8n workflow spec or component list)
- Missing info / questions for client
- Recommended actions

Konrad will ask you questions or give instructions. Help him:
- Refine the brief or artifact
- Generate code snippets, file structures, n8n workflow JSON, prompts
- Suggest implementation strategies
- Draft client communications
- Answer questions about the project

Be concise, technical, and actionable. Output in Polish unless Konrad writes in English.
Use markdown for formatting (## headings, \`\`\`code blocks\`\`\`, **bold**, lists).`;

interface ProjectRow {
  id: string;
  prompt: string | null;
  product_type: string | null;
  package: string | null;
  estimated_price: number | null;
  deposit_amount: number | null;
  description: string | null;
  features: unknown;
  timeline: string | null;
  details: unknown;
  attachments: unknown;
  source_url: string | null;
  ai_brief: string | null;
  brief: string | null;
  ai_artifact: unknown;
  ai_missing_info: unknown;
  ai_recommended_actions: unknown;
  contact_name: string | null;
  contact_email: string | null;
  status: string | null;
}

function buildSystemPrompt(project: ProjectRow): string {
  const ctx = {
    id: project.id,
    status: project.status,
    contact: {
      name: project.contact_name,
      email: project.contact_email,
    },
    product_type: project.product_type,
    package: project.package,
    estimated_price: project.estimated_price,
    deposit_amount: project.deposit_amount,
    description: project.description,
    features: project.features,
    timeline: project.timeline,
    original_prompt: project.prompt,
    source_url: project.source_url,
    form_details: project.details,
    attachments: project.attachments,
    ai_brief: project.ai_brief || project.brief,
    ai_artifact: project.ai_artifact,
    missing_info: project.ai_missing_info,
    recommended_actions: project.ai_recommended_actions,
  };
  return `${BASE_SYSTEM_PROMPT}\n\nProject context:\n${JSON.stringify(ctx, null, 2)}`;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return { supabase, user: null as null };
  }
  return { supabase, user };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("project_messages")
    .select("id, role, content, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ messages: data || [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { message?: string };
  const message = (body.message || "").trim();
  if (!message) {
    return Response.json({ error: "Wiadomość jest wymagana" }, { status: 400 });
  }

  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (projectErr || !project) {
    return Response.json({ error: "Projekt nie został znaleziony" }, { status: 404 });
  }

  const { data: history, error: histErr } = await supabase
    .from("project_messages")
    .select("role, content")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  if (histErr) {
    return Response.json({ error: histErr.message }, { status: 500 });
  }

  const { error: insertUserErr } = await supabase.from("project_messages").insert({
    project_id: id,
    role: "user",
    content: message,
  });
  if (insertUserErr) {
    return Response.json({ error: insertUserErr.message }, { status: 500 });
  }

  const systemPrompt = buildSystemPrompt(project as ProjectRow);
  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...(history || []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content as string,
    })),
    { role: "user", content: message },
  ];

  let assistantContent = "";
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4",
          messages: apiMessages,
          max_tokens: 4000,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    assistantContent = (data.choices?.[0]?.message?.content || "").trim();
    if (!assistantContent) {
      throw new Error("Pusta odpowiedź z modelu");
    }
  } catch (err) {
    console.error("Chat OpenRouter error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Błąd modelu" },
      { status: 500 }
    );
  }

  const { data: assistantRow, error: insertAssistantErr } = await supabase
    .from("project_messages")
    .insert({
      project_id: id,
      role: "assistant",
      content: assistantContent,
    })
    .select("role, content, created_at")
    .single();

  if (insertAssistantErr || !assistantRow) {
    return Response.json(
      { error: insertAssistantErr?.message || "Nie udało się zapisać odpowiedzi" },
      { status: 500 }
    );
  }

  return Response.json({ message: assistantRow });
}
