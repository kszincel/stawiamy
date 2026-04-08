import { createClient } from "@/lib/supabase-server";
import { after } from "next/server";

export const maxDuration = 300;

const ADMIN_EMAIL = "konrad@ikonmedia.pl";

const BASE_SYSTEM_PROMPT = `You are an AI assistant helping Konrad (admin of stawiamy.ai) work on client projects.

You have full context of this project and can MODIFY it using tools:
- update_brief - rewrite the markdown brief
- update_artifact - rewrite the technical artifact (n8n workflow JSON or component spec)
- update_missing_info - update the list of missing/blocking info from client
- update_recommended_actions - update the action checklist for Konrad
- update_status - change project status
- send_client_email - send a markdown email to the client (contact_email) via Resend
- notify_slack - post a message to the stawiamy.ai Slack channel (supports urgent flag)
- generate_n8n_workflow - generate a real importable n8n workflow JSON and save as artifact
- add_admin_note - append an admin-only note to the project

CRITICAL RULES FOR TOOL USE:
- When you say you're going to do something, you MUST actually use the tool to do it.
- NEVER write "wygenerowałem", "zaktualizowałem", "stworzyłem" without ACTUALLY calling the corresponding tool first.
- If Konrad asks for an n8n workflow, you MUST call generate_n8n_workflow tool. Don't just describe what the workflow would do.
- If Konrad asks to update brief/missing info/actions, USE THE TOOLS, don't write the new content in chat.
- After tools execute, briefly summarize what was changed (1-3 sentences max).
- If you have nothing to actually change, just answer the question without claiming you did anything.

CRITICAL RULES FOR ATTACHMENTS:
- The project may include attachments (PDFs, images, Word docs, spreadsheets) — their content is NOT always inlined below. Filename and type are listed, but binary file contents (PDF/image/Word/Excel) you cannot read directly.
- BEFORE marking ANY information as missing via update_missing_info: re-read the attachments list. If a topic could plausibly be covered in any attached file, DO NOT mark it as missing — instead, ask Konrad to verify, or assume it is present.
- Example: if a "doctorate.pdf" is attached and you're tempted to mark "structure of chapters" as missing — DON'T. The structure is almost certainly inside that PDF.
- Only mark info as missing when you are confident no attachment could contain it.

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

interface AttachmentMeta {
  url: string;
  filename: string;
  size: number;
  type: string;
}

const TEXT_MIME_PREFIXES = ["text/"];
const TEXT_MIME_EXACT = new Set([
  "application/json",
  "application/xml",
  "application/csv",
]);
const TEXT_EXTENSIONS = new Set(["txt", "md", "csv", "json", "xml", "html", "yaml", "yml"]);
const MAX_INLINE_CHARS_PER_FILE = 8000;

function isTextAttachment(a: AttachmentMeta): boolean {
  if (TEXT_MIME_PREFIXES.some((p) => a.type?.startsWith(p))) return true;
  if (TEXT_MIME_EXACT.has(a.type)) return true;
  const ext = a.filename.split(".").pop()?.toLowerCase() || "";
  return TEXT_EXTENSIONS.has(ext);
}

async function fetchTextContent(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length > MAX_INLINE_CHARS_PER_FILE) {
      return text.slice(0, MAX_INLINE_CHARS_PER_FILE) + `\n\n[...obcięto, łącznie ${text.length} znaków]`;
    }
    return text;
  } catch {
    return null;
  }
}

async function buildAttachmentsContext(raw: unknown): Promise<{
  metadata: AttachmentMeta[];
  inlinedContents: Array<{ filename: string; content: string }>;
}> {
  if (!Array.isArray(raw)) return { metadata: [], inlinedContents: [] };
  const list = raw as AttachmentMeta[];
  const inlined: Array<{ filename: string; content: string }> = [];

  await Promise.all(
    list.map(async (a) => {
      if (!a?.url || !a?.filename) return;
      if (!isTextAttachment(a)) return;
      const content = await fetchTextContent(a.url);
      if (content != null) {
        inlined.push({ filename: a.filename, content });
      }
    })
  );

  return { metadata: list, inlinedContents: inlined };
}

async function buildSystemPrompt(project: ProjectRow): Promise<string> {
  const { metadata, inlinedContents } = await buildAttachmentsContext(project.attachments);

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
    attachments: metadata,
    ai_brief: project.ai_brief || project.brief,
    ai_artifact: project.ai_artifact,
    missing_info: project.ai_missing_info,
    recommended_actions: project.ai_recommended_actions,
  };

  let attachmentsBlock = "";
  if (metadata.length > 0) {
    const binaryAttachments = metadata.filter((a) => !isTextAttachment(a));
    if (binaryAttachments.length > 0) {
      attachmentsBlock += `\n\nUWAGA: następujące załączniki są w formacie binarnym (PDF/obraz/Word/Excel) — nie widzisz ich treści, ale zakładaj że klient zawarł w nich kluczowe informacje. NIE oznaczaj jako brakujące rzeczy, które mogą być w tych plikach:\n${binaryAttachments
        .map((a) => `- ${a.filename} (${a.type})`)
        .join("\n")}`;
    }
    if (inlinedContents.length > 0) {
      attachmentsBlock += `\n\nTreść załączników tekstowych (rzeczywista zawartość plików):\n`;
      for (const f of inlinedContents) {
        attachmentsBlock += `\n--- ${f.filename} ---\n${f.content}\n--- koniec ${f.filename} ---\n`;
      }
    }
  }

  return `${BASE_SYSTEM_PROMPT}\n\nCurrent project state:\n${JSON.stringify(ctx, null, 2)}${attachmentsBlock}`;
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
  {
    type: "function",
    function: {
      name: "send_client_email",
      description:
        "Send an email to the project's contact_email via Resend. Body is markdown and will be converted to HTML.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", description: "Email subject in Polish" },
          body: { type: "string", description: "Email body in markdown (Polish)" },
        },
        required: ["subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "notify_slack",
      description:
        "Post a message to the stawiamy.ai Slack channel. Use urgent=true for critical alerts.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Message body in Polish" },
          urgent: { type: "boolean", description: "If true, prefix with alert emoji" },
        },
        required: ["message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_n8n_workflow",
      description:
        "Generate a real importable n8n workflow JSON based on a description. Saves as the project's artifact.",
      parameters: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "What the workflow should do (Polish or English)",
          },
        },
        required: ["description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_admin_note",
      description: "Append an admin-only note to the project (not visible to client).",
      parameters: {
        type: "object",
        properties: {
          note: { type: "string", description: "Note content in Polish" },
        },
        required: ["note"],
      },
    },
  },
];

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw;
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(
        "<li>" +
          line.replace(/^\s*[-*]\s+/, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") +
          "</li>"
      );
      continue;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
    if (/^##\s+/.test(line)) {
      out.push("<h2>" + line.replace(/^##\s+/, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") + "</h2>");
    } else if (line.trim() === "") {
      out.push("<br>");
    } else {
      out.push(line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") + "<br>");
    }
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

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
    case "send_client_email": {
      const subject = String(args.subject || "");
      const body = String(args.body || "");
      const { data: projectRow } = await supabase
        .from("projects")
        .select("contact_email")
        .eq("id", projectId)
        .single();
      const to = projectRow?.contact_email as string | null;
      if (!to) return "Błąd: projekt nie ma contact_email.";
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) return "Błąd: brak RESEND_API_KEY w środowisku.";
      const html = markdownToHtml(body);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: "konrad@ikonmedia.pl",
          to,
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        return `Błąd Resend ${res.status}: ${txt}`;
      }
      await supabase.from("client_emails").insert({
        project_id: projectId,
        subject,
        body,
      });
      return `Email wysłany do ${to}`;
    }
    case "notify_slack": {
      const message = String(args.message || "");
      const urgent = Boolean(args.urgent);
      const prefix = urgent ? "🚨 " : "";
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://stawiamy.ai";
      const projectLink = `${baseUrl}/dashboard/${projectId}`;
      const text = `${prefix}${message}\n<${projectLink}|Otwórz projekt>`;
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!slackWebhookUrl) return "Błąd: brak SLACK_WEBHOOK_URL.";
      const res = await fetch(
        slackWebhookUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blocks: [
              {
                type: "section",
                text: { type: "mrkdwn", text },
              },
            ],
          }),
        }
      );
      if (!res.ok) {
        return `Błąd Slack ${res.status}`;
      }
      return "Wiadomość wysłana na Slack.";
    }
    case "generate_n8n_workflow": {
      const description = String(args.description || "");
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) return "Błąd: brak OPENROUTER_API_KEY.";

      // Fetch project to include attachments + brief context
      const { data: projectCtx } = await supabase
        .from("projects")
        .select("attachments, ai_brief, brief, details, prompt")
        .eq("id", projectId)
        .single();

      const attachments = Array.isArray(projectCtx?.attachments)
        ? (projectCtx.attachments as Array<{ url: string; filename: string; type: string }>)
        : [];

      const attachmentsContext = attachments.length > 0
        ? `\n\nIMPORTANT - Klient załączył pliki, które workflow MUSI uwzględnić:\n${attachments
            .map((a) => `- ${a.filename} (${a.type}): ${a.url}`)
            .join("\n")}\n\nWorkflow MUSI zawierać nody które:\n1. Pobierają każdy z tych plików (HTTP Request node z URL)\n2. Parsują ich zawartość (Extract from File node dla PDF, Read Binary File etc.)\n3. Przekazują do AI jako context (Claude API supports document attachments natively - use HTTP Request to api.anthropic.com/v1/messages with document type in content)\n\nDodaj wyraźne komentarze w nazwach nodów które pliki obsługują.`
        : "";

      const projectContext = `\n\nKontekst projektu:\n- Original prompt: ${projectCtx?.prompt || ''}\n- Brief: ${(projectCtx?.ai_brief || projectCtx?.brief || '').substring(0, 800)}\n- Form details: ${JSON.stringify(projectCtx?.details || {}, null, 2).substring(0, 800)}`;

      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "anthropic/claude-sonnet-4",
            messages: [
              {
                role: "system",
                content:
                  "You are an n8n workflow expert. Generate a complete, importable n8n workflow JSON. Use real n8n node types like n8n-nodes-base.webhook, n8n-nodes-base.httpRequest, n8n-nodes-base.openAi, n8n-nodes-base.if, n8n-nodes-base.set, n8n-nodes-base.code, n8n-nodes-base.scheduleTrigger, n8n-nodes-base.extractFromFile, n8n-nodes-base.readBinaryFile. Each node needs: id, name, type, typeVersion, position, parameters. Workflow needs: name, nodes array, connections object, settings.\n\nCRITICAL JSON RULES:\n- Output MUST be 100% valid parseable JSON\n- ALL strings must be complete self-contained literals - NEVER use JavaScript concatenation (no + operator)\n- For long prompts inside node parameters, write them as single multi-line strings using \\n for newlines\n- For n8n expressions inside parameter values, use the n8n syntax as a string: \"={{ $json.field }}\" - never JS template literals\n- Escape all special characters properly\n- Test that your output is valid JSON before responding\n\nHARD-WON N8N RULES (follow these or the workflow will fail on first run):\n\n1. CODE NODES referencing data from BEFORE an HTTP node MUST use $('Node Name').first().json.field — never $json. HTTP responses overwrite $json and break downstream Code nodes that expect upstream data.\n\n2. BINARY DATA in Code nodes MUST be created via this.helpers.prepareBinaryData(buffer, fileName, mimeType). Never construct binary objects manually like { data: { data: base64, mimeType, fileName } } — n8n serializes raw Buffers as JSON {type:'Buffer',data:[...]} and HTTP nodes will send that literal JSON instead of bytes. Correct pattern:\n   const bin = await this.helpers.prepareBinaryData(Buffer.from(text,'utf8'), 'name.ext', 'mime/type');\n   return [{ json: {...}, binary: { data: bin } }];\n\n3. SUPABASE STORAGE uploads: use PUT (not POST), URL /storage/v1/object/<bucket>/<path> (no /public/ prefix on writes, /public/ only on reads), header x-upsert: true. Anon/publishable key cannot write without an RLS policy on storage.objects allowing insert+update where bucket_id matches — note this in workflow comments so user adds the policy.\n\n4. HTTP REQUEST nodes: during first run include options.response.response.neverError=true, fullResponse=true, responseFormat='text' so error bodies surface instead of generic 'Bad request' messages.\n\n5. SWITCH v3 nodes are buggy with caseSensitive — prefer two IF nodes in sequence instead.\n\n6. PARALLEL branches that meet at a Merge node frequently throw 'Node hasn't been executed' errors. Sequence steps when in doubt.\n\n7. OPENROUTER calls: use raw header Authorization: Bearer <token>, NOT predefinedCredentialType. Model id 'anthropic/claude-sonnet-4.5' works ('anthropic/claude-3.5-sonnet' returns 404).\n\n8. SUPABASE REST returns: handle both array and unwrapped object. Use: const row = Array.isArray(input) ? input[0] : input;\n\n9. AI JSON OUTPUTS in Code nodes: wrap JSON.parse in try/catch with regex fallback to extract items one by one, and bump max_tokens to 8000+ to avoid mid-array truncation.\n\n10. STATEFUL LONG-RUNNING workflows (iterative outputs like reports, books, theses, scrapers): use Schedule Trigger → Get state from Supabase → Decide Action (Code) → IF: state empty? → Init branch / IF: pending work? → Generate branch. Each branch ends with state save (PATCH to Supabase). Store state in generic columns (delivery_state jsonb, delivered_file_url text, delivered_file_name text, delivery_updated_at timestamptz) — never project-specific column names. Append each generated chunk to delivery_state.full_text and re-upload the deliverable file to Storage on every run.\n\n11. CRON minimum: 30 minutes. Shorter intervals risk overlap with long LLM calls.\n\nReturn ONLY the JSON object, no markdown fences, no commentary." +
                  projectContext +
                  attachmentsContext,
              },
              { role: "user", content: description },
            ],
            max_tokens: 16000,
          }),
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        return `Błąd OpenRouter ${res.status}: ${txt}`;
      }
      const data = await res.json();
      let content: string = data.choices?.[0]?.message?.content || "";
      content = content.trim();

      // Strip markdown code fences
      if (content.startsWith("```")) {
        content = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
      }

      // Try to extract first JSON object/array if there's surrounding text
      let parsed: { nodes?: unknown[] } | null = null;
      let cleanedContent = content;
      try {
        parsed = JSON.parse(content);
      } catch {
        // Find first { ... } block (greedy match for nested braces)
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
            cleanedContent = match[0];
          } catch {
            // Save raw content anyway as fallback
          }
        }
      }

      // Save whatever we got - even raw text is useful for admin to inspect
      await supabase
        .from("projects")
        .update({ ai_artifact: cleanedContent })
        .eq("id", projectId);

      if (parsed) {
        const nodeCount = Array.isArray(parsed?.nodes) ? parsed.nodes.length : 0;
        return `Wygenerowano workflow (${nodeCount} nodów)`;
      } else {
        return `Wygenerowano artefakt (${cleanedContent.length} znaków, parsing JSON nie powiódł się - zapisano raw content do inspekcji)`;
      }
    }
    case "add_admin_note": {
      const note = String(args.note || "");
      const { data: projectRow } = await supabase
        .from("projects")
        .select("admin_notes")
        .eq("id", projectId)
        .single();
      const existing = Array.isArray(projectRow?.admin_notes)
        ? (projectRow!.admin_notes as Array<{ content: string; created_at: string }>)
        : [];
      const updated = [
        ...existing,
        { content: note, created_at: new Date().toISOString() },
      ];
      await supabase
        .from("projects")
        .update({ admin_notes: updated })
        .eq("id", projectId);
      return "Notatka dodana";
    }
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

  // Insert placeholder assistant message - we'll update it in background
  const { data: placeholder } = await supabase
    .from("project_messages")
    .insert({
      project_id: id,
      role: "assistant",
      content: "",
      metadata: { processing: true },
    })
    .select("id, role, content, metadata, created_at")
    .single();

  // Build conversation
  const apiMessages: ChatMessage[] = [
    { role: "system", content: await buildSystemPrompt(project) },
    ...((history || []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content as string,
    })) as ChatMessage[]),
    { role: "user", content: message },
  ];

  // Run tool loop in background after returning response
  const placeholderId = placeholder?.id;
  after(async () => {
    if (!placeholderId) return;
    try {
      const result = await runToolLoop(supabase, id, apiMessages, fetchProject);
      await supabase
        .from("project_messages")
        .update({
          content: result.content,
          metadata:
            result.executedTools.length > 0
              ? { tools: result.executedTools }
              : {},
        })
        .eq("id", placeholderId);
    } catch (err) {
      await supabase
        .from("project_messages")
        .update({
          content:
            "Wystąpił błąd: " +
            (err instanceof Error ? err.message : "nieznany"),
          metadata: { error: true },
        })
        .eq("id", placeholderId);
    }
  });

  // Return placeholder immediately - frontend will poll
  return Response.json({
    message: placeholder,
    processing: true,
  });
}

async function runToolLoop(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  apiMessages: ChatMessage[],
  fetchProject: () => Promise<ProjectRow>
): Promise<{ content: string; executedTools: string[] }> {
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
      throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const msg = choice?.message;

    if (!msg) {
      throw new Error("Pusta odpowiedź z modelu");
    }

    apiMessages.push({
      role: "assistant",
      content: msg.content || null,
      tool_calls: msg.tool_calls,
    });

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      finalAssistantContent = (msg.content || "").trim();
      break;
    }

    for (const toolCall of msg.tool_calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        // ignore
      }
      const result = await executeTool(
        supabase,
        projectId,
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

    const refreshed = await fetchProject();
    apiMessages[0] = { role: "system", content: await buildSystemPrompt(refreshed) };
  }

  if (!finalAssistantContent && executedTools.length === 0) {
    finalAssistantContent = "Brak odpowiedzi.";
  } else if (!finalAssistantContent) {
    finalAssistantContent =
      "Wykonano akcje:\n" + executedTools.map((t) => "- " + t).join("\n");
  }

  return { content: finalAssistantContent, executedTools };
}
