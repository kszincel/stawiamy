"use client";

import { useState } from "react";

interface Props {
  projectId: string;
  depositAmount: number;
}

function formatPrice(n: number) {
  return `${n.toLocaleString("pl-PL")} PLN`;
}

export default function PaymentSection({ projectId, depositAmount }: Props) {
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const finalAmount = Math.round(depositAmount * (1 - discountPercent / 100));

  async function applyCode() {
    if (!code.trim()) return;
    setValidating(true);
    setDiscountError(null);
    try {
      const res = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscountPercent(data.discount_percent);
        setAppliedCode(data.code);
      } else {
        setDiscountPercent(0);
        setAppliedCode(null);
        setDiscountError(data.error || "Nieprawidłowy kod");
      }
    } catch {
      setDiscountError("Błąd walidacji kodu");
    } finally {
      setValidating(false);
    }
  }

  async function pay() {
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          discountCode: appliedCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error || "Błąd płatności");
        setPaying(false);
        return;
      }
      if (data.free && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setPayError("Nieoczekiwana odpowiedź serwera");
      setPaying(false);
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Błąd płatności");
      setPaying(false);
    }
  }

  return (
    <div className="rounded-[0.75rem] border border-[#484847] bg-[#131313] p-6">
      <h2 className="text-xs font-bold text-[#adaaaa] uppercase tracking-wider mb-4">
        Zapłać zaliczkę
      </h2>

      <div className="mb-4">
        <div className="text-xs text-[#adaaaa] mb-1">Zaliczka 30%</div>
        <div className="text-2xl font-bold text-white">
          {discountPercent > 0 ? (
            <>
              <span className="line-through text-[#adaaaa] text-lg mr-2">
                {formatPrice(depositAmount)}
              </span>
              <span className="text-[#c3f400]">{formatPrice(finalAmount)}</span>
            </>
          ) : (
            formatPrice(depositAmount)
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs text-[#adaaaa] mb-2">
          Kod rabatowy (opcjonalnie)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={validating || !!appliedCode}
            placeholder="STAWIAMY-..."
            className="flex-1 rounded-[0.5rem] bg-[#1a1a1a] border border-[#484847] px-3 py-2 text-sm text-white placeholder-[#adaaaa] focus:outline-none focus:border-[#81ecff] disabled:opacity-50"
          />
          {appliedCode ? (
            <button
              type="button"
              onClick={() => {
                setAppliedCode(null);
                setDiscountPercent(0);
                setCode("");
                setDiscountError(null);
              }}
              className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] px-4 py-2 text-sm text-white hover:border-[#ff716c] transition-colors"
            >
              Usuń
            </button>
          ) : (
            <button
              type="button"
              onClick={applyCode}
              disabled={validating || !code.trim()}
              className="rounded-[0.5rem] border border-[#484847] bg-[#1a1a1a] px-4 py-2 text-sm text-white hover:border-[#81ecff] transition-colors disabled:opacity-50"
            >
              {validating ? "..." : "Zastosuj"}
            </button>
          )}
        </div>
        {appliedCode && (
          <div className="mt-2 text-xs text-[#c3f400]">
            ✓ Kod zastosowany: -{discountPercent}%
          </div>
        )}
        {discountError && (
          <div className="mt-2 text-xs text-[#ff716c]">{discountError}</div>
        )}
      </div>

      <button
        type="button"
        onClick={pay}
        disabled={paying}
        className="w-full rounded-[0.5rem] bg-[#c3f400] px-6 py-3 text-sm font-bold text-[#0e0e0e] hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {paying
          ? "Przetwarzanie..."
          : finalAmount === 0
            ? "Aktywuj projekt"
            : `Zapłać ${formatPrice(finalAmount)}`}
      </button>

      {payError && (
        <div className="mt-3 text-xs text-[#ff716c]">{payError}</div>
      )}

      <p className="mt-4 text-xs text-[#adaaaa] leading-relaxed">
        Po opłaceniu zaliczki rozpoczynamy pracę nad Twoim projektem. Resztę
        kwoty (70%) zapłacisz przy odbiorze.
      </p>
    </div>
  );
}
