import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Mail, Phone, Globe, Copy, Check, Save, Camera, Shield, CreditCard, ExternalLink, MessageCircle, AlertCircle, TrendingUp, Share2, Layout } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { User } from '../types';
import { cn } from '../lib/utils';
import { isSubscriptionActive } from '../lib/subscription';
import { FOUNDER_CONFIG } from '../constants';

export default function ProfilePage() {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = React.useState<User | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    displayName: '',
    phoneNumber: '',
    whatsapp: '',
    country: '',
    photoURL: '',
    neoLifeShopUrl: ''
  });

  React.useEffect(() => {
    async function fetchUserData() {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as User;
          setUserData(data);
          setFormData({
            displayName: data.displayName || user.displayName || '',
            phoneNumber: data.phoneNumber || '',
            whatsapp: data.whatsapp || '',
            country: data.country || '',
            photoURL: data.photoURL || user.photoURL || '',
            neoLifeShopUrl: data.neoLifeShopUrl || ''
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserData();
  }, [user]);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const smartLink = userData?.referralCode ? `${window.location.origin}/chat?ref=${userData.referralCode}` : '';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setUserData(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const isActive = isSubscriptionActive(userData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !userData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Veuillez vous connecter.</h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden"
          >
            <div className="h-40 bg-gradient-to-br from-emerald-600 via-blue-600 to-indigo-700 relative">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            </div>
            
            <div className="px-8 pb-10">
              <div className="relative -mt-20 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center md:items-end space-y-6 md:space-y-0 md:space-x-8 text-center md:text-left">
                  <div className="relative group">
                    <div className="absolute -inset-1 blur-2xl opacity-30 group-hover:opacity-50 transition-opacity bg-white"></div>
                    <img 
                      src={formData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName)}&background=random&size=200`} 
                      alt={userData.displayName}
                      className="relative w-40 h-40 rounded-[2.5rem] border-8 border-white shadow-2xl object-cover"
                    />
                    {isEditing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="text-white w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <div className="pb-4">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{userData.displayName}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                      <span className={cn(
                        "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm",
                        userData.role === 'admin' ? "bg-red-500 text-white" :
                        userData.role === 'distributor' ? "bg-blue-600 text-white" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {userData.role === 'admin' ? 'Co-Fondateur' : userData.role === 'distributor' ? 'Distributeur Elite' : 'Candidat'}
                      </span>
                      <span className={cn(
                        "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center",
                        isActive ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                      )}>
                        {isActive ? <Check className="w-3 h-3 mr-1.5" /> : <AlertCircle className="w-3 h-3 mr-1.5" />}
                        {isActive ? 'Système Actif' : 'Système Inactif'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 mb-4">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                    >
                      Modifier mon profil
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center px-1">
                      <UserIcon className="w-3 h-3 mr-2 text-emerald-500" /> Nom complet
                    </label>
                    <input
                      disabled={!isEditing}
                      value={formData.displayName}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-emerald-500 focus:outline-none transition-colors disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center px-1">
                      <Mail className="w-3 h-3 mr-2 text-blue-500" /> Email Professionnel
                    </label>
                    <input
                      disabled
                      value={userData.email}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center px-1">
                      <MessageCircle className="w-3 h-3 mr-2 text-green-500" /> Numéro WhatsApp (Requis pour SmartLink)
                    </label>
                    <input
                      disabled={!isEditing}
                      placeholder="Ex: 229XXXXXXXX"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-emerald-500 focus:outline-none transition-colors disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center px-1">
                      <ExternalLink className="w-3 h-3 mr-2 text-indigo-500" /> Lien Boutique NeoLife
                    </label>
                    <input
                      disabled={!isEditing}
                      placeholder="https://shopneolife.com/votre-boutique"
                      value={formData.neoLifeShopUrl}
                      onChange={(e) => setFormData({...formData, neoLifeShopUrl: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-emerald-500 focus:outline-none transition-colors disabled:opacity-60"
                    />
                  </div>
                </div>

                {isEditing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end pt-4 border-t border-slate-100"
                  >
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center space-x-3 px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                      <span>Mettre à jour mon SmartLink</span>
                    </button>
                  </motion.div>
                )}
              </form>
            </div>
          </motion.div>

          {/* SmartLink Section */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-emerald-500/20 rounded-2xl">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Votre SmartLink 24/7</h3>
                  <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">Le guerrier digital qui ne dort jamais</p>
                </div>
              </div>

              {!isActive ? (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl mb-8">
                  <div className="flex items-start space-x-4">
                    <AlertCircle className="w-6 h-6 text-red-400 mt-1" />
                    <div>
                      <p className="text-sm font-bold text-white mb-2 uppercase">Système en Pause</p>
                      <p className="text-xs text-red-200/80 leading-relaxed font-medium">
                        Votre SmartLink a cessé de générer des revenus car votre abonnement est expiré. 
                        Tous les prospects sont actuellement redirigés vers le compte fondateur {FOUNDER_CONFIG.name}.
                      </p>
                      <button className="mt-4 px-8 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">
                        Réactiver mon SmartLink
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10 mb-8 relative">
                    <div className="flex items-center justify-between gap-4">
                      <div className="truncate font-mono text-sm text-emerald-200">{smartLink}</div>
                      <div className="flex items-center gap-2">
                        <AnimatePresence>
                          {copied && (
                            <motion.span
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="text-[9px] font-black text-emerald-400 capitalize bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20"
                            >
                              Lien copié !
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <button 
                          onClick={() => handleCopyCode(smartLink)}
                          className="flex-shrink-0 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-90"
                        >
                          {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                      <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2 flex items-center">
                        <Shield className="w-3 h-3 mr-2" /> Anti-Blocage Algo v2.0
                      </h4>
                      <p className="text-[9px] text-white/60 leading-tight">
                        Votre SmartLink utilise le masquage de domaine dynamique. Partagez-le sur Facebook et Instagram en toute sécurité. Coach José gère la redirection propre.
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                      <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-2" /> Optimisation SEO
                      </h4>
                      <p className="text-[9px] text-white/60 leading-tight">
                        Chaque clic sur votre lien améliore votre autorité locale. Coach José détecte le pays et adapte son discours de vente immédiatement.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-blue-600/10 rounded-3xl border border-blue-500/20 mb-8 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-tighter mb-1">Devenir Partenaire Officiel ?</h4>
                      <p className="text-[9px] text-blue-200 font-medium">Rejoignez le programme Ambassadeur pour débloquer des commissions sur votre downline.</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                      S'inscrire
                    </button>
                  </div>

                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest text-center px-10">
                    Propulsez ce lien sur vos réseaux sociaux. Coach José s'occupe de qualifier les prospects et de conclure la vente pour vous.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Social Media Templates */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Modèles de Publication</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Copiez-collez pour vos réseaux sociaux</p>
              </div>
              <Layout className="w-6 h-6 text-blue-600" />
            </div>

            <div className="space-y-6">
              {[
                {
                  title: "Opportunité Business",
                  content: "Vous cherchez à digitaliser votre activité NeoLife ? Découvrez comment GMBC-OS et Coach José automatisent votre prospection 24/7. 🚀 Cliquez ici pour voir la démo : {link}"
                },
                {
                  title: "Focus Produit",
                  content: "Besoin de conseils personnalisés sur votre nutrition ? Coach José, notre expert IA, vous attend pour un bilan gratuit ! 🍎 Découvrez-le ici : {link}"
                }
              ].map((template, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{template.title}</span>
                    <button 
                      onClick={() => handleCopyCode(template.content.replace('{link}', smartLink))}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">"{template.content.replace('{link}', smartLink)}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Subscription & Affiliate */}
        <div className="space-y-8">
           {/* Subscription Card */}
           <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-emerald-500" />
              Abonnement Système
            </h3>
            <div className="space-y-4 mb-8">
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Statut</span>
                <span className={cn(
                  "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                  isActive ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                )}>
                  {isActive ? 'Actif' : 'Expiron'}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Échéance</span>
                <span className="text-xs font-black text-slate-900 uppercase">
                  {userData.subscriptionEndDate ? new Date(userData.subscriptionEndDate).toLocaleDateString() : 'Illimité'}
                </span>
              </div>
            </div>
            {!isActive && (
              <div className="space-y-4">
                <button 
                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95"
                  onClick={() => window.open('https://wa.me/2290195388292?text=Je%20souhaite%20renouveler%20mon%20abonnement%20GMBC-OS', '_blank')}
                >
                  Renouveler 10.000 FCFA
                </button>
                
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center">
                    <Shield className="w-3 h-3 mr-2 text-blue-500" /> Moyens de Paiement
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter mb-1">Afrique (Local)</p>
                      <p className="text-[9px] font-bold text-slate-500 leading-tight">
                        Mobile Money (MTN, Moov, Wave, Orange), Carte Bancaire Locale.
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter mb-1">International</p>
                      <p className="text-[9px] font-bold text-slate-500 leading-tight">
                        Mastercard, Virement Bancaire, Liens de paiement (Maketou, Chariow).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Affiliate Program */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Affiliation Ambassadeur
            </h3>
            
            <div className="mb-8">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Commission (20%)</div>
              <div className="text-4xl font-black text-white tracking-tighter">
                {userData.commissionBalance || 0} <span className="text-lg text-indigo-400">FCFA</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-white/5 rounded-2xl flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Gagné</span>
                <span className="text-xs font-black text-white">{userData.totalEarnings || 0} FCFA</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ambassadeur</span>
                <span className="px-2 py-0.5 bg-indigo-500 rounded text-[8px] font-black uppercase">VÉRIFIÉ</span>
              </div>
            </div>

            <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all active:scale-95">
              Demander un retrait
            </button>
            <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest mt-6">
              Soyez payé pour chaque collègue que vous aidez à automatiser son business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
