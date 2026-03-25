"use client";

import { motion, useScroll, useTransform, animate } from "framer-motion";

import { useRef, useEffect } from "react";
import { ArrowRight, Ticket, BarChart3, Users, ScanLine, Table2, TrendingUp, Zap } from "lucide-react";
import { CursorGlow } from "./CursorGlow";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

const features = [
  { icon: Ticket,     label: "Stripe Checkout",  sub: "Tickets & table deposits in one flow" },
  { icon: Table2,     label: "Live Table Maps",  sub: "Real-time floor plan with hold timers" },
  { icon: Users,      label: "Promoter Network", sub: "Attribution, tiers & commission ledger" },
  { icon: ScanLine,   label: "Fast Check-in",    sub: "QR scan with telemetry dashboard" },
  { icon: BarChart3,  label: "Event Analytics",  sub: "Revenue, capacity & conversion metrics" },
  { icon: TrendingUp, label: "Growth Engine",    sub: "Promoter links drive measurable sales" },
];

// Floating orbs config
const orbs = [
  { w: 600, h: 600, x: "20%",  y: "10%",  color: "rgba(124,58,237,0.13)", dur: 18 },
  { w: 400, h: 400, x: "70%",  y: "60%",  color: "rgba(99,102,241,0.09)", dur: 22 },
  { w: 300, h: 300, x: "10%",  y: "70%",  color: "rgba(14,165,233,0.08)", dur: 26 },
  { w: 250, h: 250, x: "80%",  y: "5%",   color: "rgba(167,139,250,0.07)", dur: 20 },
];

export default function LandingPage({ locale }: { locale: string }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const orbY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const orbOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen bg-[#05050a] text-white selection:bg-violet-500/30 overflow-x-hidden" >
      <CursorGlow />

      {/* ── Nav ── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl border-b border-white/[0.04]"
        style={{ background: "rgba(5,5,10,0.75)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 ring-1 ring-violet-500/30 flex items-center justify-center">
            <Ticket className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-sm font-black tracking-[0.18em] uppercase text-white/90">KARTIS APP</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-[13px] text-white/40 font-medium">
          {["Features", "Pricing", "Venues", "Contact"].map((label) => (
            <a key={label} href={`/${locale}/${label.toLowerCase()}`}
              className="hover:text-white/80 transition-colors duration-200">
              {label}
            </a>
          ))}
        </nav>

        <a href={`/${locale}/contact`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white ring-1 ring-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors duration-200"
          >
            Get access
          </motion.button>
        </a>
      </motion.header>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-16 overflow-hidden">

        {/* Animated drifting orbs */}
        {orbs.map((orb, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute rounded-full"
            style={{
              width: orb.w,
              height: orb.h,
              left: orb.x,
              top: orb.y,
              background: `radial-gradient(ellipse at center, ${orb.color} 0%, transparent 70%)`,
              filter: "blur(40px)",
              translateX: "-50%",
              translateY: "-50%",
            }}
            animate={{
              x: [0, 30, -20, 10, 0],
              y: [0, -20, 15, -10, 0],
            }}
            transition={{
              duration: orb.dur,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
          />
        ))}

        {/* Scroll-linked primary orb */}
        <motion.div
          className="pointer-events-none absolute top-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{
            y: orbY,
            opacity: orbOpacity,
            background: "radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 65%)",
          }}
        />

        {/* Fine grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Badge */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={0}
          className="mb-7 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ring-1 ring-violet-400/20 bg-violet-500/[0.08] text-[11px] font-semibold tracking-widest uppercase text-violet-300/70"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          2026 nightlife operating system
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp} initial="hidden" animate="show" custom={1}
          className="max-w-3xl text-center text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05]"
        >
          <span className="text-white">Sell out every</span>
          <br />
          <span className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #38bdf8 100%)" }}>
            night.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          variants={fadeUp} initial="hidden" animate="show" custom={2}
          className="mt-5 max-w-lg text-center text-[15px] text-white/35 leading-relaxed"
        >
          Real-time table maps, Stripe checkout, promoter attribution,
          and QR check-ins — one stack for the whole night.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={3}
          className="mt-9 flex items-center gap-3"
        >
          <a href={`/${locale}/contact`}>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(124,58,237,0.35)" }}
              whileTap={{ scale: 0.97 }}
              className="group flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, hsl(262 83% 60%), hsl(252 83% 55%))" }}
            >
              Book a demo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </motion.button>
          </a>
          <a href={`/${locale}/events`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white/50 ring-1 ring-white/8 hover:text-white/70 hover:ring-white/15 transition-all duration-200"
            >
              Browse events
            </motion.button>
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.8 }}
          className="absolute bottom-10 flex flex-col items-center gap-1"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-10 bg-gradient-to-b from-transparent to-white/15"
          />
        </motion.div>
      </section>

      {/* ── Features grid ── */}
      <section className="relative px-6 pb-32 max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/20 mb-10"
        >
          Everything your venue needs
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map(({ icon: Icon, label, sub }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl p-5 cursor-default overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ background: "radial-gradient(circle at 30% 30%, rgba(124,58,237,0.08), transparent 70%)" }} />
              <div className="relative z-10">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] ring-1 ring-white/8 flex items-center justify-center mb-4 group-hover:ring-violet-500/30 group-hover:bg-violet-500/[0.08] transition-all duration-300">
                  <Icon className="w-4 h-4 text-white/40 group-hover:text-violet-400 transition-colors duration-300" />
                </div>
                <p className="text-sm font-bold text-white/80 mb-1">{label}</p>
                <p className="text-[12px] text-white/30 leading-relaxed">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-6 mb-20 max-w-5xl lg:mx-auto rounded-2xl overflow-hidden px-8 py-12 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(99,102,241,0.06) 100%)",
          boxShadow: "0 0 0 1px rgba(124,58,237,0.15), 0 0 80px rgba(124,58,237,0.05)",
        }}
      >
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Ready to run the night?</h2>
        <p className="text-sm text-white/35 mb-7 max-w-sm mx-auto">Get Kartis set up for your venue in under a day.</p>
        <a href={`/${locale}/contact`}>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(124,58,237,0.4)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, hsl(262 83% 60%), hsl(252 83% 55%))" }}
          >
            Get started <ArrowRight className="w-4 h-4" />
          </motion.button>
        </a>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] px-6 py-6 flex items-center justify-between max-w-5xl mx-auto">
        <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white/15">KARTIS APP</span>
        <span className="text-[11px] text-white/15">© 2026</span>
      </footer>
    </div>
  );
}
