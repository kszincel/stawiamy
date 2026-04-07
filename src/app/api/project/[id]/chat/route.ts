import { createClient } from "@/lib/supabase-server";

export const maxDuration = 180;

const ADMIN_EMAIL = "konrad@ikonmedia.pl";

const BASE_SYSTEM_PROMPT = `You are an AI assistant helping Konrad (admin of stawiamy.ai) work on client projects.

You have full context of this project and can MODIFY it using tools:
- update_brief - rewrite the markdown brief
- update_artifact - rewrite the technical artifact (n8n workflow JSON or component spec)
- update_missing_info - update the list of missing/blocking info from client
- update_recommended_actions - update the action checklist for Konrad
- update_status - change project status

When Konrad asks you to update something, USE THE TOOL. Don't just describe the change - apply it.
You can call multiple tools in sequence. After all tools are done, give a brief summary in Polish.

Be concise, technical, actionable. Output in Polish unless Konrad writes in English.
Use markdown for formatting in your text responses.`;

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
    contact: { name: project.contact_name, email: project.contact_email },
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
  return `${BASE_SYSTEM_PROMPT}\n\nCurrent project state:\n${JSON.stringify(ctx, null, 2)}`;
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "update_brief",
      description:
        "Update the markdown brief for this project. Use full markdown with ## headings, lists, **bold**.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "Full new brief in markdown (Polish)" },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_artifact",
      description:
        "Update the technical artifact (n8n workflow JSON or component spec). Pass full content as string.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "Full artifact content (JSON or markdown)" },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_missing_info",
      description: "Replace the list of missing info items needed from client.",
      parameters: {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "string" }, description: "List of missing info items in Polish" },
        },
        required: ["items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_recommended_actions",
      description: "Replace the list of recommended next actions for Konrad (admin).",
      parameters: {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "string" }, description: "List of action items in Polish" },
        },
        required: ["items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_status",
      description: "Change project status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: [
              "preview_generating",
              "preview_ready",
              "finalized",
              "deposit_paid",
              "in_progress",
              "delivered",
              "cancelled",
            ],
          },
        },
        required: ["status"],
      },
    },
  },
];

async function executeTool(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case "update_brief":
      await supabase
        .from("projects")
        .update({ ai_brief: String(args.content || "") })
        .eq("id", projectId);
      return "Brief zaktualizowany.";
    case "update_artifact":
      await supabase
        .from("projects")
        .update({ ai_artifact: String(args.content || "") })
        .eq("id", projectId);
      return "Artefakt zaktualizowany.";
    case "update_missing_info":
      await supabase
        .from("projects")
        .update({ ai_missing_info: Array.isArray(args.items) ? args.items : [] })
        .eq("id", projectId);
      return "Lista brakujących informacji zaktualizowana.";
    case "update_recommended_actions":
      await supabase
        .from("projects")
        .update({ ai_recommended_actions: Array.isArray(args.items) ? args.items : [] })
        .eq("id", projectId);
      return "Lista zalecanych akcji zaktualizowana.";
    case "update_status":
      await supabase
        .from("projects")
        .update({ status: String(args.status || "preview_ready") })
        .eq("id", projectId);
      return `Status zmieniony na ${args.status}.`;
    default:
      return `Nieznane narzędzie: ${toolName}`;
  }
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
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("project_messages")
    .select("id, role, content, metadata, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ messages: data || [] });
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { message?: string };
  const message = (body.message || "").trim();
  if (!message) {
    return Response.json({ error: "Wiadomość jest wymagana" }, { status: 400 });
  }

  // Fetch current project state
  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) throw new Error("Projekt nie istnieje");
    return data as ProjectRow;
  };

  let project = await fetchProject();

  // Fetch history
  const { data: history } = await supabase
    .from("project_messages")
    .select("role, content")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  // Save user message
  await supabase.from("project_messages").insert({
    project_id: id,
    role: "user",
    content: message,
  });

  // Build conversation
  const apiMessages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(project) },
    ...((history || []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content as string,
    })) as ChatMessage[]),
    { role: "user", content: message },
  ];

  // Tool-use loop (max 5 iterations to avoid runaway)
  const executedTools: string[] = [];
  let finalAssistantContent = "";

  for (let i = 0; i < 5; i++) {
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
          tools: TOOLS,
          tool_choice: "auto",
          max_tokens: 4000,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: `OpenRouter error ${response.status}: ${errorText}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const msg = choice?.message;

    if (!msg) {
      return Response.json({ error: "Pusta odpowiedź z modelu" }, { status: 500 });
    }

    // Add assistant message to conversation
    apiMessages.push({
      role: "assistant",
      content: msg.content || null,
      tool_calls: msg.tool_calls,
    });

    // If no tool calls, we're done
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      finalAssistantContent = (msg.content || "").trim();
      break;
    }

    // Execute tools
    for (const toolCall of msg.tool_calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        // ignore
      }
      const result = await executeTool(
        supabase,
        id,
        toolCall.function.name,
        args
      );
      executedTools.push(`${toolCall.function.name}: ${result}`);

      apiMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    // Refresh project state for next iteration
    project = await fetchProject();
    apiMessages[0] = { role: "system", content: buildSystemPrompt(project) };
  }

  if (!finalAssistantContent && executedTools.length === 0) {
    finalAssistantContent = "Brak odpowiedzi.";
  } else if (!finalAssistantContent) {
    finalAssistantContent = "Wykonano akcje:\n" + executedTools.map((t) => "- " + t).join("\n");
  }

  // Save assistant message
  const { data: assistantRow, error: insertErr } = await supabase
    .from("project_messages")
    .insert({
      project_id: id,
      role: "assistant",
      content: finalAssistantContent,
      metadata: executedTools.length > 0 ? { tools: executedTools } : {},
    })
    .select("role, content, metadata, created_at")
    .single();

  if (insertErr || !assistantRow) {
    return Response.json(
      { error: insertErr?.message || "Nie udało się zapisać odpowiedzi" },
      { status: 500 }
    );
  }

  return Response.json({ message: assistantRow });
}
