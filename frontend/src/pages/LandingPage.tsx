import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Code2, LineChart, LayoutDashboard, Check, ArrowRight, MessagesSquare, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { modules } from '@/content/course'
import { Logo } from '@/components/Logo'

// Full planned syllabus (marketing copy). Live modules are backed by files in course.ts.
const SYLLABUS = [
  { n: 0, title: 'Foundations', desc: 'What a quantfund is, and getting Python talking to MT5.' },
  { n: 1, title: 'Data', desc: 'Clean OHLCV & tick data from MT5, FX symbols and sessions.' },
  { n: 2, title: 'Research & Backtesting', desc: "A backtester that won't lie to you — no lookahead, no survivorship." },
  { n: 3, title: 'Strategy Building', desc: 'A real FX strategy end to end: signals, optimization, walk-forward.' },
  { n: 4, title: 'Risk & Position Sizing', desc: 'Sizing that survives drawdowns — volatility targeting, hard limits.' },
  { n: 5, title: 'Execution', desc: 'Placing and managing live orders via the MT5 API.' },
  { n: 6, title: 'Automation & Infra', desc: 'Running the whole thing 24/5 with logging and monitoring.' },
  { n: 7, title: 'Capstone: Fund Dashboard', desc: 'Parse reports, track performance, report to investors.' },
]

