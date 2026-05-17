import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link } from 'react-router-dom';
import { 
  Users, 
  MousePointer2, 
  Send, 
  Copy, 
  Check, 
  MessageCircle,
  TrendingUp,
  LayoutDashboard,
  Calendar,
  ChevronRight,
  Rocket,
  FileSpreadsheet,
  RefreshCw,
  X,
  Save,
  Clock,
  BarChart3,
  LineChart,
  LayoutGrid,
  Rows,
  Settings2,
  Zap,
  ArrowUpRight,
  Eye,
  MoreVertical,
  Volume2,
  Globe,
  UserCircle,
  Activity
} from 'lucide-react';
import { Lead, User } from '../types';
import { format } from 'date-fns';
import { appendLeadToSheet } from '../services/sheetsService';
import { speak } from '../lib/tts';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const MOCK_CHART_DATA = [
  { name: 'Lun', clics: 120, leads: 12, conversions: 2 },
  { name: 'Mar', clics: 150, leads: 18, conversions: 4 },
  { name: 'Mer', clics: 180, leads: 25, conversions: 5 },
  { name: 'Jeu', clics: 140, leads: 15, conversions: 3 },
  { name: 'Ven', clics: 210, leads: 30, conversions: 8 },
  { name: 'Sam', clics: 250, leads: 42, conversions: 12 },
  { name: 'Dim', clics: 190, leads: 20, conversions: 6 },
];

import { useNotifications } from '../context/NotificationContext';

