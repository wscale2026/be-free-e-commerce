import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, ArrowDown, Check, ChevronRight, Lock, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface FormData {
  prenom: string;
  nom: string;
  whatsapp: string;
  email: string;
  hasBusiness: string;
  offre: string;
  ca: string;
  challenge: string[];
}

const INITIAL_DATA: FormData = {
  prenom: "",
  nom: "",
  whatsapp: "",
  email: "",
  hasBusiness: "",
  offre: "",
  ca: "",
  challenge: [],
};

const QUESTIONS = [
  {
    id: "prenom" as keyof FormData,
    question: "Quel est votre Prénom ?",
    placeholder: "Répondez ici...",
    type: "text",
  },
  {
    id: "nom" as keyof FormData,
    question: "Quel est votre Nom ?",
    placeholder: "Répondez ici...",
    type: "text",
  },
  {
    id: "whatsapp" as keyof FormData,
    question: "Votre numéro WhatsApp ?",
    placeholder: "+33 6 12 34 56 78",
    type: "tel",
  },
  {
    id: "email" as keyof FormData,
    question: "Votre adresse e-mail ?",
    placeholder: "vous@exemple.com",
    type: "email",
  },
  {
    id: "hasBusiness" as keyof FormData,
    question: "Avez-vous déjà un Business ?",
    placeholder: "",
    type: "choice",
    options: ["Oui, j'ai déjà une activité", "Non, je suis débutant", "J'ai une idée mais pas encore lancé"],
  },
  {
    id: "offre" as keyof FormData,
    question: "Décrivez votre offre actuelle",
    placeholder: "Quel est votre produit/service actuel ?",
    type: "textarea",
  },
  {
    id: "ca" as keyof FormData,
    question: "Chiffre d'affaires des 30 derniers jours ?",
    placeholder: "Ex: 0€, 500€, 5000€...",
    type: "text",
  },
  {
    id: "challenge" as keyof FormData,
    question: "Quel est votre plus gros challenge ?",
    placeholder: "",
    type: "choice",
    isMulti: true,
    options: [
      "Créer mon entreprise (KBIS, SIRET)",
      "Trouver un produit rentable",
      "Créer mon site e-commerce",
      "Scaler mes ventes",
    ],
  },
];