const liveLessonCount = modules.reduce((sum, m) => sum + m.lessons.length, 0)
const firstLesson = modules[0]?.lessons[0]
const firstLessonPath = firstLesson ? `/course/${firstLesson.moduleSlug}/${firstLesson.slug}` : '/course'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
            </Link>
            <div className="hidden md:flex items-center gap-8 font-mono text-sm">
              <a href="#curriculum" className="text-muted-foreground hover:text-foreground transition-colors">Curriculum</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQs</a>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <Link to="/course">
                <Button variant="outline" className="text-sm">Course</Button>
              </Link>
              <a href="#pricing">
                <Button className="text-sm font-semibold">Join Now</Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-[73px]">
        <div className="hatch h-12 border-y border-border" />
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-[1400px] md:grid-cols-2 md:divide-x md:divide-border">
            {/* Left — copy */}
            <div className="flex flex-col justify-center px-6 py-16 md:px-12 md:py-24">
              <div className="mb-8 inline-flex w-fit items-center gap-2 border border-border px-2 py-1 font-mono text-xs">
                <span className="bg-primary px-1.5 py-0.5 font-bold text-primary-foreground">NEW</span>
                <span className="text-muted-foreground">MetaTrader 5 · Python Course</span>
              </div>
              <h1 className="mb-6 text-6xl font-bold leading-[0.95] tracking-tight md:text-7xl">
                Build your own<br />quantfund.
              </h1>
              <p className="mb-8 max-w-md text-lg text-muted-foreground">
                Learn to build a <span className="font-semibold text-foreground">systematic FX fund</span> in
                Python — a step-by-step framework from data to live execution.
              </p>
              <div className="flex flex-wrap gap-3 font-mono">
                <a href="#pricing">
                  <Button className="text-base font-semibold px-6 py-6">Join Now</Button>
                </a>
                <Link to={firstLessonPath}>
                  <Button variant="outline" className="text-base px-6 py-6">
                    <Play className="mr-2 h-4 w-4" /> Watch Intro
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right — course list panel */}
            <div className="flex items-center justify-center bg-card/40 px-6 py-16 md:px-10">
              <div className="w-full max-w-md border border-border bg-card p-1.5">
                <div className="mb-1 h-1 w-full bg-secondary" />
                {SYLLABUS.slice(0, 5).map((m) => {
                  const live = m.n === 0 && liveLessonCount > 0
                  return (
                    <div key={m.n} className="border-t border-border/60 px-4 py-4 first:border-t-0">
                      <div className="mb-1.5 flex items-center justify-between font-mono text-xs text-muted-foreground">
                        <span>Module {String(m.n).padStart(2, '0')}</span>
                        <span>{live ? `${liveLessonCount} lessons` : 'Coming soon'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{m.title}</span>
                        <span
                          className={`shrink-0 border px-2 py-0.5 font-mono text-xs ${
                            live
                              ? 'border-emerald-500/40 text-emerald-500'
                              : 'border-border text-muted-foreground'
                          }`}
                        >
                          {live ? 'Available' : 'Soon'}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <Link
                  to="/course"
                  className="block border-t border-border/60 py-3 text-center font-mono text-xs text-muted-foreground hover:text-foreground"
                >
                  View all modules
                </Link>
              </div>
            </div>
          </div>
        </section>
        <div className="hatch h-12 border-b border-border" />
      </div>

      {/* Intro */}
      <section className="border-b border-border px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 font-mono text-sm text-muted-foreground">| Intro</p>
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">Start here</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            The first module is free. Get Python talking to MT5 and pull your first account snapshot.
          </p>
          <Link to={firstLessonPath}>
            <Button className="font-mono text-base font-semibold px-6 py-6">
              <Play className="mr-2 h-4 w-4" /> Watch the intro module
            </Button>
          </Link>
        </div>
      </section>

      {/* What you'll build */}
      <section className="py-20 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            You build the fund, <span className="text-primary">not just watch slides</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 text-lg max-w-2xl mx-auto">
            Every module ships working Python you run against a free MT5 demo account.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Code2, title: 'Real code, every module', desc: 'Downloadable repos, not screenshots. Assemble a working quantfund piece by piece.' },
              { icon: LineChart, title: 'MT5 + FX, specifically', desc: 'No generic theory. Real broker connections, real order types, real market sessions.' },
              { icon: LayoutDashboard, title: 'A dashboard as capstone', desc: 'Finish with a live fund dashboard that parses reports and tracks performance.' },
            ].map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section id="curriculum" className="py-20 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            The <span className="text-primary">Curriculum</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 text-lg">
            Eight modules, ending at a fund you can actually run.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SYLLABUS.map((m) => {
              const live = m.n === 0 && liveLessonCount > 0
              return (
                <div key={m.n} className="flex flex-col p-5 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-muted-foreground">{String(m.n).padStart(2, '0')}</span>
                    {live ? (
                      <span className="text-xs font-medium text-primary">{liveLessonCount} lessons · live</span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">Soon</span>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{m.title}</h3>
                  <p className="text-sm text-muted-foreground">{m.desc}</p>
                </div>
              )
            })}
          </div>
          <div className="flex justify-center mt-10">
            <Link to="/course">
              <Button variant="outline" className="text-base px-6 py-5">
                Browse the course <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            One price. <span className="text-primary">Lifetime access.</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 text-lg">Pay once, own the course forever.</p>
          <div className="flex justify-center">
            <Card className="border-primary bg-card max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-2xl">Quantfund Course</CardTitle>
                <CardDescription>Everything you need to build and run a systematic FX fund</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-primary">$149</span>
                  <span className="text-muted-foreground text-xl"> one-time</span>
                </div>
                <ul className="space-y-3 text-sm">
                  {[
                    'All 8 modules, lifetime access',
                    'Downloadable Python repo per module',
                    'Live MT5 + FX code, not slideware',
                    'Capstone fund dashboard project',
                    'Private Discord community',
                    'Free intro module — try before you buy',
                  ].map((f) => (
                    <li key={f} className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-2 shrink-0" /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                {/* ponytail: Stripe checkout wired in the payment phase; free module link for now */}
                <Button className="w-full font-bold text-base py-6" disabled>Enroll — coming soon</Button>
                <Link to="/course" className="w-full">
                  <Button variant="outline" className="w-full">Start the free module</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 border-t border-border">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Frequently <span className="text-primary">asked</span>
          </h2>
          <div className="space-y-3">
            {[
              { q: 'Do I need to know Python already?', a: 'Comfortable-beginner is enough. You should know functions, loops, and how to run a script. We build the trading-specific parts from scratch.' },
              { q: 'Do I need a funded broker account?', a: 'No. The entire course runs on a free MT5 demo account. You only go live when you choose to.' },
              { q: 'Does the MT5 Python package work on Mac/Linux?', a: 'The package is Windows-only, but runs under Wine or a cheap Windows VPS. The Automation module covers this setup in detail.' },
              { q: 'Is this financial advice?', a: 'No. This is an engineering course about building trading systems. Strategies are teaching examples, not recommendations.' },
              { q: 'How long do I have access?', a: 'Forever. One payment, lifetime access, including future updates to the modules.' },
            ].map((item) => (
              <details key={item.q} className="group rounded-lg border border-border bg-card px-5 py-4">
                <summary className="flex cursor-pointer items-center justify-between font-medium list-none">
                  {item.q}
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Discord */}
      <section className="py-20 px-6 border-t border-border">
        <div className="container mx-auto max-w-3xl text-center">
          <MessagesSquare className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to build your fund?</h2>
          <p className="text-muted-foreground text-lg mb-8">Start the free module now — no card required.</p>
          <Link to="/course">
            <Button className="font-semibold text-base px-8 py-6">
              Start free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Logo className="h-7 w-7" />
              <span className="text-lg font-bold">Klaro</span>
            </div>
            <div className="flex space-x-6">
              <a href="#curriculum" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Curriculum</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>
            <div className="text-sm text-muted-foreground">© 2026 Klaro. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
