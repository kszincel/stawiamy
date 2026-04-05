import { supabase } from "@/lib/supabase";
import { stitch } from "@google/stitch-sdk";

export const maxDuration = 300;

interface Classification {
  product_type: "website" | "app" | "automation" | "digital_product";
  package: "digital_product" | "start" | "standard" | "custom";
  estimated_price: number;
  deposit_amount: number;
  description: string;
  features: string[];
  timeline: string;
}

async function classifyPrompt(prompt: string): Promise<Classification> {
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

Odpowiedz TYLKO prawidłowym JSON-em (bez markdown, bez backticks):
{
  "product_type": "website" | "app" | "automation" | "digital_product",
  "package": "digital_product" | "start" | "standard" | "custom",
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

async function enhancePromptForStitch(
  prompt: string,
  classification: Classification
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
          {
            role: "system",
            content: `Jesteś designerem UI/UX. Na podstawie opisu klienta, napisz szczegółowy prompt dla generatora UI.

Prompt powinien być PO ANGIELSKU i zawierać:
- Typ strony/aplikacji i jej cel
- Sekcje i układ (hero, features, pricing, etc.)
- Styl wizualny (nowoczesny, ciemny motyw, jasny, minimalistyczny)
- Przykładowe treści (nagłówki, opisy, CTA)
- Kolorystykę (zaproponuj spójną paletę)

Napisz TYLKO prompt, bez dodatkowych komentarzy. Maks 500 słów.`,
          },
          {
            role: "user",
            content: `Opis klienta: ${prompt}\n\nTyp produktu: ${classification.product_type}\nPakiet: ${classification.package}\nOpis: ${classification.description}`,
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
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { error: "Prompt jest wymagany" },
        { status: 400 }
      );
    }

    // Step 1: Classify the prompt
    const classification = await classifyPrompt(prompt);

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
    const enhancedPrompt = await enhancePromptForStitch(prompt, classification);

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
