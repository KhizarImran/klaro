import { useParams, Link, Navigate } from 'react-router-dom'
import { Lock, ArrowLeft, ArrowRight } from 'lucide-react'
import { modules, findLesson, lessonNeighbors } from '@/content/course'
import { Logo } from '@/components/Logo'

export function LessonPage() {
  const { moduleSlug, lessonSlug } = useParams()
  const lesson = moduleSlug && lessonSlug ? findLesson(moduleSlug, lessonSlug) : undefined

  if (!lesson) return <Navigate to="/course" replace />

  const { prev, next } = lessonNeighbors(lesson)
  const Content = lesson.Component

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-10">
        {/* Sidebar TOC */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-7 w-7" />
            </Link>
            <Link to="/course" className="font-mono text-sm text-muted-foreground hover:text-foreground">
              ← All modules
            </Link>
          </div>
          <nav className="mt-6 space-y-6">
            {modules.map((m) => (
              <div key={m.slug}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {m.title}
                </p>
                <ul className="mt-2 space-y-1">
                  {m.lessons.map((l) => {
                    const active = l.moduleSlug === lesson.moduleSlug && l.slug === lesson.slug
                    return (
                      <li key={l.slug}>
                        <Link
                          to={`/course/${l.moduleSlug}/${l.slug}`}
                          className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                            active ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span>{l.title}</span>
                          {!l.free && <Lock className="h-3 w-3" />}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Lesson content */}
        <main className="min-w-0 flex-1">
          <article className="lesson">
            <Content />
          </article>

          <div className="mt-16 flex justify-between border-t border-border pt-6">
            {prev ? (
              <Link
                to={`/course/${prev.moduleSlug}/${prev.slug}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                to={`/course/${next.moduleSlug}/${next.slug}`}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                {next.title} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
