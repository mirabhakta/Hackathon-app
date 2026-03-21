import { useContext, useState } from "react";
import { motion } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext.jsx";
import LeafIcon from "./LeafIcon.jsx";
import { GAME_OPTIONS, SENIORITY_OPTIONS } from "../lib/constants.js";

export default function OnboardingFlow({ onComplete }) {
  const { colors } = useContext(ThemeContext);
  const [form, setForm] = useState({
    name: "",
    workHours: 8,
    setup: "hybrid",
    seniority: 2,
    favoriteGame: "snake"
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }
    onComplete({ ...form, name: form.name.trim() });
  }

  return (
    <div className="min-h-screen px-6 py-10 font-body" style={{ background: colors.dashBg, color: colors.secondaryText }}>
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[36px] p-8 shadow-glow backdrop-blur"
          style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}
        >
          <div className="mb-8 flex items-center gap-4">
            <LeafIcon className="h-14 w-14" primary={colors.primary} secondary={colors.secondary} />
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: colors.muted }}>Wellby</p>
              <h1 className="font-display text-5xl leading-tight">Work well. Rest well. Be well.</h1>
            </div>
          </div>
          <p className="max-w-xl text-lg leading-8" style={{ color: colors.muted }}>
            A friendly AI wellbeing companion for tech workers. Wellby learns your flow, watches for
            burnout risk, and makes breaks feel restorative instead of guilty.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              "Adaptive sessions that learn your natural pace",
              "Warm burnout alerts with human-feeling snoozes",
              "Mindful break mode with breathing and games",
              "Private fatigue detection that stays on your device"
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] p-4 text-sm font-semibold"
                style={{ background: colors.secondary, color: colors.secondaryText, border: `1px solid ${colors.cardBorder}` }}
              >
                {item}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          onSubmit={submit}
          className="rounded-[36px] p-8 shadow-2xl"
          style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}
        >
          <h2 className="font-display text-3xl">Let's make Wellby yours</h2>
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase tracking-[0.18em]" style={{ color: colors.muted }}>Name</span>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Alex"
                className="w-full rounded-2xl border-0 px-4 py-3 text-lg outline-none ring-2 ring-transparent transition"
                style={{ background: colors.secondary, color: colors.secondaryText }}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase tracking-[0.18em]" style={{ color: colors.muted }}>Typical Daily Work Hours</span>
              <input
                type="range"
                min="4"
                max="12"
                value={form.workHours}
                onChange={(event) => updateField("workHours", Number(event.target.value))}
                className="w-full"
                style={{ accentColor: colors.primary }}
              />
              <p className="mt-2 text-sm font-semibold" style={{ color: colors.muted }}>{form.workHours} hours</p>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase tracking-[0.18em]" style={{ color: colors.muted }}>Work Setup</span>
              <select
                value={form.setup}
                onChange={(event) => updateField("setup", event.target.value)}
                className="w-full rounded-2xl border-0 px-4 py-3 outline-none ring-2 ring-transparent"
                style={{ background: colors.secondary, color: colors.secondaryText }}
              >
                <option value="wfh">WFH</option>
                <option value="office">Office</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase tracking-[0.18em]" style={{ color: colors.muted }}>Job Seniority</span>
              <select
                value={form.seniority}
                onChange={(event) => updateField("seniority", Number(event.target.value))}
                className="w-full rounded-2xl border-0 px-4 py-3 outline-none ring-2 ring-transparent"
                style={{ background: colors.secondary, color: colors.secondaryText }}
              >
                {SENIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <fieldset>
              <legend className="mb-2 block text-sm font-bold uppercase tracking-[0.18em]" style={{ color: colors.muted }}>Favorite Break Game</legend>
              <div className="grid grid-cols-2 gap-3">
                {GAME_OPTIONS.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => updateField("favoriteGame", game.id)}
                    className="rounded-2xl px-4 py-4 text-left transition"
                    style={{
                      background: form.favoriteGame === game.id ? colors.primary : colors.secondary,
                      color: form.favoriteGame === game.id ? colors.primaryText : colors.secondaryText,
                      border: `1px solid ${form.favoriteGame === game.id ? colors.primary : colors.cardBorder}`
                    }}
                  >
                    <div className="text-2xl">{game.emoji}</div>
                    <div className="mt-2 font-bold">{game.label}</div>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <button
            type="submit"
            className="mt-8 w-full rounded-full px-6 py-4 font-bold transition"
            style={{ background: colors.primary, color: colors.primaryText }}
          >
            Start my first Wellby session
          </button>
        </motion.form>
      </div>
    </div>
  );
}
