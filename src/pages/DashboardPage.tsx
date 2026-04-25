import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
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
  LineChart
} from 'lucide-react';
import { Lead, User } from '../types';
import { format } from 'date-fns';
import { appendLeadToSheet } from '../services/sheetsService';
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
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [isSavingLead, setIsSavingLead] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;

    // Fetch user profile
    const fetchUser = async () => {
      try {
        const q = query(collection(db, 'users'), where('id', '==', user.uid));
        const docs = await getDocs(q);
        if (!docs.empty) {
          setUserData(docs.docs[0].data() as User);
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

  const filteredLeads = leads
    .filter(lead => statusFilter === 'all' || lead.status === statusFilter)
    .filter(lead => intentFilter === 'all' || lead.intent === intentFilter)
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Bienvenue, {user.displayName}</h1>
          <p className="text-slate-600">Suivez vos prospects NeoLife et vos performances commerciales.</p>
          
          {syncStatus && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={cn(
                "mt-4 p-3 rounded-xl text-xs font-bold",
                syncStatus.type === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}
            >
              {syncStatus.message}
            </motion.div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
          <button
            onClick={handleSyncToSheets}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
            title="Synchroniser avec le Google Sheet de Neolife"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span className="text-xs font-bold whitespace-nowrap">Sync Neolife</span>
          </button>
          <div className="flex-1 px-4 py-2 bg-slate-50 rounded-xl text-xs font-mono text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
            {referralLink}
          </div>
          <button
            onClick={copyToClipboard}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
          <a
            href={`https://wa.me/?text=Découvrez ce coach de santé IA : ${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noreferrer"
            className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-100"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm font-medium text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* SmartLink Performance Section */}
      <section className="mb-12">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Performance SmartLink 24/7
              </h2>
              <p className="text-sm font-medium text-slate-500">Statistiques en temps réel de votre lien MLM intelligent.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                Clics
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">
                <div className="w-2 h-2 rounded-full bg-indigo-600" />
                Prospects
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                Ventes
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '10px',
                      fontWeight: '800',
                      textTransform: 'uppercase'
                    }}
                  />
                  <Bar dataKey="clics" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="leads" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="conversions" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 transform transition-transform hover:scale-[1.02]">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Taux de conversion</div>
                <div className="text-2xl font-black text-slate-900">8.4%</div>
                <div className="text-[10px] font-bold text-blue-500 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> +2.1% cette semaine
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 transform transition-transform hover:scale-[1.02]">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Coût par Lead (CPL)</div>
                <div className="text-2xl font-black text-slate-900">0.00 FCFA</div>
                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Généré 100% organiquement</div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 transform transition-transform hover:scale-[1.02]">
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Paiements Acceptés</div>
                <div className="flex gap-2 mt-2">
                  <div className="w-6 h-6 bg-white rounded-md border border-emerald-100 flex items-center justify-center text-[7px] font-bold text-emerald-600">MoMo</div>
                  <div className="w-6 h-6 bg-white rounded-md border border-emerald-100 flex items-center justify-center text-[7px] font-bold text-emerald-600">VISA</div>
                  <div className="w-6 h-6 bg-white rounded-md border border-emerald-100 flex items-center justify-center text-[7px] font-bold text-emerald-600">MC</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sales Statistics Section */}
      <section className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200">
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-400 border border-white/10">30 Derniers Jours</span>
              </div>
              <div className="space-y-1 mb-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total des ventes</p>
                <h3 className="text-4xl font-black tracking-tighter">2,450,000 <span className="text-sm font-bold text-slate-500 uppercase">FCFA</span></h3>
              </div>
              <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Panier Moyen</p>
                  <p className="text-xl font-bold tracking-tight">35,000 <span className="text-[10px] font-medium text-slate-500">FCFA</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Commandes</p>
                  <p className="text-xl font-bold tracking-tight text-blue-400">70</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Top Produits Récents</h3>
                  <p className="text-xs font-medium text-slate-500">Vos meilleures ventes via le SmartLink.</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                  <Check className="w-5 h-5 text-slate-400" />
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { name: 'Pro Vitality Pack', sales: 24, revenue: '840,000 FCFA', trend: '+12%' },
                  { name: 'Super 10 Fragrance Free', sales: 18, revenue: '450,000 FCFA', trend: '+5%' },
                  { name: 'PhytoDefense', sales: 12, revenue: '540,000 FCFA', trend: '+8%' },
                  { name: 'Tre-en-en Grain Concentrates', sales: 10, revenue: '350,000 FCFA', trend: '+15%' },
                ].map((product, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-transparent group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-blue-600 text-xs">
                        #{i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{product.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{product.sales} unités vendues</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{product.revenue}</p>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{product.trend}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Leads Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
            <div className="flex flex-col space-y-1.5 flex-1 min-w-[140px]">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="all">Tous les statuts</option>
                <option value="new">Nouveau</option>
                <option value="contacted">Contacté</option>
                <option value="converted">Converti</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1.5 flex-1 min-w-[140px]">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intention</label>
              <select 
                value={intentFilter}
                onChange={(e) => setIntentFilter(e.target.value)}
                className="bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="all">Toutes les intentions</option>
                <option value="health">Santé</option>
                <option value="income">Revenus</option>
                <option value="agriculture">Agriculture</option>
                <option value="products">Produits</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1.5 flex-1 min-w-[140px]">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tri par date</label>
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="desc">Plus récent</option>
                <option value="asc">Plus ancien</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Prospects {filteredLeads.length < leads.length ? 'Filtrés' : 'Récents'}</h2>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {filteredLeads.length} résultats
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Source/Intention</th>
                    <th className="px-6 py-4">Message</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Chargement des prospects...</td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Aucun prospect ne correspond à vos filtres.</td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr 
                        key={lead.id} 
                        onClick={() => setSelectedLead(lead)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase transition-transform group-hover:scale-110",
                            lead.intent === 'health' ? "bg-blue-100 text-blue-600" :
                            lead.intent === 'income' ? "bg-indigo-100 text-indigo-600" :
                            lead.intent === 'agriculture' ? "bg-green-100 text-green-600" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {lead.intent.charAt(0)}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-900 capitalize block">{lead.intent}</span>
                            {lead.name && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{lead.name}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 max-w-xs truncate">{lead.message}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {lead.createdAt ? format(new Date(lead.createdAt.valueOf?.() || lead.createdAt), 'MMM d, p') : 'Pending'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          lead.status === 'new' ? "bg-blue-50 text-blue-600" :
                          lead.status === 'contacted' ? "bg-yellow-50 text-yellow-600" :
                          "bg-green-50 text-green-600"
                        )}>
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Message Initial</h3>
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

        {/* System Notifications/Tips */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Boostez vos ventes</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Essayez de partager votre lien de parrainage sur des groupes LinkedIn axés sur le "Bien-être" ou les "Propriétaires d'entreprises indépendantes".
              </p>
              <button className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors">
                Lire le guide stratégique
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Webinaire à venir
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-slate-400">AVR</span>
                  <span className="font-bold text-slate-900 leading-none">28</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Tirer parti de l'IA dans le MLM</h4>
                  <p className="text-xs text-slate-500">En direct avec l'équipe NeoDigital</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