export default function HeroForm() {
  const [formData, setFormData] = useState<FormData>(() => {
    const saved = localStorage.getItem("hero-form-data");
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem("hero-form-step");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showSummary, setShowSummary] = useState(() => {
    const saved = localStorage.getItem("hero-form-summary");
    return saved === "true";
  });
  const [theme] = useState(() => localStorage.getItem("theme") || "light");
  const [shake, setShake] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // ── Validators ────────────────────────────────────────────────
  const validateEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  const validatePhone = (v: string) => {
    // Accepts international format: optional + then 7-15 digits (spaces/dashes allowed)
    const clean = v.replace(/[\s\-().]/g, "");
    return /^\+?[0-9]{7,15}$/.test(clean);
  };

  const getFieldError = useCallback((id: keyof FormData, val: unknown): string | null => {
    if (typeof val !== "string" || val.trim() === "") return null;
    if (id === "email" && !validateEmail(val))
      return "Adresse e-mail invalide. Ex : vous@exemple.com";
    if (id === "whatsapp" && !validatePhone(val))
      return "Numéro invalide. Format attendu : +33 6 12 34 56 78";
    return null;
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem("hero-form-data", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem("hero-form-step", step.toString());
  }, [step]);

  useEffect(() => {
    localStorage.setItem("hero-form-summary", showSummary.toString());
  }, [showSummary]);

  const currentQ = QUESTIONS[step];
  const progress = ((step + (showSummary ? 1 : 0)) / (QUESTIONS.length + 1)) * 100;

  const value = formData[currentQ.id];

  const handleNext = useCallback(() => {
    setSubmitted(true);
    const isArray = Array.isArray(value);
    const isEmpty = isArray ? (value as string[]).length === 0 : !value || (typeof value === "string" && value.trim() === "");

    if (isEmpty) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    // Format validation for email & phone
    const formatErr = getFieldError(currentQ.id, value);
    if (formatErr) {
      setFieldError(formatErr);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setFieldError(null);

    // Reset submitted state before going to next step
    setSubmitted(false);

    if (step < QUESTIONS.length - 1) {
      setDirection("next");
      setAnimating(true);
      setTimeout(() => {
        setStep((s) => s + 1);
        setAnimating(false);
      }, 300);
    } else {
      setDirection("next");
      setAnimating(true);
      setTimeout(() => {
        setShowSummary(true);
        setAnimating(false);
      }, 300);
    }
  }, [value, step, currentQ.id, getFieldError]);

  const handlePrev = useCallback(() => {
    if (showSummary) {
      setDirection("prev");
      setAnimating(true);
      setTimeout(() => {
        setShowSummary(false);
        setAnimating(false);
      }, 300);
    } else if (step > 0) {
      setDirection("prev");
      setAnimating(true);
      setTimeout(() => {
        setStep((s) => s - 1);
        setAnimating(false);
      }, 300);
    }
  }, [showSummary, step]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentQ.type !== "textarea") {
      e.preventDefault();
      handleNext();
    }
  };

  const updateValue = (val: string) => {
    // Update error live only if user already tried to submit
    if (submitted) {
      const err = getFieldError(currentQ.id, val);
      setFieldError(err);
    }
    setFormData((prev) => {
      const currentVal = prev[currentQ.id];
      
      if (currentQ.id === "challenge") {
        const arr = Array.isArray(currentVal) ? currentVal : [];
        if (arr.includes(val)) {
          return { ...prev, [currentQ.id]: arr.filter(v => v !== val) };
        } else {
          return { ...prev, [currentQ.id]: [...arr, val] };
        }
      }
      
      return { ...prev, [currentQ.id]: val };
    });
  };

  useEffect(() => {
    if (inputRef.current && !showSummary) {
      inputRef.current.focus();
    }
  }, [step, showSummary]);

  const handleSubmit = async (amount: number) => {
    setIsSubmitting(true);
    try {
        // 1. Create notes from landing data
        const notes = JSON.stringify({
            hasBusiness: formData.hasBusiness,
            offre: formData.offre,
            ca: formData.ca,
            challenge: formData.challenge,
            landing_form_completed: true
        });

        // 2. Create Stripe Checkout Session directly with guest data
        const checkoutResponse = await api.post('/create-checkout-session/', {
            amount: amount,
            first_name: formData.prenom,
            last_name: formData.nom,
            email: formData.email,
            phone: formData.whatsapp,
            notes: notes,
        });

        // 3. Redirect to Stripe
        if (checkoutResponse.data.url) {
            // Success - clear local storage before redirecting
            localStorage.removeItem("hero-form-data");
            localStorage.removeItem("hero-form-step");
            localStorage.removeItem("hero-form-summary");
            window.location.href = checkoutResponse.data.url;
        } else {
            alert("Une erreur est survenue lors de la création de la session de paiement.");
        }
    } catch (error: any) {
        console.error("Submission error:", error);
        const data = error.response?.data;
        let errMsg = "Une erreur est survenue.";
        
        if (data) {
            if (typeof data === 'string') errMsg = data;
            else if (data.message) errMsg = data.message;
            else if (data.error) errMsg = data.error;
            else if (data.email) errMsg = `Email: ${data.email[0]}`;
            else if (data.username) errMsg = `Username: ${data.username[0]}`;
        }
        
        alert(errMsg);
    } finally {
        setIsSubmitting(false);
    }
  };

  const getModules = () => {
    const modules = [];
    const challenges = formData.challenge;
    
    if (challenges.some(c => c.includes("KBIS"))) {
      modules.push("Création d'entreprise complète (KBIS + SIRET)");
    }
    if (challenges.some(c => c.includes("produit"))) {
      modules.push("Recherche produit & fournisseur validé");
    }
    if (challenges.some(c => c.includes("site"))) {
      modules.push("Site e-commerce clé en main");
    }
    if (challenges.some(c => c.includes("Scaler"))) {
      modules.push("Optimisation & Scaling avancé");
    }
    modules.push("Accompagnement Zoom personnalisé");
    return modules;
  };

  return (
    <section
      id="hero-form"
      className="relative pt-28 md:pt-36 pb-16 md:pb-24 bg-gradient-to-b from-[#f0f4ff] to-[#e8eef8] dark:from-zinc-950 dark:to-zinc-900 overflow-hidden transition-colors duration-300"
    >
      {/* Decorative Blobs */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-brand-blue/10 rounded-full blur-[100px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-80 h-80 bg-brand-blue/5 rounded-full blur-[100px] opacity-40 pointer-events-none" />

      <div className="section-container">
        {/* Welcome */}
        <div className="text-center mb-8 md:mb-12 animate-fade-in-up">
          <p className="text-sm md:text-base font-medium text-brand-blue mb-3 tracking-wide uppercase">
            <i>Soyez Libre ~ Be Free</i>
          </p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-brand-dark dark:text-white tracking-tight leading-tight mb-4">
            Vérifiez votre éligibilité
            <br />
            <span className="text-brand-blue">à notre écosystème de scaling</span>
          </h1>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Répondez à 8 questions en 2 minutes et découvrez votre solution personnalisée
          </p>
        </div>


        {/* Form Card */}
        <div className="max-w-4xl mx-auto mb-10 group">
          <div
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden transition-all duration-500 transform group-hover:-translate-y-1"
            style={{
              boxShadow: theme === "light" 
                ? "0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.07), 0 24px 64px rgba(0,0,0,0.06)"
                : "0 4px 20px rgba(0,0,0,0.4)"
            }}
          >
            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 dark:bg-zinc-800 w-full">
              <div
                className="h-full bg-brand-blue transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="p-6 md:p-10">
              {!showSummary ? (
                <div
                  className={`min-h-[280px] flex flex-col ${shake ? "animate-shake" : ""}`}
                >
                  {/* Step indicator */}
                  <div className="flex items-center gap-2 mb-6">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-blue text-white text-xs font-bold">
                      {step + 1}
                    </span>
                    <span className="text-sm font-semibold text-brand-blue">
                      Étape {step + 1} sur {QUESTIONS.length} :
                    </span>
                  </div>

                  {/* Question */}
                    <div
                      className={`flex-1 flex flex-col transition-all duration-300 ${animating
                        ? direction === "next"
                          ? "opacity-0 translate-x-5"
                          : "opacity-0 -translate-x-5"
                        : "opacity-100 translate-x-0"
                      }`}
                    >
                      <h3 className="text-xl md:text-2xl font-bold text-brand-dark dark:text-white mb-2">
                        {currentQ.question}
                        <span className="text-brand-red ml-1">*</span>
                      </h3>
                      {currentQ.isMulti && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-4 uppercase tracking-wider">
                          Sélectionnez une ou plusieurs options
                        </p>
                      )}

                      {currentQ.type === "choice" ? (
                        <div className="space-y-3">
                          {currentQ.options?.map((opt) => {
                            const selected = Array.isArray(value) 
                              ? value.includes(opt)
                              : value === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() => updateValue(opt)}
                                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${selected
                                  ? "border-brand-blue bg-blue-50 dark:bg-blue-950/30 text-brand-blue"
                                  : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                <span className="font-medium">{opt}</span>
                                {selected && (
                                  <Check className="w-5 h-5 text-brand-blue" />
                                )}
                              </button>
                            );
                          })}
                          <button
                            onClick={handleNext}
                            className="btn-primary w-full mt-4 py-3.5"
                          >
                            Continuer
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      ) : currentQ.type === "textarea" ? (
                      <div className="flex-1 flex flex-col">
                        <textarea
                          ref={inputRef as React.Ref<HTMLTextAreaElement>}
                          value={value}
                          onChange={(e) => updateValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={currentQ.placeholder}
                          rows={4}
                          className="w-full bg-transparent border-b-2 border-gray-200 dark:border-zinc-800 focus:border-brand-blue outline-none text-lg py-3 px-1 resize-none transition-colors text-brand-dark dark:text-white"
                        />
                        <div className="mt-8 flex justify-center">
                          <button
                            onClick={handleNext}
                            className="btn-primary px-10 py-3.5"
                          >
                            OK
                          </button>
                        </div>
                      </div>
                      ) : (
                        <div className="flex-1 flex flex-col">
                          <input
                            ref={inputRef as React.Ref<HTMLInputElement>}
                            type={currentQ.type}
                            value={value}
                            onChange={(e) => updateValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={currentQ.placeholder}
                            className={`w-full bg-transparent border-b-2 outline-none text-lg py-3 px-1 transition-colors text-brand-dark dark:text-white ${
                              fieldError
                                ? "border-red-400 focus:border-red-500"
                                : "border-gray-200 dark:border-zinc-800 focus:border-brand-blue"
                            }`}
                          />
                          {/* Inline validation feedback — only after submit attempt */}
                          {submitted && fieldError && (
                            <div className="flex items-center gap-1.5 mt-2 text-red-500 text-sm font-medium animate-fade-in-up">
                              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {fieldError}
                            </div>
                          )}
                          {/* Valid indicator — only after submit attempt */}
                          {submitted && !fieldError && (currentQ.id === "email" || currentQ.id === "whatsapp") && typeof value === "string" && value.trim() !== "" && (
                            <div className="flex items-center gap-1.5 mt-2 text-green-500 text-sm font-medium">
                              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Format valide ✓
                            </div>
                          )}
                          <div className="mt-8 flex justify-center">
                            <button
                              onClick={handleNext}
                              className="btn-primary px-10 py-3.5"
                            >
                              OK
                            </button>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Navigation arrows */}
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      onClick={handlePrev}
                      disabled={step === 0}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${step === 0
                          ? "border-gray-100 dark:border-zinc-800 text-gray-300 dark:text-zinc-700 cursor-not-allowed"
                          : "border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-brand-blue hover:text-brand-blue"
                        }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-blue text-white hover:bg-blue-700 transition-all"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`min-h-[380px] flex flex-col transition-all duration-500 ${animating ? "opacity-0 translate-x-5" : "opacity-100 translate-x-0"
                    }`}
                >
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 mb-4">
                      <Check className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-brand-dark dark:text-white mb-2">
                      Votre Solution Personnalisée
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">Basée sur vos réponses, voici votre diagnostic</p>
                  </div>

                  {/* Modules */}
                  <div className="bg-brand-gray dark:bg-zinc-800/50 rounded-xl p-5 mb-6 space-y-3">
                    <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                      Modules inclus
                    </p>
                    {getModules().map((mod) => (
                      <div key={mod} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-brand-blue flex-shrink-0" />
                        <span className="text-sm text-brand-dark dark:text-gray-200 font-medium">{mod}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6 p-4 border-2 border-brand-blue rounded-xl bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Investissement unique et forfaitaire</p>
                    <p className="text-4xl font-extrabold text-brand-blue">2 000 €</p>
                  </div>

                  {/* Payment options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => handleSubmit(2000)}
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 bg-brand-blue text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-70"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      Payer 2 000 € maintenant
                    </button>
                    <button
                      onClick={() => handleSubmit(500)}
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 border-2 border-brand-blue text-brand-blue font-semibold py-3.5 px-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all disabled:opacity-70"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Avancer 500 €
                    </button>
                  </div>

                  {/* Stripe trust */}
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Paiement 100% sécurisé via Stripe Europe</span>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      onClick={handlePrev}
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-brand-blue hover:text-brand-blue transition-all"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Category Tags */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 md:mb-14">
          {["Agence en ligne", "Formateur", "Coach", "Consultant"].map((tag) => (
            <span
              key={tag}
              className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full text-sm text-gray-600 dark:text-gray-400 font-medium shadow-sm hover:shadow-md hover:border-brand-blue/30 hover:text-brand-blue transition-all duration-300 cursor-default"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
