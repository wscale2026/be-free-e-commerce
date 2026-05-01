import { useState, useEffect } from "react";
import { ArrowUpRight, Sun, Moon } from "lucide-react";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-zinc-800"
          : "bg-transparent"
      }`}
    >
      <div className="section-container flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="Be Free E-Commerce"
            className="h-10 md:h-12 w-auto object-contain transition-all duration-300 dark:brightness-110 rounded-xl"
          />
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("anti-galere")}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-blue dark:hover:text-brand-blue transition-colors"
          >
            L'Écosystème
          </button>
          <button
            onClick={() => scrollToSection("timeline")}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-blue dark:hover:text-brand-blue transition-colors"
          >
            Méthode
          </button>
          <button
            onClick={() => scrollToSection("formateur")}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-blue dark:hover:text-brand-blue transition-colors"
          >
            Formateur
          </button>
          <button
            onClick={() => scrollToSection("faq")}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-blue dark:hover:text-brand-blue transition-colors"
          >
            FAQ
          </button>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-600 dark:text-gray-400"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <a
            href="/login"
            className="inline-flex text-[13px] sm:text-sm font-semibold text-brand-dark dark:text-gray-300 hover:text-brand-blue dark:hover:text-brand-blue transition-colors px-2 sm:px-4"
          >
            Connexion
          </a>
          <button
            onClick={() => scrollToSection("hero-form")}
            className="btn-primary text-sm py-2.5 px-5 md:px-6"
          >
            <span className="hidden sm:inline">Vérifier mon éligibilité</span>
            <span className="sm:hidden">Diagnostic</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
