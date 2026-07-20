import type { ComponentType } from 'react'

// Course tree built from the MDX file layout at build time — no DB, no CMS.
// Path convention: content/modules/<NN-module-slug>/<NN-lesson-slug>.mdx
//   folder NN  -> module order, folder slug -> module title
//   file   NN  -> lesson order, frontmatter -> title + free flag

export interface Lesson {
  moduleSlug: string
  slug: string
  title: string
  free: boolean
  order: number
  Component: ComponentType
}

export interface Module {
  slug: string
  title: string
  order: number
  lessons: Lesson[]
}

interface Frontmatter {
  title?: string
  free?: boolean
  order?: number
}

type MdxModule = { default: ComponentType; frontmatter?: Frontmatter }

// ponytail: eager glob compiles every lesson into the main bundle. Fine while the
// course is small; switch to lazy glob + a metadata sidecar if bundle size bites.
const files = import.meta.glob<MdxModule>('./modules/**/*.mdx', { eager: true })

function titleCase(slug: string): string {
  return slug
    .replace(/^\d+-/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function numPrefix(name: string): number {
  const m = name.match(/^(\d+)-/)
  return m ? parseInt(m[1], 10) : 999
}

const moduleMap = new Map<string, Module>()

for (const [path, mod] of Object.entries(files)) {
  // ./modules/01-foundations/02-mt5-python-setup.mdx
  const parts = path.replace('./modules/', '').split('/')
  if (parts.length !== 2) continue
  const [moduleFolder, fileName] = parts
  const lessonSlug = fileName.replace(/\.mdx$/, '')
  const fm = mod.frontmatter ?? {}

  if (!moduleMap.has(moduleFolder)) {
    moduleMap.set(moduleFolder, {
      slug: moduleFolder,
      title: titleCase(moduleFolder),
      order: numPrefix(moduleFolder),
      lessons: [],
    })
  }

  moduleMap.get(moduleFolder)!.lessons.push({
    moduleSlug: moduleFolder,
    slug: lessonSlug,
    title: fm.title ?? titleCase(lessonSlug),
    free: fm.free ?? false,
    order: fm.order ?? numPrefix(fileName),
    Component: mod.default,
  })
}

export const modules: Module[] = [...moduleMap.values()]
  .sort((a, b) => a.order - b.order)
  .map((m) => ({ ...m, lessons: m.lessons.sort((a, b) => a.order - b.order) }))

// Flat, ordered list for prev/next navigation.
export const lessonsFlat: Lesson[] = modules.flatMap((m) => m.lessons)

export function findLesson(moduleSlug: string, slug: string): Lesson | undefined {
  return lessonsFlat.find((l) => l.moduleSlug === moduleSlug && l.slug === slug)
}

export function lessonNeighbors(lesson: Lesson) {
  const i = lessonsFlat.indexOf(lesson)
  return {
    prev: i > 0 ? lessonsFlat[i - 1] : undefined,
    next: i < lessonsFlat.length - 1 ? lessonsFlat[i + 1] : undefined,
  }
}
