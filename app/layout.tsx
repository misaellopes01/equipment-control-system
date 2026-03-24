import type { Metadata } from 'next';
import { IBM_Plex_Sans, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const headingFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading' });
const bodyFont = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Equipment Control System',
  description: 'Cadastro de equipamentos, eventos de status e relatório de disponibilidade.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className="font-sans antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-glow backdrop-blur xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Equipment Control System</p>
              <h1 className="mt-2 font-heading text-2xl font-semibold text-white sm:text-3xl">Controle operacional e disponibilidade</h1>
            </div>
            <nav className="flex flex-wrap gap-3 text-sm">
              <Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-100 transition hover:bg-white/10" href="/">
                Dashboard
              </Link>
              <Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-100 transition hover:bg-white/10" href="/equipments">
                Equipamentos
              </Link>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}