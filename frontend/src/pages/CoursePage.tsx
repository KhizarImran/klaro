import { Link } from 'react-router-dom'
import { Lock, PlayCircle } from 'lucide-react'
import { modules } from '@/content/course'
import { Logo } from '@/components/Logo'

export function CoursePage() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-border">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-mono text-sm text-muted-foreground">/ course</span>
          </Link>
          <Link to="/" className="font-mono text-sm text-muted-foreground hover:text-foreground">← Home</Link>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium text-primary">The Course</p>
        <h1 className="mt-2 text-4xl font-bold">Build Your Own Quantfund in Python</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A build-along course. Every module ships working Python you run against MT5 and
          FX markets — ending in a live fund dashboard.
        </p>

        <div className="mt-12 space-y-10">
          {modules.map((m, i) => (
            <section key={m.slug}>
              <h2 className="text-lg font-semibold">
                <span className="text-muted-foreground">{String(i).padStart(2, '0')}</span>{' '}
                {m.title}
              </h2>
              <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
                {m.lessons.map((l) => (
                  <li key={l.slug}>
                    <Link
                      to={`/course/${l.moduleSlug}/${l.slug}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-card"
                    >
                      <span className="flex items-center gap-3">
                        <PlayCircle className="h-4 w-4 text-primary" />
                        {l.title}
                      </span>
                      {l.free ? (
                        <span className="text-xs font-medium text-primary">Free</span>
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
