"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Lock, User, Mail, Phone, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

const checkoutSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(7, "Phone number is required"),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

interface ExternalCheckoutFormProps {
    eventName: string;
    priceCents: number;
    currency: string;
    supplierRef: string;
}

export default function ExternalCheckoutForm({ eventName, priceCents, currency, supplierRef }: ExternalCheckoutFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isFree = priceCents === 0;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CheckoutValues>({
        resolver: zodResolver(checkoutSchema),
    });

    const onSubmit = async (data: CheckoutValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch("/api/external-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName: data.fullName, email: data.email, phone: data.phone, eventName, priceCents, currency, supplierRef }),
            });
            const json = await response.json();
            if (!response.ok || !json.checkoutUrl) throw new Error(json.error || "Failed to start checkout.");
            window.location.href = json.checkoutUrl;
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
            setIsSubmitting(false);
        }
    };

    const formattedPrice = isFree
        ? "Free"
        : new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: currency.toUpperCase(),
          }).format(priceCents / 100);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
                <div className="p-3.5 bg-red-500/8 border border-red-500/20 text-red-400 rounded-lg text-sm animate-in slide-in-from-top-2 duration-300">
                    {error}
                </div>
            )}

            {/* Name field */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/30">Full Name</label>
                <div
                    className={`relative transition-all duration-200 rounded-xl ${
                        focusedField === "fullName"
                            ? "ring-1 ring-primary/60 shadow-[0_0_20px_rgba(124,58,237,0.12)]"
                            : "ring-1 ring-white/8"
                    }`}
                >
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === "fullName" ? "text-primary/80" : "text-white/20"}`} />
                    <input
                        {...register("fullName")}
                        onFocus={() => setFocusedField("fullName")}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-white/[0.03] rounded-xl py-3.5 pl-11 pr-4 outline-none text-sm font-medium text-white/90 placeholder:text-white/20 transition-all"
                        placeholder="John Doe"
                    />
                </div>
                {errors.fullName && (
                    <p className="text-red-400/80 text-xs animate-in slide-in-from-top-1 duration-200">{errors.fullName.message}</p>
                )}
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/30">Email Address</label>
                <div
                    className={`relative transition-all duration-200 rounded-xl ${
                        focusedField === "email"
                            ? "ring-1 ring-primary/60 shadow-[0_0_20px_rgba(124,58,237,0.12)]"
                            : "ring-1 ring-white/8"
                    }`}
                >
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === "email" ? "text-primary/80" : "text-white/20"}`} />
                    <input
                        {...register("email")}
                        type="email"
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-white/[0.03] rounded-xl py-3.5 pl-11 pr-4 outline-none text-sm font-medium text-white/90 placeholder:text-white/20 transition-all"
                        placeholder="john@example.com"
                    />
                </div>
                {errors.email && (
                    <p className="text-red-400/80 text-xs animate-in slide-in-from-top-1 duration-200">{errors.email.message}</p>
                )}
            </div>

            {/* Phone field */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/30">Phone Number</label>
                <div
                    className={`relative transition-all duration-200 rounded-xl ${
                        focusedField === "phone"
                            ? "ring-1 ring-primary/60 shadow-[0_0_20px_rgba(124,58,237,0.12)]"
                            : "ring-1 ring-white/8"
                    }`}
                >
                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === "phone" ? "text-primary/80" : "text-white/20"}`} />
                    <input
                        {...register("phone")}
                        type="tel"
                        onFocus={() => setFocusedField("phone")}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-white/[0.03] rounded-xl py-3.5 pl-11 pr-4 outline-none text-sm font-medium text-white/90 placeholder:text-white/20 transition-all"
                        placeholder="+1 (555) 123-4567"
                    />
                </div>
                {errors.phone && (
                    <p className="text-red-400/80 text-xs animate-in slide-in-from-top-1 duration-200">{errors.phone.message}</p>
                )}
            </div>

            {/* Order summary */}
            <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/8 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/6 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/30">
                        {isFree ? "RSVP Summary" : "Order Summary"}
                    </span>
                </div>
                <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60 truncate pr-4">{eventName}</span>
                        <span className="text-sm font-semibold text-white/80 shrink-0">{formattedPrice}</span>
                    </div>
                    <div className="border-t border-white/6 pt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-white/90">{isFree ? "Price" : "Total"}</span>
                        <span className="text-lg font-black text-primary">{formattedPrice}</span>
                    </div>
                </div>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full overflow-hidden rounded-xl py-4 text-sm font-bold tracking-wide text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: isFree
                    ? "linear-gradient(135deg, hsl(160 83% 40%), hsl(160 83% 30%))"
                    : "linear-gradient(135deg, hsl(252 83% 60%), hsl(252 83% 50%))"
                }}
            >
                {/* shine sweep on hover */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isFree ? "Confirming RSVP…" : "Redirecting to payment…"}
                    </span>
                ) : isFree ? (
                    <span className="flex items-center justify-center gap-2">
                        Confirm RSVP
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" />
                        Pay {formattedPrice}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </span>
                )}
            </button>

            <p className="text-[11px] text-center text-white/20 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                {isFree ? "Secured by KARTIS" : "Secured by Stripe · 256-bit encryption"}
            </p>
        </form>
    );
}
