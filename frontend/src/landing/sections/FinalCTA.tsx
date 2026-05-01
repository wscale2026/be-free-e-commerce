import { ArrowUpRight } from "lucide-react";

export default function FinalCTA() {
  const scrollToForm = () => {
    const el = document.getElementById("hero-form");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-brand-blue to-blue-800 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="section-container relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          Votre diagnostic est prêt.
        </h2>
        <p className="text-xl md:text-2xl text-blue-100 font-semibold mb-8">
          Passez à l'action.
        </p>
        <p className="text-base text-blue-200 max-w-lg mx-auto mb-10">
          En 2 minutes, vous saurez exactement ce dont vous avez besoin pour lancer
          ou scaler votre business e-commerce.
        </p>

        <button
          onClick={scrollToForm}
          className="btn-white text-lg px-10 py-4 shadow-xl hover:shadow-2xl"
        >
          Vérifier mon éligibilité
          <ArrowUpRight className="w-5 h-5" />
        </button>

        <p className="text-sm text-blue-300 mt-6">
          Investissement unique : 2 000 € — Paiement sécurisé Stripe
        </p>
      </div>
    </section>
  );
}
