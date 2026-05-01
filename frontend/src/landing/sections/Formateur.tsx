import { MapPin, Award, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Formateur() {
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
    <section id="formateur" className="py-20 md:py-28 bg-white dark:bg-black transition-colors duration-300" ref={ref}>
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
          {/* Image */}
          <div
            className={`relative h-full ${visible ? "animate-fade-in-up" : "opacity-0"}`}
          >
            <div className="relative h-full rounded-3xl overflow-hidden shadow-xl">
              <img
                src="/formateur.jpg"
                alt="Votre expert e-commerce"
                className="w-full h-[400px] md:h-[500px] lg:h-full object-cover object-top"
              />
              {/* Badge overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark dark:text-white">
                      Expert E-Commerce
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      +500 entrepreneurs accompagnés
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div
            className={`${visible ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "200ms" }}
          >
            <h2 className="text-2xl md:text-4xl font-extrabold text-brand-dark dark:text-white mb-6 tracking-tight">
              Votre Expert en{" "}
              <span className="text-brand-blue">E-Commerce</span>
            </h2>

            <div className="bg-brand-gray dark:bg-zinc-900/50 rounded-2xl p-6 md:p-8 mb-6 border border-gray-100 dark:border-zinc-800">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Entrepreneur depuis plus de 8 ans, j'ai construit plusieurs boutiques en ligne
                générant des revenus récurrents sur le marché européen. Mon approche est simple :
                pas de théorie inutile, que des actions concrètes et des résultats mesurables.
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                J'accompagne chaque membre de l'écosystème avec un suivi personnalisé en visioconférence,
                pour que vous ne soyez jamais seul face à vos défis techniques ou commerciaux.
              </p>
            </div>

            {/* Trust badges */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl px-5 py-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-brand-blue/20">
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 text-brand-red flex items-center justify-center flex-shrink-0 text-lg">
                  🇫🇷
                </div>
                <div>
                  <p className="text-sm font-extrabold text-brand-dark dark:text-white">
                    Basé en France
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Accompagnement pour le marché Européen
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl px-5 py-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-brand-blue/20">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 text-brand-blue flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-brand-dark dark:text-white">
                    Paiement Stripe Europe
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    100% sécurisé, conforme RGPD
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl px-5 py-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-brand-blue/20">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 text-brand-blue flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-brand-dark dark:text-white">
                    Suivi Zoom Personnalisé
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Appels réguliers pour ajuster votre stratégie
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
