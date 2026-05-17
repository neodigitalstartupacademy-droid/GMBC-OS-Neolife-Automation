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
    fr: "Millionnaires Sans Frontières",
    en: "Millionaires Without Borders",
    es: "Millonarios Sin Fronteras",
    pt: "Milionários Sem Fronteiras"
  },
  hero_description: {
    fr: "NeoLife — 60 ans d'excellence mondiale — libéré du MLM traditionnel grâce à l'IA et au GMBC-OS.",
    en: "NeoLife — 60 years of global excellence — freed from traditional MLM thanks to AI and GMBC-OS.",
    es: "NeoLife — 60 años de excelencia global — liberado del MLM tradicional gracias a la IA y GMBC-OS.",
    pt: "NeoLife — 60 anos de excelência global — liberto do MLM tradicional graças à IA e ao GMBC-OS."
  },
  start_with_jose: {
    fr: "Rejoindre Coach José AI",
    en: "Join Coach José AI",
    es: "Unirse a Coach José AI",
    pt: "Juntar-se ao Coach José AI"
  },
  subscribe_neolife: {
    fr: "S'inscrire sur NeoLife",
    en: "Register on NeoLife",
    es: "Registrarse en NeoLife",
    pt: "Registar-se na NeoLife"
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
      // Priority 1: User choice (could be saved in local storage)
      const savedLang = localStorage.getItem('gmbc_user_lang') as Language;
      if (savedLang && ['fr', 'en', 'es', 'pt'].includes(savedLang)) {
        setLanguage(savedLang);
        return;
      }

      // Priority 2: Browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (['fr', 'en', 'es', 'pt'].includes(browserLang)) {
        setLanguage(browserLang);
        // We continue to IP detection if it's not a common lang, or just return
      }

      try {
        // Try IP-based detection with a timeout to avoid hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        const countryCode = data.country_code?.toLowerCase();

        const countryToLang: Record<string, Language> = {
          'fr': 'fr', 'be': 'fr', 'ch': 'fr', 'bj': 'fr', 'tg': 'fr', 'ci': 'fr', 'sn': 'fr', 'cm': 'fr', 'ga': 'fr', 'gn': 'fr',
          'us': 'en', 'gb': 'en', 'ca': 'en', 'ng': 'en', 'gh': 'en', 'ke': 'en', 'za': 'en',
          'es': 'es', 'mx': 'es', 'ar': 'es', 'co': 'es', 'pe': 'es',
          'pt': 'pt', 'br': 'pt', 'ao': 'pt', 'mz': 'pt'
        };

        if (countryCode && countryToLang[countryCode]) {
          setLanguage(countryToLang[countryCode]);
        }
      } catch (error) {
        // Silently fail, we already set browser language as fallback
      }
    };

    detectLanguage();
  }, []);

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  const setLanguageAndStore = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('gmbc_user_lang', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageAndStore, t }}>
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
