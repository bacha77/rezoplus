"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function CheckoutButton({ text = "Subscribe Now" }: { text?: string }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)] hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg disabled:opacity-50"
    >
      {loading ? "Redirecting..." : text}
      {!loading && <ArrowRight className="w-5 h-5" />}
    </button>
  );
}
