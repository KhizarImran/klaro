import { cn } from '@/lib/utils'

function App() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto p-8">
        <h1 className={cn(
          "text-4xl font-bold mb-4"
        )} style={{ color: 'var(--color-foreground)' }}>
          Welcome to Klaro
        </h1>
        <p style={{ color: 'var(--color-muted-foreground)' }}>
          Your React + Vite + TypeScript + shadcn/ui project is ready!
        </p>
      </div>
    </div>
  )
}

export default App