export default function DashboardPage() {
  const { addNotification } = useNotifications();
  const [user] = useAuthState(auth);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [userData, setUserData] = React.useState<User | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [intentFilter, setIntentFilter] = React.useState<string>('all');
  const [countryFilter, setCountryFilter] = React.useState<string>('all');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [isSavingLead, setIsSavingLead] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'compact' | 'detailed'>('detailed');

  React.useEffect(() => {
    if (!user) return;

    // Fetch user profile
    const fetchUser = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data() as User);
        }
      } catch (error) {
        console.error("Dashboard: Error fetching user profile:", error);
      }
    };
    fetchUser();
  }, [user]);

  React.useEffect(() => {
    if (!user || !userData) return;

    // Listen for leads - non-admins only see their own leads
    const leadsCollection = collection(db, 'leads');
    let leadsQuery = query(leadsCollection, orderBy('createdAt', 'desc'));
    
    // If not admin, restrict query to user's leads
    if (userData.role !== 'admin') {
      leadsQuery = query(
        leadsCollection, 
        where('distributorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
      const newLeads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      setLeads(newLeads);
      setIsLoading(false);
      
      // Update selected lead if it exists in the new list
      if (selectedLead) {
        const updated = newLeads.find(l => l.id === selectedLead.id);
        if (updated) setSelectedLead(updated);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });

    return () => unsubscribe();
  }, [user, userData, selectedLead]);

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setIsSavingLead(true);
    try {
      const leadRef = doc(db, 'leads', selectedLead.id);
      await updateDoc(leadRef, {
        status: selectedLead.status,
        notes: selectedLead.notes || '',
        updatedAt: new Date().toISOString()
      });
      // Optionally notify user here
    } catch (error) {
      console.error("Error updating lead:", error);
      alert("Erreur lors de la mise à jour du prospect.");
    } finally {
      setIsSavingLead(false);
    }
  };

  const handleSyncToSheets = async () => {
    if (!userData?.googleAccessToken) {
      setSyncStatus({ type: 'error', message: 'Veuillez vous reconnecter pour autoriser Google Sheets' });
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);
    try {
      // Sync the most recent 5 leads for demo
      const syncPromises = leads.slice(0, 5).map(lead => 
        appendLeadToSheet(userData.googleAccessToken!, {
          ...lead,
          distributorId: userData.id
        })
      );
      
      await Promise.all(syncPromises);
      setSyncStatus({ type: 'success', message: 'Leads synchronisés avec succès !' });
      
      // Auto clear success message after 5s
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err: any) {
      console.error(err);
      setSyncStatus({ type: 'error', message: 'Échec de la synchronisation. Vérifiez vos permissions.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const countries = React.useMemo(() => {
    const uniqueCountries = new Set(leads.map(l => l.country).filter(Boolean));
    return Array.from(uniqueCountries).sort();
  }, [leads]);

  const filteredLeads = leads
    .filter(lead => statusFilter === 'all' || lead.status === statusFilter)
    .filter(lead => intentFilter === 'all' || lead.intent === intentFilter)
    .filter(lead => countryFilter === 'all' || lead.country === countryFilter)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt?.valueOf?.() || a.createdAt).getTime();
      const dateB = new Date(b.createdAt?.valueOf?.() || b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const referralLink = `${window.location.origin}/chat?ref=${userData?.referralCode || user?.uid?.slice(0, 8)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: 'Total Prospects', value: leads.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Clics sur le lien', value: '1,284', icon: MousePointer2, color: 'text-indigo-600', bg: 'bg-indigo-100' }, // Mock stat for demo
    { label: 'Conversions', value: leads.filter(l => l.status === 'converted').length, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050b18] text-slate-300 selection:bg-[#D4AF37] selection:text-black pb-20">
      {/* Ambient Background Particles/Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D4AF37]/5 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/30">
                  <Activity className="w-6 h-6 text-[#D4AF37] animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#050b18] animate-ping" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">
                  Système <span className="text-[#D4AF37]">Alpha-Elite</span>
                </h1>
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mt-1">Séquence Commandante Active</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-3 backdrop-blur-md">
                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">
                  Agent: {user?.displayName}
                </span>
              </div>
              
              <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center gap-3 backdrop-blur-md">
                <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">
                  Niveau {userData?.role === 'admin' ? 'Alpha' : 'Opérateur'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex gap-4">
              <button
                onClick={handleSyncToSheets}
                disabled={isSyncing}
                className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 text-[#D4AF37] rounded-2xl hover:bg-white/10 transition-all group disabled:opacity-50 shadow-lg"
                title="Synchroniser la Matrice"
              >
                {isSyncing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
              </button>
              
              <a
                href={`https://wa.me/?text=Découvrez l'IA Elite : ${encodeURIComponent(referralLink)}`}
                target="_blank"
                rel="noreferrer"
                className="w-12 h-12 flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
                title="Diffuser sur WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>

            <div className="h-10 w-[1px] bg-white/10 hidden lg:block" />

            <div className="flex flex-col items-center sm:items-end gap-1">
              <div className="flex items-center gap-3 px-6 py-2 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Pulse Système</span>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-1 h-3 bg-[#D4AF37]/20 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ height: ['20%', '80%', '40%', '100%', '30%'] }}
                          transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                          className="w-full bg-[#D4AF37]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-8 w-[1px] bg-white/10 mx-2" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <UserCircle className="w-5 h-5 text-white/50" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="flex-1 px-5 py-3 bg-transparent text-[10px] font-mono text-[#D4AF37] overflow-hidden text-ellipsis whitespace-nowrap min-w-[120px] max-w-[200px] border-r border-white/5">
                {referralLink}
              </div>
              <button
                onClick={copyToClipboard}
                className="px-6 py-3 bg-[#D4AF37] text-black hover:bg-white transition-all active:scale-95 group relative"
              >
                <div className="flex items-center gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
                  <span className="text-[9px] font-black uppercase tracking-widest">{copied ? 'Acquis' : 'Propulse'}</span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Stats Pulse Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group relative bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
                <stat.icon className="w-24 h-24 text-white" />
              </div>
              
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg border",
                stat.color.includes('blue') ? "bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/20" :
                stat.color.includes('indigo') ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-indigo-500/20" :
                "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20"
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              
              <div className="relative z-10 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-1">{stat.label}</div>
                <div className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
                  {stat.value}
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>

      {/* SmartLink Performance Section */}
      <section className="mb-20">
        <div className="bg-white/5 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <LineChart className="w-64 h-64 text-[#D4AF37]" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center border border-[#D4AF37]/30">
                  <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Performance Flux 24/7</h2>
              </div>
              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Analyse Télémétrique de la Matrice</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              {[
                { label: 'Clics', color: 'bg-blue-500', text: 'text-blue-400' },
                { label: 'Prospects', color: 'bg-[#D4AF37]', text: 'text-[#D4AF37]' },
                { label: 'Ventes', color: 'bg-emerald-500', text: 'text-emerald-400' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]", item.text)} />
                  <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", item.text)}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-12 relative z-10">
            <div className="lg:col-span-3 h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_CHART_DATA}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: 'rgba(255,255,255,0.3)', textAnchor: 'middle' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(5,11,24,0.9)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '20px', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      fontSize: '10px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="clics" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="leads" fill="#D4AF37" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="conversions" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-[#D4AF37]/20 to-transparent rounded-[2rem] border border-[#D4AF37]/20 group/stat hover:border-[#D4AF37]/50 transition-all">
                <div className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
                  <span>Conversion</span>
                  <Zap className="w-3 h-3 animate-pulse" />
                </div>
                <div className="text-4xl font-black text-white tracking-tighter mb-2">8.4%</div>
                <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-full w-fit border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3" /> +2.1%
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 group/stat hover:border-blue-500/30 transition-all">
                <div className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Coût Acquisition (CPA)</div>
                <div className="text-3xl font-black text-white tracking-tighter mb-1">0.00 <span className="text-sm opacity-30 font-bold">€</span></div>
                <div className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Flux Organique Actif</div>
              </div>

              <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Systèmes Connectés</div>
                <div className="grid grid-cols-3 gap-2">
                  {['MoMo', 'Visa', 'Stripe'].map(sys => (
                    <div key={sys} className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-black text-[#D4AF37] uppercase shadow-inner">
                      {sys}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sales Statistics Section */}
      <section className="mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            <div className="h-full bg-gradient-to-br from-slate-900 to-[#050b18] rounded-[3rem] p-10 border border-white/10 relative overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-[#D4AF37] text-black flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Archives 30j</div>
                </div>
                
                <div className="space-y-2 mb-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Volume d'Affaire Total</p>
                  <h3 className="text-5xl font-black text-white tracking-tighter">2.45M <span className="text-lg opacity-30">€</span></h3>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/5">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Panier Moyen</p>
                    <p className="text-xl font-black text-[#D4AF37]">350 <span className="text-[10px] opacity-50">€</span></p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Unités</p>
                    <p className="text-2xl font-black text-white">742</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="h-full bg-white/5 backdrop-blur-xl rounded-[3rem] p-10 border border-white/10 relative shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Produits de Haute Fréquence</h3>
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Entités les plus actives de la boutique</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                  <Settings2 className="w-6 h-6" />
                </div>
              </div>
              
              <div className="grid gap-4">
                {[
                  { name: 'Pro Vitality Matrix', sales: 242, revenue: '8.4k €', trend: '+12%', color: 'blue' },
                  { name: 'Super 10 Nano Edition', sales: 185, revenue: '4.5k €', trend: '+5%', color: 'emerald' },
                  { name: 'PhytoDefense Shield', sales: 124, revenue: '5.4k €', trend: '+18%', color: 'orange' },
                ].map((product, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 hover:border-[#D4AF37]/50 transition-all group overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 w-1 bg-[#D4AF37] translate-x-[-100%] group-hover:translate-x-0 transition-transform" />
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-[#D4AF37] text-base shadow-inner">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-lg font-black text-white uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">{product.name}</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{product.sales} vecteurs d'acquisition</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white">{product.revenue}</p>
                      <div className="flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase tracking-widest justify-end">
                        <TrendingUp className="w-3 h-3" /> {product.trend}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Leads Matrix Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-2xl flex items-center justify-center border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <Users className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Signal Prospects</h2>
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Flux de données en temps réel</p>
              </div>
            </div>

            <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
              <button 
                onClick={() => setViewMode('compact')}
                className={cn(
                  "p-3 rounded-xl transition-all",
                  viewMode === 'compact' ? "bg-[#D4AF37] text-black shadow-lg" : "text-white/40 hover:text-white/70"
                )}
                title="Vue Compacte"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('detailed')}
                className={cn(
                  "p-3 rounded-xl transition-all",
                  viewMode === 'detailed' ? "bg-[#D4AF37] text-black shadow-lg" : "text-white/40 hover:text-white/70"
                )}
                title="Vue Détaillée"
              >
                <Rows className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-4 shadow-2xl flex flex-wrap gap-4 items-center">
            <div className="flex flex-col space-y-2 flex-1 min-w-[160px]">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">État du Signal</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest text-white focus:border-[#D4AF37] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="all" className="bg-[#050b18]">Toutes Séquences</option>
                <option value="new" className="bg-[#050b18]">Signaux Nouveaux</option>
                <option value="contacted" className="bg-[#050b18]">Interrogés</option>
                <option value="converted" className="bg-[#050b18]">Synchronisés (Ventes)</option>
              </select>
            </div>
            <div className="flex flex-col space-y-2 flex-1 min-w-[160px]">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Vecteur d'Intérêt</label>
              <select 
                value={intentFilter}
                onChange={(e) => setIntentFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest text-white focus:border-[#D4AF37] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="all" className="bg-[#050b18]">Tous Spectres</option>
                <option value="health" className="bg-[#050b18]">Bio-Hacking (Santé)</option>
                <option value="income" className="bg-[#050b18]">Capital (Revenus)</option>
                <option value="agriculture" className="bg-[#050b18]">Écosystème (Agri)</option>
                <option value="products" className="bg-[#050b18]">Matière (Produits)</option>
              </select>
            </div>
            <div className="flex flex-col space-y-2 flex-1 min-w-[160px]">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] flex items-center gap-2">
                <Settings2 className="w-3 h-3" />
                Matrice Géographique
              </label>
              <select 
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest text-white focus:border-[#D4AF37] focus:outline-none appearance-none cursor-pointer hover:bg-white/10 transition-colors"
              >
                <option value="all" className="bg-[#050b18]">Tous Territoires</option>
                {countries.map(country => (
                  <option key={country} value={country!} className="bg-[#050b18]">{country}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden relative">
            <div className="max-h-[800px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="py-32 flex flex-col items-center gap-6">
                  <RefreshCw className="w-12 h-12 text-[#D4AF37] animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Initialité de la Matrice...</p>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="py-32 flex flex-col items-center gap-6 opacity-20">
                  <Zap className="w-16 h-16 text-[#D4AF37]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Aucune Trace Détectée</p>
                </div>
              ) : (
                <div className={cn(
                  "p-8",
                  viewMode === 'compact' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" : "space-y-4"
                )}>
                  {filteredLeads.map((lead, i) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedLead(lead)}
                      className={cn(
                        "group relative cursor-pointer transition-all duration-500",
                        viewMode === 'compact' 
                          ? "bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 hover:border-[#D4AF37]/50" 
                          : "bg-white/5 border border-white/10 p-6 rounded-[2.5rem] hover:bg-white/10 flex items-center justify-between gap-6 border-l-4",
                        viewMode === 'detailed' && (
                          lead.intent === 'health' ? "border-l-blue-500" :
                          lead.intent === 'income' ? "border-l-indigo-500" :
                          lead.intent === 'agriculture' ? "border-l-emerald-500" :
                          "border-l-[#D4AF37]"
                        )
                      )}
                    >
                      {viewMode === 'compact' ? (
                        <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-lg transition-transform group-hover:rotate-12",
                            lead.intent === 'health' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                            lead.intent === 'income' ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" :
                            lead.intent === 'agriculture' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                            "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                          )}>
                            {lead.intent.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block">Confiance</span>
                            <span className="text-[10px] font-black text-[#D4AF37]">{Math.floor(Math.random() * 20) + 80}%</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-white font-black uppercase tracking-tight truncate group-hover:text-[#D4AF37] transition-colors">{lead.name || 'Signat. Inconnu'}</h4>
                          <div className="flex items-center gap-2 mt-2">
                             <div className="flex gap-0.5">
                               {[1,2,3].map(i => (
                                 <div key={i} className="w-2 h-0.5 bg-emerald-500 rounded-full" />
                               ))}
                             </div>
                             {lead.country && (
                               <span className="text-[7px] font-black text-[#D4AF37] uppercase bg-white/5 px-2 py-0.5 rounded-full border border-white/10">{lead.country}</span>
                             )}
                          </div>
                        </div>
                          <div className={cn(
                            "w-full h-1 rounded-full bg-white/5 overflow-hidden",
                          )}>
                             <div className={cn(
                               "h-full transition-all duration-1000",
                               lead.status === 'new' ? "w-1/3 bg-blue-500 shadow-[0_0_8px_#3b82f6]" :
                               lead.status === 'contacted' ? "w-2/3 bg-orange-500 shadow-[0_0_8px_#f97316]" :
                               "w-full bg-emerald-500 shadow-[0_0_8px_#10b981]"
                             )} />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-6 flex-1 min-w-0">
                            <div className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black transition-all group-hover:scale-110 shadow-inner",
                              lead.intent === 'health' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                              lead.intent === 'income' ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" :
                              lead.intent === 'agriculture' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                              "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                            )}>
                              <MessageCircle className="w-6 h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-lg font-black text-white hover:text-[#D4AF37] transition-colors truncate">{lead.name || 'Signature Anonyme'}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black px-2 py-0.5 bg-white/5 rounded-full text-white/30 tracking-widest border border-white/10 uppercase">
                                    {lead.intent}
                                  </span>
                                  {lead.country && (
                                    <span className="text-[8px] font-black px-2 py-0.5 bg-blue-500/10 rounded-full text-blue-400 tracking-widest border border-blue-500/20 uppercase flex items-center gap-1">
                                      <Globe className="w-2 h-2" />
                                      {lead.country}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 italic truncate leading-none">“{lead.message}”</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-10">
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Fréquence Temporelle</p>
                              <div className="flex items-center gap-2 text-xs font-bold text-white/50">
                                <Clock className="w-3 h-3 text-[#D4AF37]" />
                                {format(new Date(lead.createdAt.valueOf?.() || lead.createdAt), 'dd MMM, HH:mm')}
                              </div>
                            </div>
                            
                            <div className={cn(
                              "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-2xl",
                              lead.status === 'new' ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                              lead.status === 'contacted' ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30" :
                              "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            )}>
                              {lead.status === 'new' ? 'Signal Brut' : lead.status === 'contacted' ? 'Interrogation' : 'Unité Acquise'}
                            </div>
                            
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#D4AF37] transition-colors">
                              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Lead Details Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    selectedLead.intent === 'health' ? "bg-blue-100 text-blue-600" :
                    selectedLead.intent === 'income' ? "bg-indigo-100 text-indigo-600" :
                    selectedLead.intent === 'agriculture' ? "bg-green-100 text-green-600" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Détails du Prospect</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Reçu le {format(new Date(selectedLead.createdAt.valueOf?.() || selectedLead.createdAt), 'PPPP à p')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message Initial</h3>
                        <button 
                          onClick={() => speak(selectedLead.message)}
                          className="p-1 px-2 flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all text-[9px] font-black uppercase tracking-widest"
                          title="Écouter le message"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Écouter</span>
                        </button>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-700 leading-relaxed font-medium italic">
                        "{selectedLead.message}"
                      </div>
                    </section>

                    <section>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Informations de contact</h3>
                      <div className="space-y-2">
                        {selectedLead.name && (
                          <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                            <span className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">Nom</span>
                            <span className="text-slate-900 font-black uppercase">{selectedLead.name}</span>
                          </div>
                        )}
                        {selectedLead.whatsapp && (
                          <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                            <span className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">WhatsApp</span>
                            <a href={`https://wa.me/${selectedLead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-600 font-black hover:underline">{selectedLead.whatsapp}</a>
                          </div>
                        )}
                         <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                            <span className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">Intention</span>
                            <span className="text-slate-900 font-black uppercase">{selectedLead.intent}</span>
                          </div>
                      </div>
                    </section>
                  </div>

                  <form onSubmit={handleUpdateLead} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut du prospect</label>
                      <select 
                        value={selectedLead.status}
                        onChange={(e) => setSelectedLead({...selectedLead, status: e.target.value as any})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-blue-600 focus:outline-none appearance-none"
                      >
                        <option value="new">Nouveau</option>
                        <option value="contacted">Contacté</option>
                        <option value="converted">Converti</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes de suivi</label>
                      <textarea 
                        rows={5}
                        placeholder="Ajoutez vos notes ici (ex: Rappelé le 25/04, intéressé par le Pro Vitality...)"
                        value={selectedLead.notes || ''}
                        onChange={(e) => setSelectedLead({...selectedLead, notes: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-blue-600 focus:outline-none transition-colors"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isSavingLead}
                      className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {isSavingLead ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>{isSavingLead ? 'Enregistrement...' : 'Mettre à jour'}</span>
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        </div>

        {/* Matrix Intelligence & Intel Feed */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-slate-900 to-black rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5 group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-6 shadow-inner">
                <Rocket className="w-6 h-6 text-blue-400 group-hover:bounce" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-3">Expansion Tactique</h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-8 leading-relaxed">
                Le SmartLink détecte une forte activité sur <span className="text-[#D4AF37]">LinkedIn</span>. Optimisez votre vecteur d'entrée pour les profils type "Leader Indépendant".
              </p>
              <button className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-[#D4AF37] transition-all flex items-center justify-center gap-2">
                Déployer Stratégie <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Flux Événements</h3>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
            </div>
            
            <div className="space-y-6">
              {[
                { day: '28', month: 'MAI', title: "IA & BioHacking Matrix", desc: "Transmission en direct", type: 'LIVE' },
                { day: '02', month: 'JUIN', title: "Sommet des Bâtisseurs", desc: "Rassemblement Séquence Élite", type: 'VIP' }
              ].map((evt, i) => (
                <div key={i} className="flex items-center gap-5 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">{evt.month}</span>
                    <span className="text-xl font-black text-[#D4AF37] leading-none">{evt.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-tight truncate mb-1">{evt.title}</h4>
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{evt.desc}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[7px] font-black tracking-widest border",
                    evt.type === 'LIVE' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20"
                  )}>
                    {evt.type}
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-8 py-3 bg-white/5 border border-white/10 text-white/40 rounded-xl font-black uppercase tracking-widest text-[8px] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all">
              Accéder au Flux Complet
            </button>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-900/40 to-transparent border border-indigo-500/20 relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white uppercase tracking-tight">Réseau Networker</p>
                <div className="flex -space-x-2 mt-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-[#050b18] bg-slate-800" />
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-[#050b18] bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">+12</div>
                </div>
              </div>
            </div>
            <p className="text-[9px] font-black text-indigo-300/60 uppercase tracking-widest leading-relaxed">
              12 nouveaux membres ont rejoint votre réseau via le SmartLink ce mois-ci.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
