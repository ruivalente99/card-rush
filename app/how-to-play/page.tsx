'use client';

import { useRouter } from 'next/navigation';
import { GameHeader } from '@/components/ui/game-header';

interface CardExampleProps {
  label: string;
  color: string;
  rainbow?: boolean;
}

function CardExample({ label, color, rainbow }: CardExampleProps) {
  return (
    <div
      className={`w-12 h-16 rounded-lg border-2 border-white/30 flex items-center justify-center font-bold text-white text-lg shadow-md shrink-0 ${rainbow ? 'card-hypertrain' : color}`}
    >
      {label}
    </div>
  );
}

interface RuleRowProps {
  card: React.ReactNode;
  title: string;
  desc: string;
}

function RuleRow({ card, title, desc }: RuleRowProps) {
  return (
    <div className="flex gap-4 items-start py-4 border-b border-border last:border-0">
      <div className="shrink-0">{card}</div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-muted-foreground text-sm mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function HowToPlayPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-lg mx-auto gap-6 pb-12">
      <GameHeader
        left={
          <button
            onClick={() => router.push('/')}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back
          </button>
        }
      />

      <div>
        <h1 className="text-3xl font-black text-foreground brand-heading mb-1">How to Play</h1>
        <p className="text-muted-foreground">Card Rush — push your luck, know when to stop.</p>
      </div>

      {/* Objective */}
      <section className="bg-card rounded-[var(--radius-lg)] border border-border p-4 space-y-2">
        <h2 className="font-bold text-foreground text-lg">🎯 Objective</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Be the first player to reach the <span className="text-foreground font-medium">point target</span> (default 200).
          Each round, draw cards to build your hand. Bank your score before you bust, or get lucky and walk away with a big haul.
        </p>
      </section>

      {/* Turn flow */}
      <section className="bg-card rounded-[var(--radius-lg)] border border-border p-4 space-y-3">
        <h2 className="font-bold text-foreground text-lg">🔄 Your Turn</h2>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
          <li><span className="text-foreground font-medium">Draw</span> — flip a card from the deck into your hand.</li>
          <li><span className="text-foreground font-medium">Stay</span> — bank your current hand score and end your turn. Safe play.</li>
          <li>Keep drawing to score more — but watch out for duplicates!</li>
        </ol>
      </section>

      {/* Number cards */}
      <section className="bg-card rounded-[var(--radius-lg)] border border-border p-4">
        <h2 className="font-bold text-foreground text-lg mb-3">🃏 Number Cards (0–12)</h2>
        <div className="flex gap-2 mb-3 flex-wrap">
          {[1, 3, 5, 8, 11].map((n) => (
            <div key={n} className={`w-10 h-14 rounded-md border-2 flex items-center justify-center font-bold text-sm shadow ${
              n <= 3 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
              n <= 6 ? 'bg-amber-100 text-amber-800 border-amber-300' :
              n <= 9 ? 'bg-orange-100 text-orange-800 border-orange-300' :
              'bg-red-100 text-red-800 border-red-300'
            }`}>{n}</div>
          ))}
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Each number card adds its value to your hand score. The deck has <span className="text-foreground font-medium">N copies of each value N</span> (e.g., three 3s, seven 7s). Higher numbers = higher risk of duplicates.
        </p>
        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
          Draw a number <span className="text-red-400 font-medium">already in your hand</span> and you <span className="text-red-400 font-bold">BUST</span> — losing all round points.
        </p>
      </section>

      {/* Special cards */}
      <section className="bg-card rounded-[var(--radius-lg)] border border-border p-4">
        <h2 className="font-bold text-foreground text-lg mb-1">✨ Special Cards</h2>
        <p className="text-muted-foreground text-xs mb-3">3 copies of each in the deck</p>
        <div className="divide-y divide-border">
          <RuleRow
            card={<CardExample label="❄️" color="bg-sky-500" />}
            title="Freeze"
            desc="Your turn ends immediately — you're frozen in place with your current score banked. Works like Stay but forced."
          />
          <RuleRow
            card={<CardExample label="🔄" color="bg-amber-500" />}
            title="Second Chance"
            desc="Saves you once from a bust. If your next number card is a duplicate, it's absorbed instead of busting you. Stacks if you draw multiple."
          />
          <RuleRow
            card={<CardExample label="×2" color="bg-violet-600" />}
            title="Double (×2)"
            desc="Doubles your total number score when staying. Stacks with HyperTrain — combined, your numbers score 4×."
          />
          <RuleRow
            card={<CardExample label="+3" color="bg-emerald-600" />}
            title="Plus Three (+3)"
            desc="Adds 3 bonus points on top of your final score when staying. Applied after all multipliers."
          />
        </div>
      </section>

      {/* HyperTrain */}
      <section className="bg-card rounded-[var(--radius-lg)] border border-border p-4 space-y-3">
        <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
          <span>🌈</span> HyperTrain
          <span className="text-xs font-normal text-muted-foreground">(2 in deck)</span>
        </h2>
        <div className="flex items-center gap-3">
          <CardExample label="🌈" color="" rainbow />
          <div className="hypertrain-active-bar h-2 rounded-full flex-1" />
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The rainbow wildcard! When drawn, it activates the <span className="text-foreground font-medium">HyperTrain multiplier</span> — all your number cards count <span className="text-foreground font-bold">double</span>. The animated rainbow bar appears on your hand while it's active.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Combined with <span className="text-foreground font-medium">×2</span>: your numbers are worth <span className="text-foreground font-bold">4×</span>. Combined with <span className="text-foreground font-medium">+3</span>: applied after the doubling. Risk it for massive scores!
        </p>
      </section>

      {/* Lucky 7 */}
      <section className="bg-card rounded-[var(--radius-lg)] border border-border p-4 space-y-2">
        <h2 className="font-bold text-foreground text-lg">🍀 Lucky 7</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Collect <span className="text-foreground font-bold">7 different number values</span> in a single hand and trigger <span className="text-yellow-400 font-bold">Lucky 7</span>! You automatically Stay with a <span className="text-foreground font-medium">+15 bonus</span> added to your score on top of everything else.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          With HyperTrain active, your Lucky 7 hand is worth a <span className="text-foreground font-bold">fortune</span> — plan accordingly.
        </p>
      </section>

      {/* Scoring */}
      <section className="bg-card rounded-[var(--radius-lg)] border border-border p-4 space-y-2">
        <h2 className="font-bold text-foreground text-lg">📊 Score Formula</h2>
        <div className="bg-muted rounded-[var(--radius-md)] p-3 font-mono text-xs text-foreground space-y-1">
          <div>base = sum of all number cards</div>
          <div className="text-yellow-400">if HyperTrain: base × 2</div>
          <div className="text-violet-400">if ×2 card: base × 2</div>
          <div className="text-emerald-400">if +3 card: base + 3</div>
          <div className="text-amber-400">if Lucky 7: + 15 bonus</div>
        </div>
        <p className="text-muted-foreground text-xs">Example: numbers sum to 12, HyperTrain active, ×2 card, +3 card → 12 × 2 × 2 + 3 = <span className="text-foreground font-bold">51 pts</span></p>
      </section>

      {/* Game Modes */}
      <section className="bg-card rounded-[var(--radius-lg)] border border-border p-4 space-y-3">
        <h2 className="font-bold text-foreground text-lg">⚙️ Game Modes</h2>
        <div className="space-y-3">
          <div>
            <p className="font-medium text-foreground text-sm">Free Play</p>
            <p className="text-muted-foreground text-xs mt-0.5">Draw as many cards as you want per turn, then choose to Stay. Maximum risk control.</p>
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">One Per Turn</p>
            <p className="text-muted-foreground text-xs mt-0.5">Each player draws exactly one card per turn, then play passes. More strategic — you can't hoard draws.</p>
          </div>
        </div>
      </section>

      {/* Online play */}
      <section className="bg-card rounded-[var(--radius-lg)] border border-border p-4 space-y-2">
        <h2 className="font-bold text-foreground text-lg">🌐 Online Play</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Create a room to get a shareable link. Send it to friends — they just tap the link, enter a name and emoji, and join instantly. No account needed.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          If a turn timer is set, players have that many seconds to act before a card is drawn automatically. Great for keeping the game moving.
        </p>
      </section>

      <button
        onClick={() => router.push('/')}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-[var(--radius-xl)] transition-colors"
      >
        Ready to Play →
      </button>
    </div>
  );
}
