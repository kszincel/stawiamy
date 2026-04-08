import ChatInput from "./components/ChatInput";
import LandingNav from "./components/LandingNav";

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
      <div className="mesh-gradient" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl gap-8">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter font-[var(--font-plus-jakarta)] leading-[1.05]">
          Twój pomysł.
          <br />
          <span className="text-[#81ecff]">Gotowy produkt</span> w 48h.
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-[#adaaaa] leading-relaxed">
          Strony, aplikacje, automatyzacje, agenty AI. Opisz czego potrzebujesz - dostajesz preview lub brief w kilka minut.
        </p>

        <ChatInput variant="hero" />

        <div className="flex items-center gap-6 text-sm text-[#adaaaa]">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c3f400]" />
            Preview za darmo
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c3f400]" />
            Bez zobowiązań
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c3f400]" />
            Bez karty kredytowej
          </span>
        </div>
      </div>
    </section>
  );
}

function Differentiator() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter font-[var(--font-plus-jakarta)] text-center mb-16">
          Dlaczego nie kolejny AI builder?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* AI Builder card */}
          <div className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-8 opacity-40 grayscale">
            <h3 className="text-xl font-bold line-through text-[#adaaaa] mb-6">
              AI Builder
            </h3>
            <ul className="space-y-4">
              {[
                "Generyczny kod bez kontroli jakości",
                "Brak designu - wyglądają jak template",
                "Sam musisz hostować, konfigurować, debugować",
                "Zero wsparcia po wygenerowaniu",
                "Ograniczony do prostych stron",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-[#adaaaa]"
                >
                  <span className="text-[#ff716c] mt-0.5 shrink-0">
                    &#x2715;
                  </span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* stawiamy.ai card */}
          <div className="relative rounded-[0.5rem] border border-[#81ecff]/30 bg-[#1a1a1a] p-8 shadow-[0_0_40px_-12px_rgba(129,236,255,0.15)] md:-rotate-1 md:translate-y-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">stawiamy.ai</h3>
              <span className="rounded-full bg-[#c3f400] px-3 py-1 text-xs font-bold text-[#455900]">
                Premium
              </span>
            </div>
            <ul className="space-y-4">
              {[
                "Ręcznie dopracowany design i UX",
                "Responsywne, szybkie, zoptymalizowane",
                "Hosting, domena, SSL - wszystko w cenie",
                "Wsparcie i poprawki po wdrożeniu",
                "Strony, aplikacje, automatyzacje, API",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-white">
                  <span className="text-[#81ecff] mt-0.5 shrink-0">
                    &#x2713;
                  </span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Opisz czego potrzebujesz",
      desc: "Wpisz swój pomysł i dodaj pliki, jeśli masz. Im więcej szczegółów, tym lepszy efekt.",
      icon: "chat",
    },
    {
      num: "02",
      title: "Podgląd w kilka minut",
      desc: "Generujemy wizualizację (dla stron i aplikacji) lub plan działania (dla automatyzacji i agentów).",
      icon: "auto_awesome",
      filled: true,
      iconColor: "text-[#c3f400]",
    },
    {
      num: "03",
      title: "Gotowy produkt w 48h",
      desc: "Dostajesz dzialajacy produkt - z hostingem, domena i wsparciem.",
      icon: "rocket_launch",
    },
  ];

  return (
    <section id="how-it-works" className="bg-[#131313] px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter font-[var(--font-plus-jakarta)] text-center mb-16">
          Jak to działa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className="group relative rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-8 hover:border-[#767575] transition-all"
            >
              <span className="text-6xl font-extrabold text-white/5 group-hover:text-[#81ecff]/20 transition-colors font-[var(--font-plus-jakarta)] absolute top-4 right-6">
                {step.num}
              </span>
              <div className="relative z-10">
                <span
                  className={`material-symbols-outlined text-3xl mb-6 block ${step.filled ? "filled" : ""} ${step.iconColor || "text-[#81ecff]"}`}
                >
                  {step.icon}
                </span>
                <h3 className="text-lg font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-[#adaaaa] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter font-[var(--font-plus-jakarta)] text-center mb-16">
          Oferta
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:grid-rows-2">
          {/* Strony i aplikacje - large */}
          <div className="md:col-span-1 md:row-span-2 rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-8 flex flex-col justify-between min-h-[320px] hover:border-[#81ecff]/30 transition-colors">
            <div>
              <span className="material-symbols-outlined text-4xl text-[#81ecff] mb-4 block">
                web
              </span>
              <h3 className="text-2xl font-bold text-white mb-3">
                Strony i aplikacje
              </h3>
              <p className="text-sm text-[#adaaaa] leading-relaxed">
                Landing page, aplikacje webowe, dashboardy, panele administracyjne.
                Od prostych stron po rozbudowane systemy.
              </p>
            </div>
            <div className="mt-6">
              <span className="text-sm text-[#adaaaa]">od</span>
              <span className="text-3xl font-extrabold text-white ml-2 font-[var(--font-plus-jakarta)]">
                999 PLN
              </span>
            </div>
          </div>

          {/* Automatyzacje */}
          <div className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-8 flex flex-col justify-between min-h-[150px] hover:border-[#c3f400]/30 transition-colors">
            <div>
              <span className="material-symbols-outlined text-3xl text-[#c3f400] mb-4 block">
                bolt
              </span>
              <h3 className="text-xl font-bold text-white mb-2">
                Automatyzacje
              </h3>
              <p className="text-sm text-[#adaaaa] leading-relaxed">
                Łączymy Twoje narzędzia tak, żeby same wykonywały powtarzalną robotę: pobieranie danych, wysyłanie powiadomień, raporty, synchronizacje.
              </p>
            </div>
            <div className="mt-4">
              <span className="text-sm text-[#adaaaa]">od</span>
              <span className="text-2xl font-extrabold text-white ml-2 font-[var(--font-plus-jakarta)]">
                499 PLN
              </span>
            </div>
          </div>

          {/* Agenty AI */}
          <div className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-8 flex flex-col justify-between min-h-[150px] hover:border-[#c3f400]/30 transition-colors">
            <div>
              <span className="material-symbols-outlined text-3xl text-[#c3f400] mb-4 block">
                smart_toy
              </span>
              <h3 className="text-xl font-bold text-white mb-2">
                Agenty AI
              </h3>
              <p className="text-sm text-[#adaaaa] leading-relaxed">
                Agenty do researchu, pisania, obsługi klienta, automatyzacji powtarzalnych zadań intelektualnych. Z dostępem do narzędzi i wiedzy.
              </p>
            </div>
            <div className="mt-4">
              <span className="text-sm text-[#adaaaa]">od</span>
              <span className="text-2xl font-extrabold text-white ml-2 font-[var(--font-plus-jakarta)]">
                499 PLN
              </span>
            </div>
          </div>

          {/* Produkty cyfrowe */}
          <div className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-8 flex flex-col justify-between min-h-[150px] hover:border-[#70aaff]/30 transition-colors">
            <div>
              <span className="material-symbols-outlined text-3xl text-[#70aaff] mb-4 block">
                widgets
              </span>
              <h3 className="text-xl font-bold text-white mb-2">
                Produkty cyfrowe
              </h3>
              <p className="text-sm text-[#adaaaa] leading-relaxed">
                Narzędzia, kalkulatory, formularze, mikro-appki. Szybkie
                rozwiązania na konkretny problem.
              </p>
            </div>
            <div className="mt-4">
              <span className="text-sm text-[#adaaaa]">od</span>
              <span className="text-2xl font-extrabold text-white ml-2 font-[var(--font-plus-jakarta)]">
                299 PLN
              </span>
            </div>
          </div>

          {/* Redesign */}
          <div className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-8 flex flex-col justify-between min-h-[150px] hover:border-[#81ecff]/30 transition-colors">
            <div>
              <span className="material-symbols-outlined text-3xl text-[#81ecff] mb-4 block">
                refresh
              </span>
              <h3 className="text-xl font-bold text-white mb-2">
                Redesign
              </h3>
              <p className="text-sm text-[#adaaaa] leading-relaxed">
                Odświeżamy istniejące strony i aplikacje. Wrzuć URL lub screeny i powiedz co chcesz poprawić.
              </p>
            </div>
            <div className="mt-4">
              <span className="text-sm text-[#adaaaa]">od</span>
              <span className="text-2xl font-extrabold text-white ml-2 font-[var(--font-plus-jakarta)]">
                799 PLN
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-[#adaaaa] mt-8">
          Czas i cena zależą od złożoności projektu - od 48h dla prostych narzędzi po kilka tygodni dla rozbudowanych systemów. Po analizie Twojego pomysłu zaproponujemy konkretny pakiet i wycenę.
        </p>
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section id="showcase" className="bg-[#000000] px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter font-[var(--font-plus-jakarta)] text-center mb-16">
          Zrealizowane projekty
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brewpilot - featured (left, large) */}
          <a
            href="https://brewpilot.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="md:col-span-2 md:row-span-2 group rounded-[0.5rem] border border-[#484847] bg-[#131313] overflow-hidden hover:border-[#81ecff]/30 transition-colors flex flex-col"
          >
            <div className="relative flex-1 min-h-[300px] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://api.microlink.io/?url=https://brewpilot.vercel.app&screenshot=true&meta=false&embed=screenshot.url"
                alt="Brewpilot - AI coffee brewing assistant"
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-white">Brewpilot</h3>
                <span className="material-symbols-outlined text-base text-[#adaaaa] group-hover:text-[#81ecff] transition-colors">
                  arrow_outward
                </span>
              </div>
              <p className="text-sm text-[#adaaaa] leading-relaxed">
                AI coffee brewing assistant. Skanuje opakowanie kawy, dobiera ustawienia młynka i prowadzi krok po kroku przez parzenie.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {["Next.js", "Supabase", "Claude AI"].map((t) => (
                  <span key={t} className="text-[10px] uppercase tracking-wider text-[#adaaaa] bg-[#1a1a1a] border border-[#484847] rounded-full px-2 py-0.5">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </a>

          {/* Makao Online */}
          <a
            href="https://makao.kszincel.partykit.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-[0.5rem] border border-[#484847] bg-[#131313] overflow-hidden hover:border-[#81ecff]/30 transition-colors flex flex-col"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://api.microlink.io/?url=https://makao.kszincel.partykit.dev&screenshot=true&meta=false&embed=screenshot.url"
                alt="Makao Online - multiplayer card game"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-5 flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Makao Online</h3>
                <span className="material-symbols-outlined text-sm text-[#adaaaa] group-hover:text-[#81ecff] transition-colors">
                  arrow_outward
                </span>
              </div>
              <p className="text-xs text-[#adaaaa] leading-relaxed">
                Wieloosobowa gra karciana online. Real-time multiplayer.
              </p>
              <div className="flex flex-wrap gap-1 mt-auto pt-1">
                {["Next.js", "PartyKit"].map((t) => (
                  <span key={t} className="text-[9px] uppercase tracking-wider text-[#adaaaa] bg-[#1a1a1a] border border-[#484847] rounded-full px-1.5 py-0.5">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </a>

          {/* Sales AI Agent */}
          <a
            href="/realizacje/sales-ai-agent"
            className="group rounded-[0.5rem] border border-[#484847] bg-[#131313] overflow-hidden hover:border-[#c3f400]/30 transition-colors flex flex-col"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#1a2200] via-[#0e1610] to-[#0a1a1f]">
              {/* Decorative dashboard mockup */}
              <div className="absolute inset-0 p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff716c]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c3f400]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#81ecff]" />
                </div>
                <div className="flex-1 grid grid-cols-3 gap-1.5">
                  <div className="bg-[#c3f400]/10 border border-[#c3f400]/20 rounded p-1.5 flex flex-col gap-0.5">
                    <div className="text-[7px] text-[#c3f400] uppercase tracking-wide">Leady</div>
                    <div className="text-[14px] font-bold text-white">247</div>
                  </div>
                  <div className="bg-[#81ecff]/10 border border-[#81ecff]/20 rounded p-1.5 flex flex-col gap-0.5">
                    <div className="text-[7px] text-[#81ecff] uppercase tracking-wide">Reply</div>
                    <div className="text-[14px] font-bold text-white">12%</div>
                  </div>
                  <div className="bg-[#70aaff]/10 border border-[#70aaff]/20 rounded p-1.5 flex flex-col gap-0.5">
                    <div className="text-[7px] text-[#70aaff] uppercase tracking-wide">ROI</div>
                    <div className="text-[14px] font-bold text-white">4.7x</div>
                  </div>
                </div>
                <div className="bg-[#1a1a1a]/60 border border-[#484847]/40 rounded p-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[12px] text-[#c3f400]">smart_toy</span>
                  <div className="flex-1 h-0.5 bg-[#484847] rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-[#c3f400] to-[#81ecff]" />
                  </div>
                  <span className="text-[8px] text-[#adaaaa]">running</span>
                </div>
              </div>
            </div>
            <div className="p-5 flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Sales AI Agent</h3>
                <span className="material-symbols-outlined text-sm text-[#adaaaa] group-hover:text-[#c3f400] transition-colors">
                  arrow_outward
                </span>
              </div>
              <p className="text-xs text-[#adaaaa] leading-relaxed">
                Agent AI scrapuje LinkedIn, kwalifikuje leady, wysyła outreach.
              </p>
              <div className="flex flex-wrap gap-1 mt-auto pt-1">
                {["n8n", "OpenAI"].map((t) => (
                  <span key={t} className="text-[9px] uppercase tracking-wider text-[#adaaaa] bg-[#1a1a1a] border border-[#484847] rounded-full px-1.5 py-0.5">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    {
      quote:
        "Prosiłem o kalkulator marży dla kawiarni. Dostałem działający produkt w jeden wieczór. Stawiamy.ai to game changer dla małych firm.",
      name: "Marek K.",
      title: "Founder, kawiarnia",
      initials: "MK",
      color: "#81ecff",
      textColor: "#005762",
    },
    {
      quote:
        "Zamiast 3 tygodni pracy z agencją, dostałam landing page w 48h. I to taki, że konkurencja pyta kto nam to zrobił.",
      name: "Anna W.",
      title: "Marketing Manager",
      initials: "AW",
      color: "#c3f400",
      textColor: "#455900",
    },
    {
      quote:
        "Automatyzacja outreachu LinkedIn której potrzebowałem od miesięcy. Postawiona w 2 dni, działa perfekcyjnie. Polecam każdemu.",
      name: "Piotr D.",
      title: "CEO startupu",
      initials: "PD",
      color: "#70aaff",
      textColor: "#0a2455",
    },
  ];

  return (
    <section id="testimonials" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter font-[var(--font-plus-jakarta)] text-center mb-16">
          Co mówią klienci
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t) => (
            <div
              key={t.name}
              className="rounded-[0.5rem] border border-[#484847] bg-[#131313] p-6 flex flex-col gap-5"
            >
              <div className="flex items-center gap-1 text-[#c3f400]">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined filled text-lg"
                  >
                    star
                  </span>
                ))}
              </div>
              <p className="text-sm text-white italic leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-auto pt-2 border-t border-[#484847]/40">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: t.color, color: t.textColor }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {t.name}
                  </div>
                  <div className="text-xs text-[#adaaaa]">{t.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cta" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl flex flex-col items-center text-center gap-8">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter font-[var(--font-plus-jakarta)]">
          Masz pomysł? Zróbmy to.
        </h2>

        <ChatInput variant="hero" />

        <p className="text-sm text-[#adaaaa]">
          Lub napisz na{" "}
          <a
            href="mailto:konrad@ikonmedia.pl"
            className="text-[#81ecff] hover:underline"
          >
            konrad@ikonmedia.pl
          </a>
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#131313] border-t border-[#484847]/30 px-6 py-8">
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

export default function Home() {
  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <Differentiator />
        <HowItWorks />
        <Services />
        <Showcase />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
