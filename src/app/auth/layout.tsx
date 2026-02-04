export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-dxt-primary/15 blur-3xl motion-safe:animate-float-a" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-dxt-secondary/15 blur-3xl motion-safe:animate-float-b" />
        {/* Radial spotlight — focuses attention on center card */}
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-dxt-primary/[0.07] blur-3xl" />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}
