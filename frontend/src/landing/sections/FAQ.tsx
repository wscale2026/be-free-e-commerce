import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    question: "Pourquoi ne pas simplement prendre un KBIS seul ?",
    answer:
      "Parce qu'un document ne crée pas un business rentable. Vous n'achetez pas 'juste un papier'. Vous investissez dans l'expertise d'un pro qui bâtit votre structure de A à Z (KBIS, SIRET, compte pro, déclarations) ET vous ouvre les portes de notre écosystème complet : formation, recherche produit, boutique clé en main et suivi personnalisé. C'est un accompagnement vers la liberté, pas un simple service administratif.",
  },
  {
    question: "Et si le produit ne marche pas ?",
    answer:
      "Notre méthode repose sur la validation AVANT le lancement. Nous analysons les données de marché, testons la demande, et ne validons un produit que lorsque les indicateurs sont verts. De plus, le suivi Zoom vous permet d'ajuster votre stratégie en temps réel avec un expert à vos côtés.",
  },
  {
    question: "Comment se passent les visios ?",
    answer:
      "Les visioconférences se déroulent sur Zoom, avec un planning flexible adapté à votre disponibilité. Fréquence : généralement 1 à 2 appels par semaine selon votre avancement. Chaque session est structurée avec un objectif précis : résolution de blocages, validation de choix, ou planification des actions à venir.",
  },
];

function FAQItem({
  faq,
  isOpen,
  onToggle,
  delay,
  visible,
}: {
  faq: { question: string; answer: string };
  isOpen: boolean;
  onToggle: () => void;
  delay: number;
  visible: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const scrollHeight = contentRef.current?.scrollHeight || 0;
    requestAnimationFrame(() => {
      setHeight(isOpen ? scrollHeight : 0);
    });
  }, [isOpen]);

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:border-brand-blue/20 ${
        visible ? "animate-fade-in-up" : "opacity-0"
      } ${isOpen ? "shadow-card dark:shadow-zinc-950 border-brand-blue/20" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left group"
      >
        <span className="text-base md:text-lg font-extrabold text-brand-dark dark:text-white group-hover:text-brand-blue transition-colors duration-300 leading-snug">
          {faq.question}
        </span>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center bg-brand-gray dark:bg-zinc-800 flex-shrink-0 transition-all duration-300 ${
            isOpen ? "rotate-180 bg-brand-blue text-white" : ""
          }`}
        >
          <ChevronDown className={`w-4 h-4 ${isOpen ? "text-white" : "text-brand-dark dark:text-white"}`} />
        </div>
      </button>
      <div
        className="transition-all duration-300 ease-out overflow-hidden"
        style={{ height }}
      >
        <div ref={contentRef} className="px-5 md:px-6 pb-5 md:pb-6">
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
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
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="faq" className="py-20 md:py-28 bg-brand-gray dark:bg-zinc-900/50 transition-colors duration-300" ref={ref}>
      <div className="section-container">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-extrabold text-brand-dark dark:text-white mb-4 tracking-tight">
            Vos Questions, <span className="text-brand-blue">Nos Réponses</span>
          </h2>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Les doutes qui bloquent le clic. Éliminés avant qu'ils ne naissent.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {FAQS.map((faq, idx) => (
            <FAQItem
              key={idx}
              faq={faq}
              isOpen={openIndex === idx}
              onToggle={() =>
                setOpenIndex(openIndex === idx ? null : idx)
              }
              delay={idx * 100}
              visible={visible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
