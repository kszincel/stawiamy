import { supabase } from "@/lib/supabase";
import { stitch } from "@google/stitch-sdk";
import { after } from "next/server";

export const maxDuration = 300;

type PackageType =
  | "digital_product"
  | "start"
  | "standard"
  | "custom"
  | "redesign"
  | "automation"
  | "agent";

type ProductType =
  | "website"
  | "app"
  | "automation"
  | "agent"
  | "digital_product"
  | "redesign";

type PreviewType = "design" | "brief";

interface Attachment {
  url: string;
  filename: string;
  size: number;
  type: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function describeAttachmentType(type: string): string {
  if (type === "application/pdf") return "PDF";
  if (type.startsWith("image/")) return "Obraz";
  if (type.includes("word")) return "Word";
  if (type === "text/plain") return "Tekst";
  if (type === "text/markdown") return "Markdown";
  return type;
}

function attachmentsBlock(attachments?: Attachment[]): string {
  if (!attachments || attachments.length === 0) return "";
  const lines = attachments
    .map(
      (a) =>
        `- ${a.filename} (${describeAttachmentType(a.type)}, ${formatFileSize(a.size)})`
    )
    .join("\n");
  return `\n\nKlient załączył pliki:\n${lines}`;
}

interface Classification {
  product_type: ProductType;
  package: PackageType;
  preview_type: PreviewType;
  estimated_price: number;
  deposit_amount: number;
  description: string;
  features: string[];
  timeline: string;
}

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1500
): Promise<string> {
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
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function classifyPrompt(
  prompt: string,
  hasImages: boolean,
  hasUrl: boolean
): Promise<Classification> {
  const context = hasImages || hasUrl
    ? "\nUWAGA: Klient podał istniejącą stronę (URL lub screeny) - to prawdopodobnie redesign."
    : "";

  const systemPrompt = `Jesteś ekspertem od wyceny projektów IT. Sklasyfikuj projekt klienta i wycen go.

Zasady klasyfikacji:
- Prosty kalkulator, formularz, narzędzie online → product_type: "digital_product", package: "digital_product", 299 PLN, preview_type: "design"
- Pojedynczy landing page, portfolio, wizytówka → product_type: "website", package: "start", 999 PLN, preview_type: "design"
- Wielostronicowa aplikacja z auth/bazą danych → product_type: "app", package: "standard", 2999 PLN, preview_type: "design"
- Złożony system (CRM, marketplace, platforma) → product_type: "app", package: "custom", 4999+ PLN, preview_type: "design"
- Redesign istniejącej strony/aplikacji → product_type: "redesign", package: "redesign", 799 PLN, preview_type: "design"
- Automatyzacja, integracja, workflow, bot, scraper → product_type: "automation", package: "automation", 499 PLN, preview_type: "brief"
- Agent AI (np. agent do pisania artykułów, agent researcher, agent obsługi klienta) → product_type: "agent", package: "agent", 499 PLN, preview_type: "brief"

WAŻNE:
- preview_type "design" = produkty wymagające UI (Stitch wygeneruje wizualny preview)
- preview_type "brief" = automatyzacje/agenty bez UI (zostanie wygenerowany opisowy brief techniczny)
- deposit_amount = 30% ceny, zaokrąglone do całości

Odpowiedz TYLKO prawidłowym JSON-em (bez markdown, bez backticks):
{
  "product_type": "...",
  "package": "...",
  "preview_type": "design" | "brief",
  "estimated_price": number,
  "deposit_amount": number,
  "description": "1-2 zdania po polsku",
  "features": ["3-5 kluczowych elementów po polsku"],
  "timeline": "szacowany czas po polsku (dla automation/agent ZAWSZE '24-72h', dla digital_product '24-72h', dla website 'do 7 dni', dla app/custom '7-14 dni', dla redesign '3-7 dni')"
}${context}`;

  const content = await callOpenRouter(systemPrompt, prompt, 800);
  const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned) as Classification;
}

