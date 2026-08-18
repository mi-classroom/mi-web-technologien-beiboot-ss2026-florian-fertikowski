import Link from "next/link";

/**
 * Legal notice per § 5 DDG (Digitale-Dienste-Gesetz, replaced the
 * TMG in May 2024). Required fields: name, a postal address that
 * can receive service of process (no PO box), and email plus one
 * further fast contact channel.
 *
 * ⚠️ FILL IN YOUR REAL DETAILS — the placeholders below are not
 * valid and must be replaced before this goes live. This is not
 * legal advice; if in doubt, check with a lawyer or your course.
 */
export default function ImpressumPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <div>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight">Impressum</h1>

      <section className="flex flex-col gap-1 text-sm leading-relaxed">
        <p>
          Florian Stefan Fertikowski
          <br />
          Mörgensstraße 19-21
          <br />
          52064 Aachen
          <br />
          Deutschland
        </p>
      </section>

      <section className="flex flex-col gap-1 text-sm leading-relaxed">
        <p className="font-medium">Kontakt</p>
        <p>E-Mail: florian.fertikowski@proton.me</p>
      </section>

      <section className="flex flex-col gap-1 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">Hinweis</p>
        <p>
          Dieses Projekt ist im Rahmen einer Universitätsveranstaltung
          entstanden und dient Lern- und Demonstrationszwecken.
        </p>
      </section>
    </main>
  );
}
