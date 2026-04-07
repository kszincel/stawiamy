import LandingNav from "../../components/LandingNav";

export const metadata = {
  title: "Sales AI Agent — realizacje | stawiamy.ai",
  description:
    "Agent AI scrapujący LinkedIn, kwalifikujący leady i wysyłający spersonalizowane wiadomości outreach. Studium przypadku.",
};

function BackButton() {
  return (
    <a
      href="/#showcase"
      className="inline-flex items-center gap-2 text-sm text-[#adaaaa] hover:text-white transition-colors"
    >
      <span className="material-symbols-outlined text-base">arrow_back</span>
      Wróć do realizacji
    </a>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[0.5rem] border border-[#484847] bg-[#131313] p-8">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 font-[var(--font-plus-jakarta)]">
        {title}
      </h2>
      <div className="text-[#adaaaa] leading-relaxed space-y-3 text-sm md:text-base">
        {children}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#131313] border-t border-[#484847]/30 px-6 py-8 mt-24">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-0">
          <span className="text-lg font-bold tracking-tighter text-white font-[var(--font-inter)]">
            stawiamy
          </span>
          <span className="text-lg font-bold tracking-tighter text-[#81ecff] font-[var(--font-inter)]">
            .ai
          </span>
        </div>
        <span className="text-xs text-[#767575]">
          &copy; {new Date().getFullYear()} stawiamy.ai. Wszystkie prawa
          zastrzeżone.
        </span>
        <div className="flex items-center gap-6">
          <a
            href="/privacy"
            className="text-xs text-[#767575] hover:text-[#adaaaa] transition-colors"
          >
            Polityka prywatności
          </a>
          <a
            href="/terms"
            className="text-xs text-[#767575] hover:text-[#adaaaa] transition-colors"
          >
            Regulamin
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function SalesAiAgentPage() {
  const stack = [
    "n8n",
    "OpenAI GPT-4",
    "LinkedIn API",
    "Apollo.io",
    "Slack",
    "Google Sheets",
    "Postgres",
  ];

  const metrics = [
    { value: "200+", label: "leadów dziennie" },
    { value: "18h", label: "oszczędzone tygodniowo" },
    { value: "12%", label: "reply rate (vs 3% średniej)" },
    { value: "4.7x", label: "ROI w pierwszym kwartale" },
  ];

  return (
    <>
      <LandingNav />
      <main className="bg-[#0e0e0e] text-white">
        <div className="mx-auto max-w-4xl px-6 pt-32 pb-12">
          <BackButton />

          <header className="mt-8 mb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs uppercase tracking-wider text-[#c3f400] font-semibold">
                Realizacja
              </span>
              <span className="text-xs text-[#484847]">/</span>
              <span className="text-xs uppercase tracking-wider text-[#adaaaa]">
                Agent AI
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter font-[var(--font-plus-jakarta)] leading-[1.05] mb-6">
              Sales <span className="text-[#c3f400]">AI Agent</span>
            </h1>
            <p className="text-lg text-[#adaaaa] leading-relaxed max-w-2xl">
              Autonomiczny agent AI, który scrapuje LinkedIn, kwalifikuje leady
              według ICP i wysyła spersonalizowane wiadomości outreach. 200+
              leadów dziennie bez udziału człowieka.
            </p>
          </header>

          <div className="space-y-6">
            <Section title="Opis projektu">
              <p>
                Klient z branży B2B SaaS potrzebował skalowalnego procesu
                generowania leadów. Manualne wyszukiwanie kontaktów na LinkedIn,
                wzbogacanie ich danymi i pisanie spersonalizowanych wiadomości
                zajmowało zespołowi sprzedaży większość tygodnia. Zbudowaliśmy
                agenta, który robi to wszystko automatycznie.
              </p>
            </Section>

            <Section title="Wyzwanie">
              <p>
                Trzy główne bariery: niska skala (handlowiec dawał radę z
                ok. 30 leadami dziennie), niska jakość (brak konsekwentnej
                kwalifikacji ICP) i niski reply rate na generycznych
                wiadomościach (ok. 3%).
              </p>
              <p>
                Klient próbował już gotowych narzędzi typu Lemlist czy Apollo,
                ale żadne nie potrafiło połączyć enrichmentu, oceny dopasowania
                ICP przez LLM i kontekstowej personalizacji wiadomości w jeden
                spójny pipeline.
              </p>
            </Section>

            <Section title="Rozwiązanie">
              <p>
                Pipeline w n8n orkiestruje cały workflow. Agent pobiera profile
                z LinkedIn (na podstawie zdefiniowanych kryteriów), wzbogaca je
                przez Apollo.io, a następnie GPT-4 ocenia dopasowanie do ICP w
                skali 0-100 i generuje uzasadnienie.
              </p>
              <p>
                Leady powyżej 70 punktów trafiają do drugiego agenta, który
                analizuje ich aktywność (ostatnie posty, komentarze, zmiany
                stanowiska) i pisze spersonalizowaną wiadomość pierwszego
                kontaktu. Wszystko ląduje w Google Sheets do akceptacji + alert
                w Slacku dla handlowca.
              </p>
            </Section>

            <Section title="Stack techniczny">
              <div className="flex flex-wrap gap-2 not-prose">
                {stack.map((s) => (
                  <span
                    key={s}
                    className="text-xs font-medium text-white bg-[#1a1a1a] border border-[#484847] rounded-full px-3 py-1.5"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="Rezultat">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 not-prose mb-4">
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-4 text-center"
                  >
                    <div className="text-2xl md:text-3xl font-extrabold text-[#c3f400] font-[var(--font-plus-jakarta)]">
                      {m.value}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-[#adaaaa] mt-1">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
              <p>
                Po pierwszym miesiącu zespół klienta przestał ręcznie szukać
                leadów. Po trzech miesiącach pipeline wygenerował 14 podpisanych
                kontraktów o łącznej wartości przekraczającej koszt wdrożenia
                niemal 5-krotnie.
              </p>
            </Section>
          </div>

          <div className="mt-12 flex justify-center">
            <a
              href="/#cta"
              className="rounded-full bg-[#c3f400] px-8 py-4 text-sm font-bold text-[#455900] hover:bg-[#a8d400] transition-colors"
            >
              Chcę podobne rozwiązanie
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
