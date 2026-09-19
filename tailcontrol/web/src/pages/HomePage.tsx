export function HomePage() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h2 className="text-2xl font-semibold">Console Tailscale pour TV</h2>
        <p className="mt-4 text-slate-300">
          TailControl TV permet d&apos;administrer vos Tailnets depuis Android TV et Fire TV,
          avec jumelage par QR Code et permissions par télévision.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h3 className="text-lg font-medium">Premiers pas</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-300">
          <li>Lancez TailControl sur votre téléviseur.</li>
          <li>Scannez le QR Code affiché à l&apos;écran.</li>
          <li>Authentifiez-vous et sélectionnez le Tailnet.</li>
          <li>Autorisez l&apos;appareil avec le profil souhaité.</li>
        </ol>
      </div>
    </section>
  );
}
