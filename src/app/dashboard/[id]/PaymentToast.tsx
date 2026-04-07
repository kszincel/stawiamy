"use client";

import { useEffect, useState } from "react";

export default function PaymentToast() {
  const [msg, setMsg] = useState<{ type: "success" | "cancel"; text: string } | null>(
    null
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      setMsg({
        type: "success",
        text: "Płatność zakończona sukcesem! Rozpoczynamy pracę nad Twoim projektem.",
      });
    } else if (payment === "cancelled") {
      setMsg({
        type: "cancel",
        text: "Płatność anulowana. Możesz spróbować ponownie.",
      });
    }
  }, []);

  if (!msg) return null;

  return (
    <div
      className={`rounded-[0.75rem] border p-4 text-sm ${
        msg.type === "success"
          ? "border-[#c3f400] bg-[#c3f400]/10 text-[#c3f400]"
          : "border-[#ff716c] bg-[#ff716c]/10 text-[#ff716c]"
      }`}
    >
      {msg.text}
    </div>
  );
}
