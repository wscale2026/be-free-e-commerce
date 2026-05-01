import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    month: "MOIS 1",
    title: "Formation Live + Création Administrative",
    desc: "Vous apprenez les fondamentaux pendant que nous créons votre entreprise (KBIS, SIRET, compte pro).",
  },
  {
    month: "MOIS 2",
    title: "Recherche Produit & Fournisseur",
    desc: "Identification d'un produit gagnant, négociation fournisseur, et mise en place de votre chaîne logistique.",
  },
  {
    month: "MOIS 3",
    title: "Optimisation & Scaling",
    desc: "Lancement de votre boutique, premières ventes, puis optimisation pour passer à l'échelle.",
  },
];

export default function Timeline() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="timeline" className="py-20 md:py-28 bg-brand-gray dark:bg-zinc-900/50 transition-colors duration-300" ref={ref}>
      <div className="section-container">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-brand-dark dark:text-white mb-4">
            Votre Parcours en <span className="text-brand-blue">3 Mois</span>
          </h2>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Un processus organisé et rassurant. Pas de boîte noire : vous savez exactement où vous allez.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Desktop Timeline */}
          <div className="hidden md:block">
            {/* Line */}
            <div className="relative flex items-stretch justify-between">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200/60 dark:bg-zinc-800" />
              {STEPS.map((step, idx) => (
                <div
                  key={step.month}
                  className={`relative flex flex-col items-center text-center w-1/3 group px-2 ${
                    visible ? "animate-fade-in-up" : "opacity-0"
                  }`}
                  style={{ animationDelay: `${idx * 200}ms` }}
                >
                  {/* Dot */}
                  <div className="relative z-10 w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm shadow-lg mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-blue-200">
                    {idx + 1}
                  </div>
                  <div className="card-base w-full text-center group-hover:border-brand-blue/30">
                    <span className="inline-block px-3 py-1 bg-brand-blue text-white text-[10px] font-bold rounded-full mb-3 tracking-wider">
                      {step.month}
                    </span>
                    <h3 className="text-lg font-extrabold text-brand-dark dark:text-white mb-2 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed px-2">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Timeline */}
          <div className="md:hidden space-y-8">
            {STEPS.map((step, idx) => (
              <div
                key={step.month}
                className={`flex gap-4 group ${visible ? "animate-fade-in-up" : "opacity-0"}`}
                style={{ animationDelay: `${idx * 200}ms` }}
              >
                {/* Left: dot + line */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xs shadow-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                    {idx + 1}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 dark:bg-zinc-800 mt-2" />
                  )}
                </div>
                {/* Right: content */}
                <div className="card-base p-5 flex-1 group-hover:border-brand-blue/30">
                  <span className="inline-block px-3 py-1 bg-brand-blue text-white text-[10px] font-bold rounded-full mb-2 tracking-wider">
                    {step.month}
                  </span>
                  <h3 className="text-base font-extrabold text-brand-dark dark:text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
