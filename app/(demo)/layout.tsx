import Link from "next/link";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-slate-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg tracking-wide">NYAC</span>
              <span className="text-slate-400 text-sm font-light tracking-widest uppercase">Tennis</span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/clinics"
                className="text-slate-300 hover:text-white hover:bg-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Clinics
              </Link>
              <Link
                href="/lessons"
                className="text-slate-300 hover:text-white hover:bg-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Book a Lesson
              </Link>
              <Link
                href="/director"
                className="text-slate-300 hover:text-white hover:bg-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Director View
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