async function enhancePromptForStitch(
  prompt: string,
  classification: Classification,
  sourceUrl?: string,
  attachments?: Attachment[]
): Promise<string> {
  void attachments;
  const redesignContext = sourceUrl
    ? `\n\nThis is a REDESIGN of an existing site: ${sourceUrl}. Improve the design while keeping the core purpose. Modernize layout, typography, colors.`
    : "";

  const isApp = classification.product_type === "app";
  const screenType = isApp ? "Web app dashboard/main screen" : "Desktop website landing page";
  const layoutHint = isApp
    ? "Full desktop browser layout - sidebar navigation, main content area, header bar."
    : "Full desktop website layout (1440px wide). Top navigation bar, hero section with large headline, content sections stacked vertically, footer.";

  const systemPrompt = `You are a senior UI/UX designer writing prompts for Google Stitch (AI UI generator).

CRITICAL RULES:
1. ALWAYS design for DESKTOP (1440px wide). Never describe mobile screens, never mention "app screens" or "mobile". Stitch tends to default to mobile - you MUST counteract this by being explicit about desktop layout.
2. Start the prompt with "Desktop website" or "Desktop web app" - this primes Stitch correctly.
3. Make it FEEL premium and unique, not template-like. Inject personality through specific copy and visual choices.

Stitch prompt best practices (from official guide):
- Be SPECIFIC: screen type, sections, content, visual style
- Use ADJECTIVES for the vibe ("vibrant and encouraging", "minimalist and focused", "premium and editorial", "bold and confident")
- Describe COLOR PALETTE precisely (hex codes or specific moods like "deep navy with electric coral accents")
- Describe TYPOGRAPHY (specific font moods - "geometric sans-serif", "editorial serif", "tight tracking, heavy weight")
- Describe IMAGERY style ("macro photography", "abstract gradients", "editorial portrait photography", "isometric illustrations")
- Mention SPECIFIC UI components (hero with X, bento grid features, pricing cards, testimonials, etc.)
- Include CONCRETE example copy (real headlines and CTAs, not placeholders)
- Focus on ONE primary screen (the homepage/landing/main view)
- Avoid generic templates - be opinionated about the unique angle

OUTPUT FORMAT:
Start with "Desktop ${isApp ? "web app" : "website"} for [purpose]."
Then describe vibe, sections, colors, typography, imagery, example copy.
Write in ENGLISH. Max 400 words. Output the prompt directly, no markdown.`;

  const userPrompt = `Client request (translate to English if Polish): "${prompt}"

Classification:
- Type: ${classification.product_type}
- Description: ${classification.description}
- Key features: ${classification.features.join(", ")}${redesignContext}

TASK: Write a Stitch prompt for ${screenType}. ${layoutHint}

Make it specific, premium, and unique to this client. Avoid generic "modern app" templates - inject character matching the client's actual idea. Use confident, specific copy in your example headlines (not "Welcome to X" or "Discover Y" - real, opinionated copy).`;

  return callOpenRouter(systemPrompt, userPrompt, 800);
}

