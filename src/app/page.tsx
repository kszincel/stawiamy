import Image from "next/image";
import ChatInput from "./components/ChatInput";

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e]/60 backdrop-blur-xl border-b border-[#484847]/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-0">
          <span className="text-xl font-bold tracking-tighter text-white font-[var(--font-inter)]">
            stawiamy
          </span>
          <span className="text-xl font-bold tracking-tighter text-[#81ecff] font-[var(--font-inter)]">
            .ai
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#how-it-works"
            className="text-sm text-[#adaaaa] hover:text-white transition-colors"
          >
            Jak to działa
          </a>
          <a
            href="#services"
            className="text-sm text-[#adaaaa] hover:text-white transition-colors"
          >
            Oferta
          </a>
          <a
            href="#showcase"
            className="text-sm text-[#adaaaa] hover:text-white transition-colors"
          >
            Realizacje
          </a>
        </div>

        <a
          href="#cta"
          className="rounded-full bg-[#1a1a1a] border border-[#484847] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#262626] transition-colors"
        >
          Wyślij zapytanie
        </a>
      </div>
    </nav>
  );
}

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
          AI buildery generują kod. My budujemy dopracowane produkty - od
          pomysłu do gotowej strony, aplikacji lub automatyzacji.
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
      desc: "Wpisz swój pomysł w chat lub wyślij brief. Im więcej szczegółów, tym lepszy efekt.",
      icon: "chat",
    },
    {
      num: "02",
      title: "Preview w kilka minut",
      desc: "Generujemy wizualny podgląd Twojego produktu. Sprawdzasz, komentujesz, iterujemy.",
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:grid-rows-2">
          {/* Strony i aplikacje - large */}
          <div className="md:col-span-2 md:row-span-2 rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-8 flex flex-col justify-between min-h-[320px] hover:border-[#81ecff]/30 transition-colors">
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
          <div className="md:col-span-2 rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-8 flex flex-col justify-between min-h-[150px] hover:border-[#c3f400]/30 transition-colors">
            <div>
              <span className="material-symbols-outlined text-3xl text-[#c3f400] mb-4 block">
                bolt
              </span>
              <h3 className="text-xl font-bold text-white mb-2">
                Automatyzacje
              </h3>
              <p className="text-sm text-[#adaaaa] leading-relaxed">
                Integracje, workflowy, boty, powiadomienia. Połącz narzędzia i
                zautomatyzuj procesy.
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
          <div className="md:col-span-2 rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-8 flex flex-col justify-between min-h-[150px] hover:border-[#70aaff]/30 transition-colors">
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
        </div>

        <p className="text-center text-sm text-[#adaaaa] mt-8">
          Czas realizacji zależy od złożoności - od 48h dla prostych stron po kilka
          tygodni dla rozbudowanych systemów.
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
          {/* Brewpilot - featured */}
          <a
            href="https://brewpilot.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="md:col-span-2 group rounded-[0.5rem] border border-[#484847] bg-[#131313] overflow-hidden hover:border-[#81ecff]/30 transition-colors"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBNFcBtZuhV6sAxEFLxWWD34QFK1dyQUgQTkM_17uLiQDgUPTJmH33Y263DTFRmpFzOxO04FQCNkq-9tseoCFS5-50dRhdyFUafGUWtOPB7i-wKFHnGKQcZ4pkL9tP8rK5XW2XXdkWRs-Ymha8WxOmEDevwy-wAdIeQQmE5E1C8s4uPo2NgbNZ5YZ5BZjZx9tI49EVeCkj9u-_gDwdVj5z_Xf6vKi-Xqyl_BfMsvS72A_7rgUHPe1nojhSp56Op3bZsh6pJHcSHQ"
                alt="Brewpilot - AI coffee brewing assistant"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">Brewpilot</h3>
                <span className="material-symbols-outlined text-base text-[#adaaaa] group-hover:text-[#81ecff] transition-colors">
                  arrow_outward
                </span>
              </div>
              <p className="text-sm text-[#adaaaa]">
                AI coffee brewing assistant
              </p>
            </div>
          </a>

          {/* Placeholder cards */}
          <div className="flex flex-col gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex-1 rounded-[0.5rem] border border-[#484847]/50 bg-[#131313] p-6 flex flex-col items-center justify-center min-h-[180px]"
              >
                <span className="material-symbols-outlined text-3xl text-[#484847] mb-3">
                  lock_clock
                </span>
                <span className="text-sm text-[#484847] font-medium">
                  Wkrótce
                </span>
              </div>
            ))}
          </div>
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

        <ChatInput variant="cta" />

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
      <Nav />
      <main>
        <Hero />
        <Differentiator />
        <HowItWorks />
        <Services />
        <Showcase />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
