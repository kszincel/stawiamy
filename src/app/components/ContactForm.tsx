"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Nie udało się wysłać wiadomości");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-[#c3f400] mb-4 block">
          check_circle
        </span>
        <h3 className="text-xl font-bold text-white mb-2">Wiadomość wysłana</h3>
        <p className="text-sm text-[#adaaaa]">
          Odezwiemy się w ciągu 24 godzin. Sprawdź skrzynkę mailową.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm text-[#81ecff] hover:underline cursor-pointer"
        >
          Wyślij kolejną wiadomość
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] p-8 space-y-5 w-full max-w-lg"
    >
      <div>
        <label htmlFor="contact-name" className="block text-sm text-[#adaaaa] mb-2">
          Imię <span className="text-[#484847]">(opcjonalnie)</span>
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jan"
          disabled={status === "sending"}
          className="w-full rounded-lg bg-[#0e0e0e] px-4 py-3 text-white placeholder:text-[#484847] outline-none border border-[#484847] focus:border-[#81ecff] transition-colors disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm text-[#adaaaa] mb-2">
          Email <span className="text-[#ff716c]">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jan@firma.pl"
          required
          disabled={status === "sending"}
          className="w-full rounded-lg bg-[#0e0e0e] px-4 py-3 text-white placeholder:text-[#484847] outline-none border border-[#484847] focus:border-[#81ecff] transition-colors disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm text-[#adaaaa] mb-2">
          Wiadomość <span className="text-[#ff716c]">*</span>
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Opisz swój projekt lub zadaj pytanie..."
          rows={4}
          required
          disabled={status === "sending"}
          className="w-full rounded-lg bg-[#0e0e0e] px-4 py-3 text-white placeholder:text-[#484847] outline-none border border-[#484847] focus:border-[#81ecff] transition-colors resize-none disabled:opacity-50"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-[#ff716c]">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending" || !email.trim() || !message.trim()}
        className="w-full rounded-full bg-[#81ecff] py-4 font-semibold text-[#005762] hover:bg-[#00d4ec] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === "sending" ? (
          <>
            <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-[#005762] animate-spin" />
            <span>Wysyłam...</span>
          </>
        ) : (
          "Wyślij wiadomość"
        )}
      </button>
    </form>
  );
}
