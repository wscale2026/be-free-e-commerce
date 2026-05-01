import { FileText, Package, Monitor, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CARDS = [
  {
    icon: FileText,
    title: "KBIS OFFICIEL et NUMÉRO SIRET",
    description: "Votre société créée légalement, prête à facturer dès le premier jour.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Package,
    title: "PRODUIT VALIDÉ",
    description: "Un produit rentable trouvé et testé pour vous, avec marges optimisées.",
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    icon: Monitor,
    title: "SITE CLÉ EN MAIN",
    description: "Votre boutique en ligne prête à vendre, design professionnel inclus.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Phone,
    title: "SUIVI ZOOM",
    description: "Accompagnement vidéo personnalisé pour scaler sans être seul.",
    color: "text-red-500",
    bg: "bg-red-50",
  },
];

export default function AntiGalere() {
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
    <section id="anti-galere" className="py-20 md:py-28 bg-white dark:bg-black transition-colors duration-300" ref={ref}>
      <div className="section-container">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-extrabold text-brand-dark dark:text-white mb-4 tracking-tight">
            Ce que d'autres ont mis{" "}
            <span className="text-brand-blue">2 ans à construire seul</span>
          </h2>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Nous vous livrons un business clé en main : une 
            <span className="font-semibold text-brand-dark dark:text-gray-200"> expérience de 3 mois</span> pour un investissement unique.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CARDS.map((card, idx) => {
            const Icon = card.icon;
            const darkBg = card.bg.includes('blue') ? 'dark:bg-blue-950/30' : 'dark:bg-red-950/30';
            const darkColor = card.color.includes('blue') ? 'dark:text-blue-400' : 'dark:text-red-400';
            
            return (
              <div
                key={card.title}
                className={`card-base group hover:border-brand-blue/30 ${
                  visible ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${card.bg} ${darkBg} ${card.color} ${darkColor} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-brand-dark dark:text-white mb-2 leading-snug">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
