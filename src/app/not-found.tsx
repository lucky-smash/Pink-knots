import Link from "next/link";
import { KnotMark } from "@/components/Wordmark";

export default function NotFound() {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <KnotMark className="h-14 w-14" />
      <h1 className="mt-6 text-display font-bold">This box is <span className="accent text-knot-light">empty.</span></h1>
      <p className="mt-4 max-w-md text-lg text-ink-soft">The page you’re looking for has moved or never existed.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/collections" className="btn btn-primary">Browse collections</Link>
        <Link href="/" className="btn btn-outline">Back home</Link>
      </div>
    </section>
  );
}
