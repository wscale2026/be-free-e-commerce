export default function Footer() {
  return (
    <footer className="py-10 bg-brand-dark">
      <div className="section-container flex flex-col items-center gap-4 text-center">
        {/* Logo */}
        <img
          src="/logo.png"
          alt="Be Free E-Commerce"
          className="h-10 w-auto object-contain opacity-90 rounded-xl"
        />
        <p className="text-sm text-gray-400">
          © 2026 Be Free E-Commerce — Tous droits réservés
        </p>
        <p className="text-xs text-gray-600">
          Paiement sécurisé par Stripe Europe · Conforme RGPD
        </p>
      </div>
    </footer>
  );
}
