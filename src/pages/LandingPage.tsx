import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Sprout, ArrowRight, CheckCircle2, Star, MessageSquare, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export default function LandingPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [announcement, setAnnouncement] = React.useState<any>(null);

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
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              <AlertCircle className="w-4 h-4" />
              <span>{announcement.title}: {announcement.message}</span>
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
                Global MLM Business Core Optimization System
              </span>
              <h1 className="text-5xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8 uppercase">
                {t('hero_title_elite')}
              </h1>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                {t('hero_description')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to={`/chat${refQuery}`}
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-2"
                >
                  <span>{t('start_with_jose')}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center"
                >
                  {t('distributor_portal')}
                </Link>
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

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Trois Piliers du Succès</h2>
            <p className="text-slate-600">Le GMBC-OS fournit un ensemble d'outils complet pour chaque catégorie NeoLife.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={ShieldCheck}
              title="Santé & Nutrition"
              description="Bénéficiez d'une éducation nutritionnelle personnalisée et de recommandations de produits pour améliorer votre bien-être."
              color="blue"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Revenus (MLM)"
              description="Automatisez le recrutement et le suivi grâce à notre système de développement commercial piloté par l'IA."
              color="indigo"
            />
            <FeatureCard
              icon={Sprout}
              title="Agriculture (Super Gro)"
              description="Conseils d'experts sur les performances agricoles et l'utilisation efficace de Super Gro."
              color="green"
            />
          </div>
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

      {/* Pricing/Automation Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">Passez en mode <span className="text-blue-600">Premium</span></h2>
            <p className="text-slate-600 font-medium">L'automatisation complète de votre business NeoLife.</p>
          </div>

          <div className="max-w-md mx-auto relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-25"></div>
            <div className="relative bg-white border-2 border-blue-600 rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Pack Automate</h3>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">SmartLink 24/7 + IA</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-slate-900">25.000</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase">FCFA / Mois</div>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> SmartLink Personnalisé 24/7
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Qualification de Leads par IA
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Redirection WhatsApp Directe
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Tableau de Bord de Performance
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Programme Ambassadeur (20%)
                </li>
              </ul>

              <Link
                to="/login"
                className="block w-full py-5 bg-blue-600 text-white rounded-2xl text-center font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 mb-8"
              >
                Activer mon système
              </Link>

              <div className="pt-8 border-t border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">Moyens de paiement acceptés</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-tighter mb-1">Local (Afrique)</h4>
                    <p className="text-[7px] font-bold text-slate-500 uppercase leading-tight">Mobile Money (MTN, Moov, Orange, Wave), Carte Bancaire</p>
                  </div>
                  <div>
                    <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-tighter mb-1">International</h4>
                    <p className="text-[7px] font-bold text-slate-500 uppercase leading-tight">Mastercard, Virement, Liens Maketou & Chariow</p>
                  </div>
                </div>
              </div>
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
                  name: "Sébastien K.", 
                  role: "Directeur Saphir", 
                  country: "Bénin", 
                  text: "Grâce au SmartLink, je reçois des leads déjà qualifiés par Coach José directement sur mon WhatsApp. C'est une révolution pour mon business."
                },
                { 
                  name: "Awa T.", 
                  role: "World Team", 
                  country: "Côte d'Ivoire", 
                  text: "Je n'ai plus besoin de passer des heures à expliquer les produits. L'IA le fait pour moi et je n'interviens que pour conclure la vente."
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

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 overflow-hidden relative">
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Prêt à développer votre entreprise NeoLife ?</h2>
          <p className="text-slate-400 mb-10 text-lg">Rejoignez des centaines de distributeurs utilisant l'IA pour automatiser leurs opérations quotidiennes.</p>
          <Link
            to="/chat"
            className="inline-flex items-center space-x-2 px-10 py-5 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-colors shadow-xl"
          >
            <span>Parler à Coach José maintenant</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        </div>
      </section>
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