async function generateBrief(
  prompt: string,
  classification: Classification,
  attachments?: Attachment[]
): Promise<string> {
  const systemPrompt = `Jesteś senior automation engineer / AI engineer. Klient opisał potrzebę automatyzacji lub agenta AI.

Pisz PROSTYM językiem - klient niekoniecznie zna się na IT. Unikaj angielskich określeń, korpo-żargonu i nazw technologii (n8n, OpenAI, API, webhook, workflow itp.). Skup się na tym CO robi rozwiązanie, nie JAK technicznie.

Twoim zadaniem jest napisanie krótkiego, klarownego briefu po polsku, który:
1. Definiuje cel i co rozwiązanie zrobi dla klienta (1-2 zdania)
2. Opisuje jak to będzie działać krok po kroku (max 5 punktów, prostym językiem)
3. Wskazuje co klient musi dostarczyć (dostępy, materiały, przykłady)

Format markdown:
**Cel:** ...

**Jak to będzie działać:**
1. ...
2. ...

**Co potrzebujemy od Ciebie:** [lista]

**Czas wdrożenia:** 24-72h

NIE pisz o: integracjach, modelach AI, używanych narzędziach, architekturze. Klient tego nie potrzebuje wiedzieć.
Maks 200 słów. Bez marketingowego bełkotu. Konkret.`;

  const userPrompt = `Klient prosi o: ${prompt}

Klasyfikacja: ${classification.product_type} (${classification.package})
Opis: ${classification.description}
Kluczowe elementy: ${classification.features.join(", ")}${attachmentsBlock(attachments)}

Napisz brief techniczny. Jeśli klient załączył pliki, odnieś się do nich w briefie (np. wskaż gdzie zostaną wykorzystane jako źródło danych lub kontekst).`;

  return callOpenRouter(systemPrompt, userPrompt, 1200);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, attachments, url } = body as {
      prompt: string;
      attachments?: Attachment[];
      url?: string;
    };
    const imageAttachments = (attachments || []).filter((a) =>
      a.type.startsWith("image/")
    );

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Prompt jest wymagany" }, { status: 400 });
    }

    // Step 1: Classify (fast - ~3s)
    const classification = await classifyPrompt(
      prompt,
      imageAttachments.length > 0,
      Boolean(url)
    );

    // Step 2: Insert into Supabase
    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        prompt,
        product_type: classification.product_type,
        package: classification.package,
        preview_type: classification.preview_type,
        estimated_price: classification.estimated_price,
        deposit_amount: classification.deposit_amount,
        description: classification.description,
        features: classification.features,
        timeline: classification.timeline,
        source_url: url || null,
        source_images: imageAttachments.length
          ? imageAttachments.map((a) => a.url)
          : null,
        attachments: attachments?.length ? attachments : [],
        status: "preview_generating",
        ai_classification: classification,
      })
      .select()
      .single();

    if (insertError || !project) {
      console.error("Supabase insert error:", insertError);
      return Response.json(
        {
          error: `Nie udało się utworzyć projektu: ${insertError?.message || "unknown"}`,
        },
        { status: 500 }
      );
    }

    // Step 3: Heavy work in background via after()
    after(async () => {
      try {
        const updates: Record<string, unknown> = {};

        if (classification.preview_type === "brief") {
          const brief = await generateBrief(prompt, classification, attachments);
          updates.brief = brief;
        } else {
          try {
            const enhancedPrompt = await enhancePromptForStitch(
              prompt,
              classification,
              url,
              attachments
            );

            const shortPrompt =
              prompt.length > 60 ? prompt.substring(0, 60) + "..." : prompt;
            const stitchProject = await stitch.createProject(
              `Client: ${shortPrompt}`
            );
            const screen = await stitchProject.generate(
              enhancedPrompt,
              "DESKTOP"
            );
            const previewUrl = await screen.getImage();
            const htmlUrl = await screen.getHtml();

            updates.stitch_project_id = stitchProject.id;
            updates.stitch_screen_id = screen.id;
            updates.preview_screenshot_url = previewUrl;
            updates.preview_html_url = htmlUrl;
          } catch (stitchError) {
            console.error("Stitch error:", stitchError);
          }
        }

        updates.status = "preview_ready";

        await supabase
          .from("projects")
          .update(updates)
          .eq("id", project.id);
      } catch (bgError) {
        console.error("Background generation error:", bgError);
        await supabase
          .from("projects")
          .update({ status: "preview_ready" })
          .eq("id", project.id);
      }
    });

    return Response.json({ projectId: project.id });
  } catch (error) {
    console.error("Generate error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      },
      { status: 500 }
    );
  }
}
