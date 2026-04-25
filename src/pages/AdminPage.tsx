import React from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { User, Lead, Product } from '../types';
import { Users, Send, ShoppingBag, Trash2, Shield, Search, Filter, Plus, X, ExternalLink, Share2, Check, CreditCard, Star, Download, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export default function AdminPage() {
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [promos, setPromos] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<'users' | 'leads' | 'products' | 'promos'>('users');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [countryFilter, setCountryFilter] = React.useState<string>('all');
  const [showAddProduct, setShowAddProduct] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const [newProduct, setNewProduct] = React.useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    category: 'health',
    countries: [],
    shopUrl: '',
    imageUrl: ''
  });

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    
    const unsub = onSnapshot(doc(db, 'admins', user.uid), (snap) => {
      setIsAdmin(snap.exists());
    }, (error) => {
      console.error("Admin check failed:", error);
      setIsAdmin(false);
    });

    return () => unsub();
  }, [user, loading, navigate]);

  React.useEffect(() => {
    if (!isAdmin) return;

    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const unsubLeads = onSnapshot(query(collection(db, 'leads'), orderBy('createdAt', 'desc')), (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });

    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('name', 'asc')), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    const unsubPromos = onSnapshot(query(collection(db, 'promos'), orderBy('code', 'asc')), (snap) => {
      setPromos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'promos');
    });

    return () => {
      unsubUsers();
      unsubLeads();
      unsubProducts();
      unsubPromos();
    };
  }, [isAdmin]);

  const handleDeleteLead = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce prospect ?')) {
      await deleteDoc(doc(db, 'leads', id));
    }
  };

  const toggleSubscription = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'expired' : 'active';
    const endDate = newStatus === 'active' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
      : new Date().toISOString();
    
    await updateDoc(doc(db, 'users', id), { 
      subscriptionStatus: newStatus,
      subscriptionEndDate: endDate
    });
  };

  const toggleAmbassador = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'users', id), { 
        isAmbassador: !current,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error toggling ambassador status:", error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        createdAt: new Date().toISOString()
      });
      setShowAddProduct(false);
      setNewProduct({
        name: '',
        description: '',
        category: 'health',
        countries: [],
        shopUrl: '',
        imageUrl: ''
      });
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Erreur lors de l'ajout du produit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Supprimer ce produit définitivement ?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const handleShareProduct = (id: string) => {
    const link = `${window.location.origin}/catalog?product=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportData = (type: 'users' | 'leads') => {
    const dataSource = type === 'users' ? users : leads;
    if (dataSource.length === 0) return;

    const headers = Object.keys(dataSource[0]);
    const csvContent = [
      headers.join(','),
      ...dataSource.map(item => headers.map(header => {
        const val = (item as any)[header];
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gmbc_os_${type}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [announcement, setAnnouncement] = React.useState({ title: '', message: '', type: 'info' as 'info' | 'warining' | 'success' });

  const sendAnnouncement = async () => {
    if (!announcement.title || !announcement.message) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        ...announcement,
        createdAt: serverTimestamp(),
        active: true
      });
      setAnnouncement({ title: '', message: '', type: 'info' });
      alert('Annonce envoyée à tous les distributeurs !');
    } catch (error) {
      console.error(error);
    }
  };

  const stats = {
    totalUsers: users.length,
    activeSubs: users.filter(u => u.subscriptionStatus === 'active').length,
    totalLeads: leads.length,
    ambassadors: users.filter(u => u.isAmbassador).length,
    conversionRate: leads.length > 0 ? ((leads.filter(l => l.status === 'qualified').length / leads.length) * 100).toFixed(1) : 0,
    growth: users.filter(u => {
      const createdDate = new Date(u.createdAt as any);
      const now = new Date();
      return createdDate > new Date(now.setDate(now.getDate() - 7));
    }).length
  };

  const filteredData = () => {
    const term = searchTerm.toLowerCase();
    if (activeTab === 'users') {
      return users.filter(u => 
        u.displayName.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term)
      );
    } else if (activeTab === 'leads') {
      return leads.filter(l => 
        l.intent.toLowerCase().includes(term) || 
        l.message.toLowerCase().includes(term)
      );
    } else {
      return products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(term) || 
                             p.description.toLowerCase().includes(term) ||
                             p.category.toLowerCase().includes(term);
        const matchesCountry = countryFilter === 'all' || (p.countries && p.countries.includes(countryFilter));
        return matchesSearch && matchesCountry;
      });
    }
  };

  const allCountries = Array.from(new Set(products.flatMap(p => p.countries || []))).sort();

  const data = filteredData();

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Vérification des accès maître...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 text-center">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-100">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-4">Accès Refusé</h1>
          <p className="text-slate-500 font-medium mb-8">Vous n'avez pas les autorisations nécessaires pour accéder au centre de contrôle GMBC-OS.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all shadow-xl active:scale-95"
          >
            Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-4">Administration</h1>
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Centre de Contrôle Maître • GMBC-OS</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Utilisateurs" />
          <TabButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} icon={Send} label="Prospects" />
          <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={ShoppingBag} label="Produits" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        <StatCard label="Total Utilisateurs" value={stats.totalUsers} icon={Users} color="blue" />
        <StatCard label="Abonnements Actifs" value={stats.activeSubs} icon={CreditCard} color="emerald" />
        <StatCard label="Leads Générés" value={stats.totalLeads} icon={TrendingUp} color="orange" />
        <StatCard label="Taux de Conversion" value={`${stats.conversionRate}%`} icon={Star} color="indigo" />
        <StatCard label="Ambassadeurs" value={stats.ambassadors} icon={Shield} color="slate" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder={`Rechercher ${activeTab === 'users' ? 'utilisateurs' : activeTab === 'leads' ? 'prospects' : 'produits'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-slate-100 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:border-emerald-500 focus:outline-none transition-colors shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-4">
          {(activeTab === 'users' || activeTab === 'leads') && (
            <button 
              onClick={() => exportData(activeTab)}
              className="flex items-center space-x-2 px-6 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Exporter CSV</span>
            </button>
          )}

          {activeTab === 'products' && (
            <>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:border-emerald-500 focus:outline-none transition-colors shadow-sm appearance-none min-w-[160px]"
                >
                  <option value="all">Tous les pays</option>
                  {allCountries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => setShowAddProduct(true)}
                className="flex items-center space-x-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un produit</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 mb-12">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Annonce Globale</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diffuser une mise à jour à tous les distributeurs</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Titre de l'alerte</label>
              <input 
                value={announcement.title}
                onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                placeholder="Ex: Nouvelle mise à jour GMBC-OS"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type de notification</label>
              <select 
                value={announcement.type}
                onChange={(e) => setAnnouncement({...announcement, type: e.target.value as any})}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 focus:outline-none transition-colors appearance-none"
              >
                <option value="info">Information (Bleu)</option>
                <option value="success">Succès (Vert)</option>
                <option value="warning">Alerte (Orange)</option>
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message détaillé</label>
              <textarea 
                value={announcement.message}
                onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
                placeholder="Expliquez les détails de l'annonce..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 focus:outline-none transition-colors h-[120px] resize-none"
              />
            </div>
            <button 
              onClick={sendAnnouncement}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl active:scale-95"
            >
              Diffuser l'annonce
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6">Utilisateur</th>
                  <th className="px-8 py-6">Rôle</th>
                  <th className="px-8 py-6">SmartLink 24/7</th>
                  <th className="px-8 py-6">Ambassadeur</th>
                  <th className="px-8 py-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data as User[]).map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-10 h-10 rounded-xl grayscale" alt="" />
                          {u.isAmbassador && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                              <Star className="w-2.5 h-2.5 text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{u.displayName}</p>
                            {u.isAmbassador && (
                              <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[7px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-1 border border-white/20">
                                <Star className="w-2 h-2 fill-white text-white" /> PARTENAIRE ÉLITE
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                        u.role === 'admin' ? "bg-red-100 text-red-600" :
                        u.role === 'distributor' ? "bg-emerald-100 text-emerald-600" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col space-y-1">
                        <button 
                          onClick={() => toggleSubscription(u.id, u.subscriptionStatus || 'expired')}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all text-center",
                            u.subscriptionStatus === 'active' ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                          )}
                        >
                          {u.subscriptionStatus === 'active' ? "ACTIF" : "EXPIRÉ"}
                        </button>
                        {u.subscriptionEndDate && (
                          <span className="text-[8px] text-slate-400 font-bold text-center">
                            jusqu'au {format(new Date(u.subscriptionEndDate), 'dd/MM/yy')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                         onClick={() => toggleAmbassador(u.id, u.isAmbassador || false)}
                         className={cn(
                           "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm",
                           u.isAmbassador 
                             ? "bg-indigo-600 text-white hover:bg-indigo-700 ring-4 ring-indigo-50" 
                             : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                         )}
                      >
                        {u.isAmbassador ? "✓ AMBASSADEUR ACTIF" : "PROMOUVOIR"}
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2">
                        {u.role === 'user' && (
                          <button 
                            onClick={() => updateDoc(doc(db, 'users', u.id), { role: 'distributor' })}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                            title="Devenir Distributeur"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteDoc(doc(db, 'users', u.id))}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6">Intention</th>
                  <th className="px-8 py-6">Message</th>
                  <th className="px-8 py-6">Distributeur</th>
                  <th className="px-8 py-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data as Lead[]).map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-500" />
                         <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{l.intent}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-500 truncate max-w-xs italic">“{l.message}”</p>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-tight">
                      ID: {l.distributorId.slice(0, 8)}
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => handleDeleteLead(l.id)}
                        className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6">Produit</th>
                  <th className="px-8 py-6">Pays</th>
                  <th className="px-8 py-6">Catégorie</th>
                  <th className="px-8 py-6">Boutique</th>
                  <th className="px-8 py-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data as Product[]).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                       <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucun produit trouvé</p>
                    </td>
                  </tr>
                ) : (data as Product[]).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{p.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 truncate max-w-[200px]">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1">
                        {p.countries?.map(c => (
                          <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-bold uppercase">
                            {c}
                          </span>
                        )) || <span className="text-slate-300 text-[8px] font-bold">Mondial</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <a 
                        href={p.shopUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 transition-colors flex items-center space-x-1"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest">Voir</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleShareProduct(p.id)}
                          title="Partager le lien du produit"
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 shadow-sm",
                            copiedId === p.id ? "bg-emerald-100 text-emerald-600" : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                          )}
                        >
                          {copiedId === p.id ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'promos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6">Code</th>
                  <th className="px-8 py-6">Valeur</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {promos.map(p => (
                  <tr key={p.id}>
                    <td className="px-8 py-6 font-black text-slate-900">{p.code}</td>
                    <td className="px-8 py-6 text-sm font-bold">{p.value}{p.discountType === 'percentage' ? '%' : '$'}</td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                        p.isActive ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                      )}>
                        {p.isActive ? 'ACTIF' : 'INACTIF'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                       <button 
                        onClick={() => updateDoc(doc(db, 'promos', p.id), { isActive: !p.isActive })}
                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all"
                       >
                         <Shield className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))}
                {promos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-10 text-center text-slate-400 font-bold uppercase text-[10px]">
                      Aucun code promo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Nouveau Produit</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Catalog Management</p>
              </div>
              <button 
                onClick={() => setShowAddProduct(false)}
                className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom du produit</label>
                  <input 
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catégorie</label>
                  <select 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value as any})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-emerald-500 focus:outline-none appearance-none"
                  >
                    <option value="health">Santé</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="income">Revenus</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                <textarea 
                  required
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pays disponibles (séparés par des virgules)</label>
                <input 
                  placeholder="Bénin, Togo, France..."
                  value={newProduct.countries.join(', ')}
                  onChange={(e) => setNewProduct({...newProduct, countries: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shop URL</label>
                  <input 
                    required
                    value={newProduct.shopUrl}
                    onChange={(e) => setNewProduct({...newProduct, shopUrl: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Image URL</label>
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {newProduct.imageUrl ? (
                        <img src={newProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-slate-200" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input 
                        placeholder="https://shopneolife.com/images/product.jpg"
                        value={newProduct.imageUrl}
                        onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">Astuce: Copiez l'adresse de l'image sur ShopNeoLife.com</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'Publication...' : 'Publier le Produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={className(
        "flex items-center space-x-2 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <div className={className("p-6 rounded-[2rem] border-2 shadow-sm transition-transform hover:scale-[1.02]", colors[color])}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 opacity-50" />
        <span className="text-2xl font-black tracking-tighter">{value}</span>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none">{label}</p>
    </div>
  );
}

function className(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
