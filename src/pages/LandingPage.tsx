import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Sprout, ArrowRight, CheckCircle2, Star, MessageSquare, AlertCircle, Volume2, VolumeX, ShoppingBag, ExternalLink, Zap, Users, Globe, Plus, Rocket } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { speak, stopSpeaking } from '../lib/tts';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export default function LandingPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [announcement, setAnnouncement] = React.useState<any>(null);
  const [isSpeakingBanner, setIsSpeakingBanner] = React.useState(false);
  
  // Simulator State
  const [clients, setClients] = React.useState(10);
  const [distributors, setDistributors] = React.useState(5);
  const [orderValue, setOrderValue] = React.useState(80);

  const toggleBannerSpeak = () => {
    if (isSpeakingBanner) {
      stopSpeaking();
      setIsSpeakingBanner(false);
    } else if (announcement) {
      setIsSpeakingBanner(true);
      speak(`${announcement.title}. ${announcement.message}`);
      // Auto-reset after estimated duration
      const duration = ((announcement.title + announcement.message).split(' ').length / 150) * 60 * 1000 + 2000;
      setTimeout(() => setIsSpeakingBanner(false), duration);
    }
  };

  React.useEffect(() => {
    const q = query(collection(db, 'announcements'), where('active', '==', true), orderBy('createdAt', 'desc'), limit(1));
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) setAnnouncement(snapshot.docs[0].data());
    });
  }, []);
  const ref = searchParams.get('ref');
  const refQuery = ref ? `?ref=${ref}` : '';

  return (
    <div className="overflow-x-hidden">
      {/* Live Activity Ticker */}
      <div className="bg-slate-900 py-3 overflow-hidden border-b border-white/5">
        <div className="flex whitespace-nowrap animate-marquee">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center space-x-8 px-4">
              <span className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Nouveau prospect qualifié au Togo</span>
              </span>
              <span className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Coach José en ligne (USA - New York)</span>
              </span>
              <span className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Vente finalisée au Bénin (SmartLink)</span>
              </span>
              <span className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Nouveau distributeur actif au Canada</span>
              </span>
              <span className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Lead qualifié (France - Paris)</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Announcement Banner */}
      <AnimatePresence>
        {announcement && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn(
              "border-b py-3 px-4 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-center",
              announcement.type === 'warning' ? "bg-orange-500 text-white" : 
              announcement.type === 'success' ? "bg-emerald-500 text-white" : 
              "bg-blue-600 text-white"
            )}
          >
            <div className="max-w-7xl mx-auto flex items-center gap-4">
              <div className="flex items-center gap-3 flex-grow justify-center">
                <AlertCircle className="w-4 h-4" />
                <span>{announcement.title}: {announcement.message}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  toggleBannerSpeak();
                }}
                className={cn(
                  "p-2 rounded-lg transition-all active:scale-95",
                  isSpeakingBanner ? "bg-white text-slate-900" : "bg-white/20 text-white hover:bg-white/30"
                )}
                title={isSpeakingBanner ? "Arrêter la lecture" : "Écouter l'annonce"}
              >
                {isSpeakingBanner ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-52 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center lg:text-left grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black tracking-widest uppercase mb-6">
                Éditions Legend Vision × NeoLife × GMBC-OS
              </span>
              <h1 className="text-5xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8 uppercase">
                {t('hero_title_elite')}
              </h1>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                {t('hero_description')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
                <a
                  href="https://gmbcoreos.com/s/coachjose"
                  className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-2 active:scale-95"
                >
                  <span>{t('start_with_jose')}</span>
                  <ArrowRight className="w-5 h-5 shadow-sm" />
                </a>
                <a
                  href="https://shopneolife.com/startupforworld"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-10 py-5 bg-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all flex items-center justify-center active:scale-95"
                >
                  {t('subscribe_neolife')}
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-10 border-t border-slate-100">
                <div>
                  <div className="text-3xl font-black text-slate-900">60+</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Années d'Excellence</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-blue-600">50+</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Pays Actifs</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900">24/7</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Coach José AI</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-emerald-500">∞</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Potentiel MLM</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-[4rem] blur-3xl opacity-30" />
              <img 
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000" 
                alt="Business Automation" 
                className="relative rounded-3xl shadow-2xl border border-slate-200"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 block">Le Constat</span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">
              {t('problem_title')}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto font-medium">
              Des milliers de personnes rejoignent NeoLife avec de grands rêves. La plupart abandonnent car le système traditionnel est brisé.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "😩", title: "Recrutement Épuisant", desc: "Convaincre famille et amis, essuyer refus sur refus, perdre confiance." },
              { icon: "🌐", title: "Barrière Géographique", desc: "Marchés locaux saturés, ressources limitées à sa propre zone physique." },
              { icon: "📉", title: "Pas de Duplication", desc: "Chaque distributeur réinvente la roue. Sans système, la croissance s'arrête." },
              { icon: "🤷", title: "Suivi Inexistant", desc: "Les prospects tombent dans l'oubli, les clients ne rachètent pas." }
            ].map((p, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{p.icon}</div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-4">{p.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 block">La Nouvelle Ère</span>
              <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-8">
                {t('solution_title')}
              </h2>
              <p className="text-lg text-slate-600 mb-10 font-medium leading-relaxed">
                Trois forces combinées pour transformer chaque distributeur en entrepreneur digital qui génère des revenus même en dormant.
              </p>
              
              <div className="space-y-6">
                {[
                  { tag: "NL", title: "NeoLife International", desc: "60 ans d'excellence, produits premium, plan de compensation puissant." },
                  { tag: "OS", title: "GMBC-OS", desc: "Le cerveau digital qui automatise, optimise et scale votre business." },
                  { tag: "NDSA", title: "NDSA Academy", desc: "La plateforme SaaS qui fusionne IA, formation et réseau pour bâtir votre empire." }
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-[10px] flex-shrink-0">
                      {s.tag}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase">{s.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600 rounded-[3rem] rotate-3 scale-105 opacity-5 blur-2xl" />
              <div className="relative aspect-square bg-slate-900 rounded-[3rem] p-12 flex flex-col justify-center border border-white/10 shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Zap className="w-64 h-64 text-blue-500" />
                </div>
                <div className="space-y-4">
                  {['IA Health Coaching', 'MLM Network Mgmt', 'E-commerce Auto', 'Suivi distributeurs', 'Multilingue'].map((skill, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 text-white"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                      <span className="text-xs font-black uppercase tracking-widest">{skill}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-12 text-[8px] font-black text-blue-400 uppercase tracking-[0.3em] border-t border-white/10 pt-8">
                  Système de Croissance Alpha 1.0
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">L'Architecture du Succès</span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">Les 4 Piliers du GMBC-OS</h2>
            <p className="text-slate-600 font-medium">Le système qui transforme chaque distributeur en CEO digital.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
            <FeatureCard
              icon={TrendingUp}
              title="01. Acquisition Digitale"
              description="Funnels de vente intelligents, publicités ciblées, landing pages optimisées. Vos prospects viennent à vous 24h/24."
              color="blue"
            />
            <FeatureCard
              icon={MessageSquare}
              title="02. Coach José AI"
              description="Un assistant AI disponible 24/7 qui répond aux prospects, qualifie les leads et forme les distributeurs sur mesure."
              color="indigo"
            />
            <FeatureCard
              icon={Users}
              title="03. Duplication Réseau"
              description="Chaque nouveau distributeur reçoit automatiquement le même système. La croissance devient exponentielle."
              color="green"
            />
            <FeatureCard
              icon={Zap}
              title="04. Analytics Live"
              description="Tableaux de bord en temps réel, suivi des performances, recommandations IA pour maximiser vos revenus."
              color="slate"
            />
          </div>

          {/* How to Start (4 steps) */}
          <div className="mb-24">
            <div className="text-center mb-16">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">Parcours Intuitif</span>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">De Zéro à Distributeur Digital</h2>
            </div>
            
            <div className="grid md:grid-cols-4 gap-12 relative">
               <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 hidden lg:block" />
               {[
                 { step: "1", title: "Inscription NeoLife", desc: "Créez votre compte sur shopneolife.com/startupforworld." },
                 { step: "2", title: "SmartLink GMBC-OS", desc: "Générez votre lien personnalisé gmbcoreos.com/s/prénom." },
                 { step: "3", title: "IA en Action", desc: "Partagez votre lien. Coach José prend le relais 24/7." },
                 { step: "4", title: "Duplication Pro", desc: "Scalez votre réseau partout dans le monde à l'infini." }
               ].map((s, i) => (
                 <div key={i} className="relative z-10 text-center group">
                    <div className="w-16 h-16 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:border-blue-600 transition-colors shadow-sm">
                      <span className="text-2xl font-black text-slate-900 group-hover:text-blue-600">{s.step}</span>
                    </div>
                    <h3 className="text-[11px] font-black uppercase text-slate-900 tracking-widest mb-3">{s.title}</h3>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{s.desc}</p>
                 </div>
               ))}
            </div>
          </div>

          {/* Marketing Comparison Section */}
          <div className="mb-24">
            <div className="text-center mb-16">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">L'Evolution du Business</span>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">Marketing vs Automatisation</h2>
              <p className="text-slate-600 max-w-2xl mx-auto font-medium">Pourquoi le GMBC-OS de la NDSA est-il la solution ultime pour votre croissance ?</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Traditional Marketing */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">Marketing Traditionnel</h3>
                <ul className="space-y-4">
                  {[
                    "Prospection physique lente",
                    "Portée géographique limitée",
                    "Suivi manuel laborieux",
                    "Dépendance aux réunions",
                    "Coût en temps élevé"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Digital Marketing */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-blue-600 uppercase tracking-tighter mb-4">Marketing Digital</h3>
                <ul className="space-y-4">
                  {[
                    "Portée internationale",
                    "Présence sur les réseaux",
                    "Publicité ciblée possible",
                    "Nécessite des compétences techniques",
                    "Gestion manuelle des prospects"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* GMBC-OS Automation */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-blue-900 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Zap className="w-24 h-24 text-blue-500" />
                </div>
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Le Système GMBC-OS</h3>
                <ul className="space-y-4">
                  {[
                    "IA Coach José active 24/7",
                    "Qualification automatique (Leads)",
                    "SmartLinks de conversion",
                    "Intégration WhatsApp Directe",
                    "Scale illimité sans effort"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-blue-400">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-6 border-t border-white/10">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Performance Alpha +</span>
                </div>
              </div>
            </div>

            {/* In-depth Comparison Table */}
            <div className="mt-20 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Critère Analytique</th>
                    <th className="py-6 text-[10px] font-black text-red-400 uppercase tracking-widest text-center">✗ MLM Traditionnel</th>
                    <th className="py-6 text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center">✓ NeoLife + GMBC-OS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { c: "Prospection", t: "Famille & amis épuisés", g: "Leads automatisés en ligne" },
                    { c: "Disponibilité", t: "Seulement quand vous travaillez", g: "24h/24 via Coach José AI" },
                    { c: "Zone Géographique", t: "Quartier / ville", g: "Monde entier, 50+ pays" },
                    { c: "Formation Réseau", t: "Réunions manuelles", g: "E-learning automatisé NDSA" },
                    { c: "Suivi Prospects", t: "Carnets & mémoire", g: "CRM intelligent intégré" },
                    { c: "Barrière Linguistique", t: "Bloquante", g: "Aucune — multilingue natif" },
                    { c: "Duplication", t: "Lente et incertaine", g: "Instantanée, système clé-en-main" },
                    { c: "Revenus Passifs", t: "Rares et aléatoires", g: "Structurés et optimisés par IA" },
                    { c: "Coût Démarrage", t: "Élevé (stocks physiques)", g: "Boutique digitale dès inscription" }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 text-xs font-black text-slate-900 uppercase tracking-tight">{row.c}</td>
                      <td className="py-4 text-[11px] font-bold text-slate-400 text-center">{row.t}</td>
                      <td className="py-4 text-[11px] font-black text-emerald-600 text-center bg-emerald-50/30">{row.g}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coach Jose Business Partner Section */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-4 bg-blue-100 rounded-[3rem] blur-3xl opacity-30" />
              <div className="relative bg-white rounded-[3.5rem] border border-slate-100 p-8 shadow-2xl overflow-hidden group">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Coach José AI</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Assistant Business 24/7</p>
                  </div>
                </div>

                <div className="space-y-6 mb-12">
                  <div className="flex justify-start">
                    <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none max-w-[80%] border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                        Bonjour ! Je suis Coach José. Je gère vos prospects, qualifie vos leads et convertis vos contacts en clients NeoLife pendant que vous dormez. Prêt à automatiser votre croissance ?
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-blue-600 p-4 rounded-2xl rounded-tr-none max-w-[80%] shadow-lg shadow-blue-100">
                      <p className="text-[11px] font-bold text-white leading-relaxed">
                        Oui ! Est-ce que ça fonctionne aussi en Côte d'Ivoire ?
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none max-w-[80%] border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                        ABSOLUMENT. NeoLife est présent dans 50+ pays. Le système s'adapte à la monnaie et à la langue locale instantanément.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <Globe className="w-5 h-5 text-blue-600 mb-2" />
                    <h4 className="text-[9px] font-black uppercase text-blue-900 tracking-widest">Multilingue</h4>
                    <p className="text-[8px] font-bold text-blue-500 uppercase mt-1">FR, EN, PT, ES +</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <Zap className="w-5 h-5 text-emerald-600 mb-2" />
                    <h4 className="text-[9px] font-black uppercase text-emerald-900 tracking-widest">Qualif. Auto</h4>
                    <p className="text-[8px] font-bold text-emerald-500 uppercase mt-1">Leads Filtrés 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 block">Intelligence Partenariat</span>
              <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-8">
                Votre Partenaire <br />
                <span className="text-blue-600">Succès IA</span>
              </h2>
              <p className="text-lg text-slate-600 mb-10 font-medium leading-relaxed">
                Coach José n'est pas un simple chatbot. C'est un conseiller business intelligent formé sur les meilleures pratiques NeoLife.
              </p>
              
              <ul className="space-y-4 mb-10">
                {[
                  "Expert produits avec disclaimers clairs",
                  "Guide pas à pas vers vos objectifs de revenus",
                  "Analyse en temps réel des besoins clients",
                  "Intégration directe WhatsApp et CRM"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    {item}
                  </li>
                ))}
              </ul>

              <a 
                href="https://gmbcoreos.com/s/coachjose"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl active:scale-95"
              >
                <span>Parler à Coach José</span>
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Income Simulator */}
          <div className="mb-32">
            <div className="text-center mb-16">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 block">Projection Matrix</span>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">Simulateur de Revenus</h2>
              <p className="text-slate-600 max-w-2xl mx-auto font-medium">Calculez votre potentiel mensuel avec la puissance du GMBC-OS.</p>
            </div>

            <div className="bg-white rounded-[3.5rem] border border-slate-100 p-8 lg:p-16 shadow-2xl relative overflow-hidden">
               <div className="grid lg:grid-cols-2 gap-16 items-center">
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clients Personnels Actifs</label>
                        <span className="text-xl font-black text-slate-900">{clients}</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={clients} 
                        onChange={(e) => setClients(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distributeurs dans le Réseau</label>
                        <span className="text-xl font-black text-slate-900">{distributors}</span>
                      </div>
                      <input 
                        type="range" min="0" max="50" value={distributors} 
                        onChange={(e) => setDistributors(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commande Mensuelle ($)</label>
                        <span className="text-xl font-black text-slate-900">{orderValue}$</span>
                      </div>
                      <input 
                        type="range" min="20" max="500" value={orderValue} 
                        onChange={(e) => setOrderValue(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <TrendingUp className="w-48 h-48" />
                    </div>
                    <div className="space-y-6 relative z-10">
                      <div className="flex justify-between items-center pb-6 border-b border-white/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commission Ventes (25%)</span>
                        <span className="text-xl font-black text-white">{clients * orderValue * 0.25}$</span>
                      </div>
                      <div className="flex justify-between items-center pb-6 border-b border-white/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bonus Équipe (5%)</span>
                        <span className="text-xl font-black text-white">{distributors * (orderValue * 5) * 0.05}$</span>
                      </div>
                      <div className="pt-4">
                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Revenu Total Estimé</div>
                        <div className="text-6xl font-black text-white tracking-tighter">
                          {Math.round((clients * orderValue * 0.25) + (distributors * (orderValue * 5) * 0.05))}$
                          <span className="text-xs text-slate-500 ml-2 uppercase tracking-widest">/ Mois</span>
                        </div>
                      </div>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mt-8">
                        *Estimation indicative basée sur un modèle de duplication standard. Les résultats réels dépendent de votre effort et du marché.
                      </p>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* New Catalog Section */}
          <div className="relative mb-32">
            <div className="absolute inset-0 bg-blue-600 rounded-[3rem] rotate-1 scale-[1.02] opacity-5"></div>
            <div className="relative bg-white rounded-[3rem] border border-slate-100 p-12 lg:p-20 shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <ShoppingBag className="w-64 h-64 text-blue-600" />
              </div>
              
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black tracking-widest uppercase mb-6">
                    Solutions Mondiales NeoLife
                  </span>
                  <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-8">
                    Explorez le <br />
                    <span className="text-blue-600">Catalogue</span> Complet
                  </h2>
                  <p className="text-lg text-slate-600 mb-10 font-medium leading-relaxed">
                    Découvrez nos solutions mondiales pour la santé et le business. Accédez au catalogue officiel ou visitez directement notre boutique en ligne.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a 
                      href="https://www.neolife.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl active:scale-95 group"
                    >
                      <span>Catalogue Mondial</span>
                      <ExternalLink className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                    </a>
                    <a 
                      href="https://shopneolife.com/startupforworld/shop/atoz"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Ma Boutique en Ligne</span>
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="h-48 bg-slate-50 rounded-3xl overflow-hidden group">
                      <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Health" />
                    </div>
                    <div className="h-64 bg-blue-50 rounded-3xl overflow-hidden group">
                      <img src="https://images.unsplash.com/photo-1464855800370-025585f67a21?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Nature" />
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="h-64 bg-emerald-50 rounded-3xl overflow-hidden group">
                      <img src="https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Growth" />
                    </div>
                    <div className="h-48 bg-slate-50 rounded-3xl overflow-hidden group">
                      <img src="https://images.unsplash.com/photo-1512132411229-c30391241dd8?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Product" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News Feed Section (Fil d'Actualité) */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">Dernières Nouvelles</span>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Fil d'Actualité</h2>
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Direct de GMBC-OS Center
            </div>
          </div>

          <NewsFeed />
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                Libre d'accès,<br />
                <span className="text-blue-600 italic">Puissant</span> pour le business
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <h3 className="text-emerald-700 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Mode Visiteur
                  </h3>
                  <p className="text-slate-600 text-sm font-medium">
                    Consultation gratuite avec l'IA Coach José pour découvrir les bienfaits NeoLife.
                  </p>
                </div>
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <h3 className="text-blue-700 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4" /> Mode Distributeur
                  </h3>
                  <p className="text-slate-600 text-sm font-medium">
                    Accès aux outils d'automatisation, SmartLinks et gestion de leads (Sur abonnement).
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-blue-600 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current text-yellow-400" />)}
                </div>
                <p className="text-xl italic mb-8 sm:mb-12">
                  "Ce système a complètement changé ma façon de gérer mon entreprise NeoLife. L'IA s'occupe de l'éducation initiale, me laissant simplement conclure les ventes sur WhatsApp."
                </p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">D</div>
                  <div>
                    <div className="font-bold">Histoire de succès d'un distributeur</div>
                    <div className="text-blue-100 text-sm">Leader Commercial International</div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-50" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase mb-6 leading-none">
              Choisissez votre <span className="text-blue-600">Puissance</span>
            </h2>
            <p className="text-slate-600 font-medium max-w-2xl mx-auto">
              L'automatisation de votre business NeoLife adaptée à vos ambitions.
            </p>
          </div>
 
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Invasion Teste */}
            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 hover:border-orange-200 transition-all shadow-sm flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Invasion teste</h3>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1">Test Pulsar</p>
              </div>
              <div className="mb-8 p-6 bg-orange-50 rounded-3xl">
                <div className="text-3xl font-black text-slate-900">6.000 <span className="text-sm">FCFA</span></div>
                <div className="text-[10px] font-black text-orange-400 uppercase mt-1">Par Mois</div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-orange-300" /> IA Coach José active
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-orange-300" /> Max 20 prospects / mois
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-orange-300" /> 1 SmartLink Standard
                </li>
              </ul>
              <Link
                to={`/login${refQuery}`}
                className="w-full py-4 border-2 border-orange-600 text-orange-600 rounded-2xl text-center font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 hover:text-white transition-all"
              >
                Calculer
              </Link>
            </div>
 
            {/* Starter Plan */}
            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 hover:border-blue-200 transition-all shadow-sm flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Starter</h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Lancement Elite</p>
              </div>
              <div className="mb-8 p-6 bg-blue-50 rounded-3xl">
                <div className="text-3xl font-black text-slate-900">10.000 <span className="text-sm">FCFA</span></div>
                <div className="text-[10px] font-black text-blue-400 uppercase mt-1">Par Mois</div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" /> SmartLink IA 24/7
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" /> Prospects Illimités
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" /> Sync Google Sheets
                </li>
              </ul>
              <Link
                to={`/login${refQuery}`}
                className="w-full py-4 border-2 border-blue-600 text-blue-600 rounded-2xl text-center font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 hover:text-white transition-all"
              >
                Propulser
              </Link>
            </div>
  
            {/* Premium Plan */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] to-amber-600 rounded-[3rem] blur opacity-25"></div>
              <div className="relative bg-white border-2 border-[#D4AF37] rounded-[2.5rem] p-8 shadow-2xl flex flex-col h-full z-10">
                <div className="mb-8">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Premium</h3>
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mt-1">Performance Alpha</p>
                </div>
                <div className="mb-8 p-6 bg-amber-50 rounded-3xl">
                  <div className="text-3xl font-black text-slate-900">25.000 <span className="text-sm">FCFA</span></div>
                  <div className="text-[10px] font-black text-amber-500 uppercase mt-1">Par Mois</div>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" /> Multi-SmartLinks (3)
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" /> Dashboard Analytics Pro
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" /> Support Prioritaire
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" /> Synthèse Vocale Active
                  </li>
                </ul>
                <Link
                  to={`/login${refQuery}`}
                  className="w-full py-4 bg-[#D4AF37] text-black rounded-2xl text-center font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-[#D4AF37] transition-all"
                >
                  Dominer
                </Link>
              </div>
            </div>
 
            {/* Entreprise Plan */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-8 hover:border-blue-900 transition-all shadow-xl flex flex-col text-white">
              <div className="mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Entreprise</h3>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Structure Master</p>
              </div>
              <div className="mb-8 p-6 bg-white/5 rounded-3xl border border-white/10">
                <div className="text-3xl font-black text-white uppercase tracking-tighter">50.000 <span className="text-sm">FCFA</span></div>
                <div className="text-[10px] font-black text-slate-400 uppercase mt-1">Par Mois</div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" /> Gestion d'Equipe (10)
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" /> Marque Blanche Partielle
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" /> Consultant Matrix Dédié
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" /> Flux API Externe
                </li>
              </ul>
              <Link
                to={`/login${refQuery}`}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl text-center font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all"
              >
                Conquérir
              </Link>
            </div>
          </div>
 
          <div className="mt-16 pt-12 border-t border-slate-100 grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Moyens de paiement sécurisés</p>
              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 bg-slate-50 rounded-xl text-[9px] font-black text-slate-600 uppercase border border-slate-100">MoMo (Afrique)</div>
                <div className="px-4 py-2 bg-slate-50 rounded-xl text-[9px] font-black text-slate-600 uppercase border border-slate-100">Carte Bancaire</div>
                <div className="px-4 py-2 bg-slate-50 rounded-xl text-[9px] font-black text-slate-600 uppercase border border-slate-100">Virement</div>
                <div className="px-4 py-2 bg-slate-50 rounded-xl text-[9px] font-black text-slate-600 uppercase border border-slate-100">Wave / Orange</div>
              </div>
            </div>
            <div className="text-right flex flex-col justify-center">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Satisfait ou remboursé</p>
              <p className="text-xs font-bold text-slate-400 mt-1">Testez le système pendant 7 jours sans risque.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-6">
                Ils utilisent <br />
                <span className="text-blue-600">GMBC-OS</span>
              </h2>
              <p className="text-slate-500 font-medium mb-8">
                Découvrez comment les leaders NeoLife transforment leur approche commerciale avec l'automatisation.
              </p>
              <div className="flex gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex-1">
                  <div className="text-2xl font-black text-slate-900">1.2k+</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Leads Qualifiés</div>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex-1">
                  <div className="text-2xl font-black text-slate-900">98%</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Satisfaction</div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
              {[
                { 
                  name: "Adjoua K.", 
                  role: "Côte d'Ivoire", 
                  country: "780$/mois en 3 mois", 
                  text: "Avant le GMBC-OS, je passais mes week-ends à convaincre des gens en face-à-face. Aujourd'hui, Coach José gère mes prospects en ligne."
                },
                { 
                  name: "Kwame A.", 
                  role: "Ghana", 
                  country: "1 240$/mois en 5 mois", 
                  text: "Le système m'a permis d'atteindre des clients à Accra, Lagos et même en Europe — depuis mon téléphone. La barrière de la langue n'existe plus."
                },
                { 
                  name: "Rodrigo M.", 
                  role: "Brésil", 
                  country: "2 100$/mois en 8 mois", 
                  text: "NeoLife en combinaison avec le GMBC-OS c'est la meilleure décision business de ma vie. Réseau bâti en Amérique latine sans voyager."
                },
                { 
                  name: "Jean-Paul N.", 
                  role: "Cameroun", 
                  country: "960$/mois en 4 mois", 
                  text: "Le système travaille pendant la nuit. Je me lève le matin avec de nouveaux prospects qualifiés dans mon CRM. Ça change tout."
                }
              ].map((t, i) => (
                <div key={i} className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 relative group hover:scale-[1.02] transition-all">
                  <div className="absolute top-8 right-8 text-blue-100 group-hover:text-blue-200 transition-colors">
                    <MessageSquare className="w-12 h-12" />
                  </div>
                  <div className="flex mb-4">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />)}
                  </div>
                  <p className="text-slate-600 font-medium mb-6 italic leading-relaxed text-sm">"{t.text}"</p>
                  <div>
                    <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{t.name}</div>
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{t.role} • {t.country}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Zero Language Barrier Section */}
      <section className="py-24 bg-slate-900 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 block">Communication Matrix</span>
          <h2 className="text-4xl lg:text-7xl font-black text-white tracking-widest uppercase mb-12">Zéro Barrière <br/>Linguistique</h2>
          
          <div className="flex flex-wrap justify-center gap-4 lg:gap-8 overflow-hidden">
            {[
              "🇫🇷 Français", "🇬🇧 English", "🇧🇷 Português", "🇪🇸 Español", "🇩🇪 Deutsch", 
              "🇮🇹 Italiano", "🇳🇬 Yoruba", "🇵🇭 Filipino", "🇿🇦 Zulu", "🇰🇪 Swahili", "🇨🇳 中文"
            ].map((lang, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-blue-300 uppercase tracking-widest whitespace-nowrap"
              >
                {lang}
              </motion.div>
            ))}
          </div>
          <p className="text-slate-500 mt-12 font-bold uppercase text-xs tracking-widest">Le GMBC-OS parle la langue de vos prospects. Partout. 24h/24.</p>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 pointer-events-none">
          <Globe className="w-[800px] h-[800px] text-white animate-pulse" />
        </div>
      </section>

      {/* Compensation Plan */}
      <section className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">Levier Financier</span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">9 Façons de Gagner de l'Argent</h2>
            <p className="text-slate-600 font-medium">Le GMBC-OS optimise automatiquement vos actions pour maximiser ces flux.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
             {[
               { icon: "🛒", title: "Commission ventes", desc: "Jusqu'à 30% sur vos ventes personnelles." },
               { icon: "👥", title: "Bonus Équipe", desc: "5-10% sur le volume de votre downline directe." },
               { icon: "🌳", title: "Bonus Réseau Profond", desc: "Commissions sur plusieurs niveaux actifs." },
               { icon: "🏆", title: "Bonus Leadership", desc: "Récompenses pour l'évolution de vos leaders." },
               { icon: "🚀", title: "Démarrage Rapide", desc: "Primes pour atteindre vite les paliers." },
               { icon: "💎", title: "Bonus Diamant", desc: "Revenus additionnels pour les hauts rangs." },
               { icon: "✈️", title: "Voyages & Events", desc: "Formations exclusives et voyages offerts." },
               { icon: "🔄", title: "Revenus Résiduels", desc: "Commissions sur commandes automatiques." },
               { icon: "🌐", title: "Global Profit Sharing", desc: "Part des bénéfices mondiaux NeoLife." }
             ].map((bonus, i) => (
               <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 hover:bg-white transition-all group">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{bonus.icon}</div>
                  <h4 className="text-[11px] font-black uppercase text-slate-900 mb-2">{bonus.title}</h4>
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">{bonus.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">FAQ</h2>
             <p className="text-slate-600 font-medium">Réponses à vos questions les plus fréquentes.</p>
           </div>
           
           <div className="space-y-4">
             {[
               { q: "Est-ce que NeoLife est légal en Afrique ?", a: "Absolument. NeoLife est présent depuis des décennies avec des bureaux physiques et des licences légales dans plus de 15 pays africains (Bénin, Togo, Côte d'Ivoire, Nigeria, etc.)." },
               { q: "Combien faut-il investir pour démarrer ?", a: "L'inscription NeoLife varie selon le pays (environ 75$ pour le pack de démarrage). L'accès au GMBC-OS est un service additionnel pour automatiser votre croissance." },
               { q: "Est-ce que ça marche sans expérience ?", a: "Oui. C'est tout le but du système. NDSA vous forme au digital et le GMBC-OS automatise la partie technique. Vous n'avez qu'à suivre les guides pas à pas." },
               { q: "Comment Coach José AI est-il différent ?", a: "Ce n'est pas un bot basique. Il est formé sur le plan de compensation NeoLife, la science des produits et les techniques de closing NDSA. Il agit comme un clone de top leader." },
               { q: "Y a-t-il un support humain disponible ?", a: "Bien sûr. En plus de l'IA, vous rejoignez la communauté NDSA et l'équipe Legend Vision avec des sessions de coaching live et un support WhatsApp dédié." }
             ].map((item, i) => (
               <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 group cursor-pointer hover:border-blue-600 transition-colors">
                 <div className="flex items-center justify-between">
                   <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.q}</span>
                   <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                 </div>
                 <p className="text-xs text-slate-500 font-bold hidden group-hover:block transition-all duration-300">{item.a}</p>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* Already Distributor Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="bg-slate-900 rounded-[3.5rem] p-8 lg:p-16 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Users className="w-64 h-64 text-white" />
              </div>
              <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
                <div>
                   <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 block">Déjà Distributeur NeoLife ?</span>
                   <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase leading-[0.9] mb-8">
                     Le GMBC-OS est <br />
                     <span className="text-blue-500 italic">Universel</span>
                   </h2>
                   <p className="text-lg text-slate-400 mb-10 font-medium leading-relaxed">
                     Vous êtes déjà dans une équipe et voulez bénéficier de la puissance de l'IA ? L'abonnement GMBC-OS est un service SaaS indépendant qui se connecte à n'importe quelle boutique NeoLife.
                   </p>
                   <ul className="space-y-4 mb-12">
                     <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                       <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Aucun changement de parrain requis
                     </li>
                     <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                       <CheckCircle2 className="w-5 h-5 text-emerald-500" /> SmartLink lié à votre boutique existante
                     </li>
                     <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                       <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Formation NDSA & Templates inclus
                     </li>
                   </ul>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem]">
                   <h3 className="text-xl font-black uppercase mb-6">Abonnement SaaS Seul</h3>
                   <div className="flex items-baseline gap-2 mb-8">
                      <span className="text-5xl font-black text-white">10.000</span>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">FCFA / Mois</span>
                   </div>
                   <a 
                     href="https://gmbcoreos.com"
                     target="_blank"
                     rel="noreferrer"
                     className="w-full py-5 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                   >
                     S'abonner sur gmbcoreos.com
                   </a>
                   <p className="text-[9px] font-bold text-slate-500 uppercase text-center mt-6 tracking-widest italic">
                     *Calculé à votre nom. Sans engagement longue durée.
                   </p>
                </div>
              </div>
           </div>
        </div>
      </section>

      {/* Live Platform Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 block">Expérience Master</span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-8">Plateforme GMBC-OS — Live</h2>
            <p className="text-slate-600 mb-12 font-medium max-w-2xl mx-auto">
              Testez ici comment ça marche en temps réel. C'est votre futur SmartLink en action.
            </p>
            
            <div className="max-w-5xl mx-auto bg-white rounded-[3rem] p-4 shadow-2xl border border-slate-100 relative group overflow-hidden">
               <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-900 text-white text-[8px] font-black rounded-full z-20 flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                 gmbcoreos.com/s/coachjose/
               </div>
               <div className="aspect-[16/9] w-full rounded-[2.5rem] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10" />
                  <div className="relative z-10 text-center p-8">
                     <MessageSquare className="w-16 h-16 text-blue-600 mx-auto mb-6 opacity-50" />
                     <h3 className="text-xl font-black text-slate-900 uppercase mb-4 italic">Interagissez avec Coach José</h3>
                     <a 
                       href="https://gmbcoreos.com/s/coachjose"
                       target="_blank"
                       rel="noreferrer"
                       className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all active:scale-95"
                     >
                       Ouvrir le SmartLink ↗
                     </a>
                  </div>
               </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
               <div className="text-center">
                  <div className="text-xl font-black text-slate-900 mb-2 whitespace-nowrap uppercase tracking-tighter italic">Ce que voit votre prospect</div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Engagement automatique immédiat.</p>
               </div>
               <div className="text-center">
                  <div className="text-xl font-black text-slate-900 mb-2 whitespace-nowrap uppercase tracking-tighter italic">Votre SmartLink personnel</div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">gmbcoreos.com/s/votreprénom/</p>
               </div>
               <div className="text-center">
                  <div className="text-xl font-black text-slate-900 mb-2 whitespace-nowrap uppercase tracking-tighter italic">Un lien, tout en un</div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Funnel, IA, Boutique & CRM.</p>
               </div>
            </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-slate-900 overflow-hidden relative">
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-500/20 rotate-12">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-5xl lg:text-7xl font-black text-white mb-8 tracking-tighter uppercase leading-[0.9]">
            Votre Succès NeoLife <br />
            <span className="text-blue-500 italic">Commence</span> Aujourd'hui
          </h2>
          <p className="text-slate-400 mb-12 text-xl font-medium">Rejoignez l'élite des entrepreneurs digitaux. Le système est prêt.</p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
             <div className="p-1 rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/20 w-full sm:w-auto transform hover:scale-105 transition-transform">
               <a
                 href="https://gmbcoreos.com/s/coachjose"
                 className="flex items-center justify-center space-x-3 px-10 py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-xs"
               >
                 <span>Démarrer avec Coach José AI</span>
                 <ArrowRight className="w-5 h-5" />
               </a>
             </div>
             <a
               href="https://shopneolife.com/startupforworld"
               target="_blank"
               rel="noreferrer"
               className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all w-full sm:w-auto active:scale-95"
             >
               S'inscrire comme Distributeur
             </a>
          </div>

          <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-30">
            <div className="text-[9px] font-black text-white uppercase tracking-[0.4em]">NDSA × GMBC-OS × NeoLife International</div>
            <div className="text-[9px] font-black text-white uppercase tracking-[0.4em]">Par ABADA M. José Gaétan — +229 95 38 82 92 — Legend Vision</div>
          </div>
        </div>
        
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] animate-pulse" />
        </div>
      </section>
    </div>
  );
}

function NewsFeed() {
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [speakingId, setSpeakingId] = React.useState<string | null>(null);

  const handleSpeak = (ann: any) => {
    if (speakingId === ann.id) {
      stopSpeaking();
      setSpeakingId(null);
    } else {
      stopSpeaking(); // Ensure everything else stops
      setSpeakingId(ann.id);
      speak(`${ann.title}. ${ann.message}`);
      
      const wordCount = (ann.title + ann.message).split(' ').length;
      const duration = (wordCount / 150) * 60 * 1000 + 2000;
      
      setTimeout(() => {
        setSpeakingId(prev => prev === ann.id ? null : prev);
      }, duration);
    }
  };

  React.useEffect(() => {
    const q = query(
      collection(db, 'announcements'), 
      where('active', '==', true), 
      orderBy('createdAt', 'desc'), 
      limit(3)
    );
    
    return onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-slate-50 h-64 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (announcements.length === 0) {
    const defaultAnnouncements = [
      {
        id: 'default-1',
        type: 'info',
        title: "Bienvenue sur GMBC-OS Elite",
        message: "Découvrez le futur du MLM automatisé. Notre système est optimisé pour votre croissance internationale.",
        createdAt: { toDate: () => new Date() }
      },
      {
        id: 'default-2',
        type: 'success',
        title: "Coach José est Actif",
        message: "Votre assistant intelligent est prêt à qualifier vos nouveaux prospects 24h/24 et 7j/7.",
        createdAt: { toDate: () => new Date() }
      },
      {
        id: 'default-3',
        type: 'warning',
        title: "Optimisation en cours",
        message: "De nouveaux SmartLinks sont en cours de déploiement pour augmenter votre taux de conversion.",
        createdAt: { toDate: () => new Date() }
      }
    ];

    return (
      <div className="grid md:grid-cols-3 gap-8">
        {defaultAnnouncements.map((ann, i) => (
          <motion.div
            key={ann.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-6">
              <span className={cn(
                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                ann.type === 'warning' ? "bg-orange-500 text-white" : 
                ann.type === 'success' ? "bg-emerald-500 text-white" : 
                "bg-blue-600 text-white"
              )}>
                {ann.type}
              </span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleSpeak(ann)}
                  className={cn(
                    "w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-95 shadow-sm",
                    speakingId === ann.id 
                      ? "bg-red-500 border-red-500 text-white" 
                      : "bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-600"
                  )}
                  title={speakingId === ann.id ? "Arrêter la lecture" : "Écouter l'annonce"}
                >
                  {speakingId === ann.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="text-[10px] font-bold text-slate-400">
                  {format(new Date(), "dd MMM yyyy 'à' HH:mm")}
                </span>
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4 group-hover:text-blue-600 transition-colors">
              {ann.title}
            </h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-3">
              {ann.message}
            </p>
            <div className="mt-8 pt-6 border-t border-slate-200/50 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Information Système
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {announcements.map((ann, i) => (
        <motion.div
          key={ann.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group relative"
        >
          <div className="flex items-center justify-between mb-6">
            <span className={cn(
              "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
              ann.type === 'warning' ? "bg-orange-500 text-white" : 
              ann.type === 'success' ? "bg-emerald-500 text-white" : 
              "bg-blue-600 text-white"
            )}>
              {ann.type}
            </span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleSpeak(ann)}
                className={cn(
                  "w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-95 shadow-sm",
                  speakingId === ann.id 
                    ? "bg-red-500 border-red-500 text-white" 
                    : "bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-600"
                )}
                title={speakingId === ann.id ? "Arrêter la lecture" : "Écouter l'annonce"}
              >
                {speakingId === ann.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="text-[10px] font-bold text-slate-400">
                {ann.createdAt?.toDate ? format(ann.createdAt.toDate(), "dd MMM yyyy 'à' HH:mm") : 'Récent'}
              </span>
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4 group-hover:text-blue-600 transition-colors">
            {ann.title}
          </h3>
          <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-3">
            {ann.message}
          </p>
          <div className="mt-8 pt-6 border-t border-slate-200/50 flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Lu par l'équipe
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }: any) {
  const colors: any = {
    blue: 'bg-blue-100 text-blue-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600'
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colors[color]}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-start space-x-3">
      <div className="mt-1">
        <CheckCircle2 className="w-6 h-6 text-green-500" />
      </div>
      <span className="text-slate-700 font-medium">{text}</span>
    </li>
  );
}
