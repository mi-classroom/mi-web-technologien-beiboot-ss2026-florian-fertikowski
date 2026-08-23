import Link from "next/link";

/**
 * Privacy notice per Art. 12-14 DSGVO. Written to accurately
 * reflect what this specific app actually does — no boilerplate
 * about things that don't apply (no accounts, no forms, no
 * server-side storage of user data).
 *
 * ⚠️ Fill in the [Verantwortlicher] contact block to match
 * Impressum. Not legal advice — this describes the technical
 * reality of the app as built; if the app's data flows change
 * later (e.g. adding analytics), this page needs updating to match.
 */
export default function DatenschutzPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight">
        Datenschutzerklärung
      </h1>

      <section className="flex flex-col gap-2 text-sm leading-relaxed">
        <h2 className="font-medium">Verantwortlicher</h2>
        <p>
          Florian Stefan Fertikowski
          <br />
          Mörgensstraße 19-21
          <br />
          52064 Aachen
          <br />
          E-Mail: florian.fertikowski@proton.me
        </p>
        <p className="text-muted-foreground">
          Siehe auch das{" "}
          <Link href="/impressum" className="underline hover:text-foreground">
            Impressum
          </Link>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm leading-relaxed">
        <h2 className="font-medium">Hosting und Server-Logdateien</h2>
        <p>
          Diese Website wird über Github Pages ausgeliefert. Beim Aufruf der
          Seite verarbeitet der Hosting-Anbieter automatisch technische
          Verbindungsdaten (u. a. IP-Adresse, Datum und Uhrzeit des Zugriffs,
          aufgerufene Seite, verwendeter Browser). Diese Daten fallen technisch
          bedingt bei jeder Internetnutzung an und werden nicht mit anderen
          Datenquellen zusammengeführt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f
          DSGVO (berechtigtes Interesse an der technisch fehlerfreien
          Auslieferung der Website).
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm leading-relaxed">
        <h2 className="font-medium">Kamerazugriff und Gestenerkennung</h2>
        <p>
          Die Übungen in dieser App lassen sich per Handgesten steuern. Dafür
          fragt die Anwendung Zugriff auf deine Kamera an.
        </p>
        <p>
          <strong>
            Das Kamerabild wird ausschließlich lokal in deinem Browser
            verarbeitet.
          </strong>{" "}
          Die Erkennung von Händen und Gesten läuft vollständig client-seitig
          (WebAssembly, MediaPipe). Es werden zu keinem Zeitpunkt Bild- oder
          Videodaten an einen Server übertragen, gespeichert oder an Dritte
          weitergegeben — weder von dieser Anwendung noch von den verwendeten
          Bibliotheken. Sobald du die Seite verlässt oder den Kamerazugriff
          widerrufst, sind keine Bilddaten mehr vorhanden.
        </p>
        <p>
          Rechtsgrundlage für den Kamerazugriff ist deine Einwilligung gemäß
          Art. 6 Abs. 1 lit. a DSGVO, die dein Browser beim Anfragen der
          Kameraberechtigung einholt. Du kannst diese Einwilligung jederzeit
          über die Berechtigungseinstellungen deines Browsers widerrufen.
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm leading-relaxed">
        <h2 className="font-medium">Eingebundene Video- und Audioinhalte</h2>
        <p>
          Übungs-Demonstrationsvideos und Hintergrundmusik werden von einem
          Cloudflare-R2-Speicher nachgeladen. Beim Laden dieser Inhalte wird
          deine IP-Adresse technisch bedingt an diesen Speicher übertragen,
          ebenso wie beim Laden jeder anderen Ressource dieser Website. Es
          findet keine darüberhinausgehende Auswertung oder Profilbildung statt.
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm leading-relaxed">
        <h2 className="font-medium">Cookies und Tracking</h2>
        <p>
          Diese Website verwendet keine Cookies, kein Analytics und kein
          Tracking. Es werden keine Nutzerprofile erstellt und keine Daten zu
          Marketingzwecken verarbeitet.
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm leading-relaxed">
        <h2 className="font-medium">Deine Rechte</h2>
        <p>
          Nach der DSGVO hast du unter anderem das Recht auf Auskunft (Art. 15),
          Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der
          Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch
          (Art. 21) bezüglich deiner personenbezogenen Daten. Da diese Anwendung
          praktisch keine personenbezogenen Daten speichert (siehe oben),
          dürften die meisten dieser Rechte in der Praxis selten relevant werden
          — bei Fragen erreichst du uns über die oben genannte E-Mail-Adresse.
        </p>
        <p>
          Du hast außerdem das Recht, dich bei einer
          Datenschutz-Aufsichtsbehörde zu beschweren, wenn du der Meinung bist,
          dass die Verarbeitung deiner Daten gegen die DSGVO verstößt.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">15.08.2026</p>
    </main>
  );
}
