import Link from 'next/link';
import { PRODUCT_CODE, PRODUCT_NAME } from '@orc/shared';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6">
      <p className="text-sm tracking-[0.2em] text-[var(--muted)] uppercase">{PRODUCT_CODE}</p>
      <h1 className="text-4xl font-semibold tracking-tight">{PRODUCT_NAME}</h1>
      <p className="max-w-xl text-[var(--muted)]">
        Document Import foundation is available. Architecture remains in ORC-Knowledge.
      </p>
      <Link
        href="/documents"
        className="w-fit rounded bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
      >
        Open Document Import
      </Link>
    </main>
  );
}
