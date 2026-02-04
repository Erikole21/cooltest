import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <a href="/" className="text-lg font-semibold text-slate-800">
            Cooltest Store
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
        <Outlet />
      </main>
    </div>
  );
}
