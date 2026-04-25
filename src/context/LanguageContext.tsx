import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'en' | 'es' | 'pt';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

const translations: Translations = {
  hero_title: {
    fr: "Propulsez votre Business NeoLife",
    en: "Propel Your NeoLife Business",
    es: "Impulsa tu Negocio NeoLife",
    pt: "Impulsione o seu Negócio NeoLife"
  },
  hero_subtitle: {
    fr: "L'automatisation intelligente pour les distributeurs ambitieux.",
    en: "Smart automation for ambitious distributors.",
    es: "Automatización inteligente para distribuidores ambiciosos.",
    pt: "Automação inteligente para distribuidores ambiciosos."
  },
  hero_title_elite: {
    fr: "GMBC-OS: L'Élite de l'automatisation NeoLife",
    en: "GMBC-OS: The Elite of NeoLife Automation",
    es: "GMBC-OS: La Élite de la automatización NeoLife",
    pt: "GMBC-OS: A Elite da automação NeoLife"
  },
  hero_description: {
    fr: "La solution ultime pour transformer votre business. Consultation gratuite pour les visiteurs. Système de croissance premium pour les distributeurs.",
    en: "The ultimate solution to transform your business. Free consultation for visitors. Premium growth system for distributors.",
    es: "La solución definitiva para transformar su negocio. Consulta gratuita para visitantes. Sistema de crecimiento premium para distribuidores.",
    pt: "A solução definitiva para transformar o seu negócio. Consulta gratuita para visitantes. Sistema de crescimento premium para distribuidores."
  },
  start_with_jose: {
    fr: "Démarrer avec Coach José",
    en: "Start with Coach José",
    es: "Empezar con Coach José",
    pt: "Começar com Coach José"
  },
  distributor_portal: {
    fr: "Portail Distributeur",
    en: "Distributor Portal",
    es: "Portal del Distribuidor",
    pt: "Portal do Distribuidor"
  },
  get_started: {
    fr: "Démarrer Maintenant",
    en: "Get Started Now",
    es: "Empezar Ahora",
    pt: "Começar Agora"
  },
  coach_jose_title: {
    fr: "Coach José : Votre Expert IA",
    en: "Coach José: Your AI Expert",
    es: "Coach José: Tu Experto IA",
    pt: "Coach José: Seu Especialista IA"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    const detectLanguage = async () => {
      try {
        // Try IP-based detection first for "country-based" accuracy
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data.country_code?.toLowerCase();

        const countryToLang: Record<string, Language> = {
          'fr': 'fr', 'be': 'fr', 'ch': 'fr', 'bj': 'fr', 'tg': 'fr', 'ci': 'fr', 'sn': 'fr', 'cm': 'fr',
          'us': 'en', 'gb': 'en', 'ca': 'en', 'ng': 'en', 'gh': 'en', 'ke': 'en',
          'es': 'es', 'mx': 'es', 'ar': 'es',
          'pt': 'pt', 'br': 'pt', 'ao': 'pt', 'mz': 'pt'
        };

        if (countryCode && countryToLang[countryCode]) {
          setLanguage(countryToLang[countryCode]);
        } else {
          // Fallback to browser language
          const browserLang = navigator.language.split('-')[0] as Language;
          if (['fr', 'en', 'es', 'pt'].includes(browserLang)) {
            setLanguage(browserLang);
          }
        }
      } catch (error) {
        console.error("Language detection failed", error);
      }
    };

    detectLanguage();
  }, []);

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
