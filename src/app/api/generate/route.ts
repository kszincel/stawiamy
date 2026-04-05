import { supabase } from "@/lib/supabase";
import { stitch } from "@google/stitch-sdk";

export const maxDuration = 300;

interface Classification {
  product_type: "website" | "app" | "automation" | "digital_product" | "redesign";
  package: "digital_product" | "start" | "standard" | "custom" | "redesign";
  estimated_price: number;
  deposit_amount: number;
  description: string;
  features: string[];
  timeline: string;
}

async function classifyPrompt(prompt: string, hasImages: boolean, hasUrl: boolean): Promise<Classification> {
  const redesignHint = (hasImages || hasUrl)
    ? "\n\nUWAGA: Klient przesłał screenshoty istniejącej strony lub podał URL - to prawdopodobnie zlecenie redesignu/ulepszenia."
    : "";

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
          {
            role: "system",
            content: `Jesteś ekspertem od wyceny projektów IT. Na podstawie opisu klienta, sklasyfikuj projekt i wycen go.

Zasady klasyfikacji:
- Prosty kalkulator, formularz, narzędzie online -> digital_product, 299 PLN
- Pojedynczy landing page, portfolio, wizytówka -> start, 999 PLN
- Wielostronicowa aplikacja z auth/bazą danych -> standard, 2999 PLN
- Złożony system (CRM, marketplace, platforma) -> custom, 4999 PLN lub więcej
- Automatyzacja, integracja, bot, workflow -> automation, 499 PLN
- Redesign, ulepszenie istniejącej strony/aplikacji (klient podaje URL lub screeny) -> redesign, od 799 PLN${redesignHint}

Odpowiedz TYLKO prawidłowym JSON-em (bez markdown, bez backticks):
{
  "product_type": "website" | "app" | "automation" | "digital_product" | "redesign",
  "package": "digital_product" | "start" | "standard" | "custom" | "redesign",
  "estimated_price": number (PLN),
  "deposit_amount": number (30% ceny, zaokrąglone),
  "description": "1-2 zdania po polsku opisujące co zostanie zbudowane",
  "features": ["3-5 kluczowych funkcji po polsku"],
  "timeline": "szacowany czas realizacji po polsku, np. '48 godzin', '5-7 dni'"
}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  return JSON.parse(content) as Classification;
}

async function fetchScreenshotFromUrl(url: string): Promise<string | null> {
  try {
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
    const res = await fetch(microlinkUrl);
    if (res.ok) {
      // Microlink with embed=screenshot.url redirects to the image URL
      return res.url || microlinkUrl;
    }
    return null;
  } catch {
    return null;
  }
}

async function enhancePromptForStitch(
  prompt: string,
  classification: Classification,
  url?: string
): Promise<string> {
  const existingSiteContext = url
    ? `\n\nThe client wants to redesign/improve an existing website at: ${url}. Use this as reference for the current state, but create a significantly improved version with modern design.`
    : "";

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
          {
            role: "system",
            content: `Jesteś designerem UI/UX. Na podstawie opisu klienta, napisz szczegółowy prompt dla generatora UI.

Prompt powinien być PO ANGIELSKU i zawierać:
- Typ strony/aplikacji i jej cel
- Sekcje i układ (hero, features, pricing, etc.)
- Styl wizualny (nowoczesny, ciemny motyw, jasny, minimalistyczny)
- Przykładowe treści (nagłówki, opisy, CTA)
- Kolorystykę (zaproponuj spójną paletę)
${classification.product_type === "redesign" ? "\nThis is a REDESIGN project. Focus on improving the existing design while keeping the brand identity. Highlight what should change and what should stay." : ""}
Napisz TYLKO prompt, bez dodatkowych komentarzy. Maks 500 słów.`,
          },
          {
            role: "user",
            content: `Opis klienta: ${prompt}\n\nTyp produktu: ${classification.product_type}\nPakiet: ${classification.package}\nOpis: ${classification.description}${existingSiteContext}`,
          },
        ],
        max_tokens: 800,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function POST(request: Request) {
  try {
    const { prompt, images, url } = await request.json() as {
      prompt: string;
      images?: string[];
      url?: string;
    };

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { error: "Prompt jest wymagany" },
        { status: 400 }
      );
    }

    const hasImages = Array.isArray(images) && images.length > 0;
    const hasUrl = typeof url === "string" && url.length > 0;

    // Fetch screenshot of existing site if URL provided
    let sourceScreenshotUrl: string | null = null;
    if (hasUrl) {
      sourceScreenshotUrl = await fetchScreenshotFromUrl(url);
    }

    // Step 1: Classify the prompt
    const classification = await classifyPrompt(prompt, hasImages, hasUrl);

    // Step 2: Create Supabase record
    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        prompt,
        product_type: classification.product_type,
        package: classification.package,
        estimated_price: classification.estimated_price,
        deposit_amount: classification.deposit_amount,
        description: classification.description,
        features: classification.features,
        timeline: classification.timeline,
        status: "preview_generating",
        source_url: url || null,
        source_images: hasImages ? images : null,
      })
      .select()
      .single();

    if (insertError || !project) {
      console.error("Supabase insert error:", insertError);
      return Response.json(
        { error: "Nie udało się utworzyć projektu" },
        { status: 500 }
      );
    }

    // Step 3: Enhance prompt for Stitch
    const enhancedPrompt = await enhancePromptForStitch(prompt, classification, url || undefined);

    // Step 4: Generate design with Stitch
    const shortPrompt =
      prompt.length > 60 ? prompt.substring(0, 60) + "..." : prompt;
    const stitchProject = await stitch.createProject(
      `Client: ${shortPrompt}`
    );
    const screen = await stitchProject.generate(enhancedPrompt, "DESKTOP");
    const imageUrl = await screen.getImage();
    const htmlUrl = await screen.getHtml();

    // Step 5: Update Supabase record with Stitch results
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        stitch_project_id: stitchProject.id,
        stitch_screen_id: screen.id,
        screenshot_url: imageUrl,
        html_url: htmlUrl,
        status: "preview_ready",
      })
      .eq("id", project.id);

    if (updateError) {
      console.error("Supabase update error:", updateError);
    }

    return Response.json({
      projectId: project.id,
      classification,
      previewUrl: imageUrl,
      htmlUrl,
      sourceScreenshotUrl,
      sourceUrl: url || null,
    });
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
