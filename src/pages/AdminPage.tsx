import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { User, Lead, Product } from '../types';
import { Users, Send, ShoppingBag, Trash2, Shield, Search, Filter, Plus, X, ExternalLink, Share2, Check, CreditCard, Star, Download, TrendingUp, AlertCircle, Loader2, Upload, Edit, Globe, Volume2, Activity, UserCircle, Sparkles, Brain } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { speak } from '../lib/tts';
import { generateAnnouncement } from '../services/geminiService';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export default function AdminPage() {
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [promos, setPromos] = React.useState<any[]>([]);
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<'users' | 'leads' | 'products' | 'promos' | 'announcements'>('users');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [countryFilter, setCountryFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [showAddProduct, setShowAddProduct] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [isSavingNotes, setIsSavingNotes] = React.useState(false);
  const [leadNotes, setLeadNotes] = React.useState('');
  const [leadStatus, setLeadStatus] = React.useState<Lead['status']>('new');

  const [newProduct, setNewProduct] = React.useState<Omit<Product, 'id' | 'createdAt'>>({
    name: '',
    description: '',
    category: 'health',
    countries: [],
    shopUrl: '',
    imageUrl: '',
    testimonials: []
  });

  const [newTestimonial, setNewTestimonial] = React.useState({ author: '', text: '', rating: 5 });
  const [editingTestimonialId, setEditingTestimonialId] = React.useState<string | null>(null);

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

    const unsubAnnouncements = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'announcements');
    });

    return () => {
      unsubUsers();
      unsubLeads();
      unsubProducts();
      unsubPromos();
      unsubAnnouncements();
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
      if (!newProduct.imageUrl) {
        alert("Veuillez télécharger une image ou fournir une URL.");
        setIsSubmitting(false);
        return;
      }

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...newProduct,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...newProduct,
          createdAt: new Date().toISOString()
        });
      }
      setShowAddProduct(false);
      setEditingProduct(null);
      setEditingTestimonialId(null);
      setNewTestimonial({ author: '', text: '', rating: 5 });
      setNewProduct({
        name: '',
        description: '',
        category: 'health',
        countries: [],
        shopUrl: '',
        imageUrl: '',
        testimonials: []
      });
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Erreur lors de l'enregistrement du produit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      category: product.category,
      countries: product.countries || [],
      shopUrl: product.shopUrl,
      imageUrl: product.imageUrl || '',
      testimonials: product.testimonials || []
    });
    setShowAddProduct(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload error:", error);
        alert("Erreur lors du téléchargement de l'image.");
        setUploadProgress(null);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setNewProduct(prev => ({ ...prev, imageUrl: downloadURL }));
        setUploadProgress(null);
      }
    );
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Supprimer ce produit définitivement ?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (confirm(`ALERTE DE SUPPRESSION\n\nSouhaitez-vous vraiment effacer définitivement l'annonce :\n"${title}" ?\n\nCette action est irréversible et l'annonce sera immédiatement retirée du flux d'actualité de tous les utilisateurs.`)) {
      try {
        await deleteDoc(doc(db, 'announcements', id));
      } catch (error) {
        console.error("Error deleting announcement:", error);
        handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
      }
    }
  };

  const handleShareProduct = (id: string) => {
    const link = `${window.location.origin}/catalog?product=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadNotes(lead.notes || '');
    setLeadStatus(lead.status || 'new');
  };

  const handleSaveLead = async () => {
    if (!selectedLead) return;
    setIsSavingNotes(true);
    try {
      await updateDoc(doc(db, 'leads', selectedLead.id), {
        notes: leadNotes,
        status: leadStatus,
        updatedAt: serverTimestamp()
      });
      setSelectedLead({ ...selectedLead, notes: leadNotes, status: leadStatus });
      alert('Informations du prospect mises à jour.');
    } catch (error) {
      console.error("Error saving lead:", error);
      handleFirestoreError(error, OperationType.UPDATE, `leads/${selectedLead.id}`);
    } finally {
      setIsSavingNotes(false);
    }
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

  const [announcement, setAnnouncement] = React.useState({ title: '', message: '', type: 'info' as 'info' | 'warning' | 'success' });
  const [aiTopic, setAiTopic] = React.useState('');
  const [isGeneratingAi, setIsGeneratingAi] = React.useState(false);
  const [showAiTopicModal, setShowAiTopicModal] = React.useState(false);

  const handleGenerateAiAnnouncement = async () => {
    if (!aiTopic) return;
    setIsGeneratingAi(true);
    try {
      const result = await generateAnnouncement(aiTopic);
      setAnnouncement({
        ...announcement,
        title: result.title,
        message: result.message
      });
      setShowAiTopicModal(false);
      setAiTopic('');
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la génération IA");
    } finally {
      setIsGeneratingAi(false);
    }
  };

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
        (u.displayName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)) &&
        (countryFilter === 'all' || u.country === countryFilter)
      );
    } else if (activeTab === 'leads') {
      return leads.filter(l => 
        ((l.name || '').toLowerCase().includes(term) || 
         (l.email || '').toLowerCase().includes(term) || 
         l.message.toLowerCase().includes(term) || 
         l.intent.toLowerCase().includes(term)) &&
        (countryFilter === 'all' || l.country === countryFilter)
      );
    } else {
      return products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(term) || 
                             p.description.toLowerCase().includes(term);
        const matchesCountry = countryFilter === 'all' || (p.countries && p.countries.includes(countryFilter));
        const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
        return matchesSearch && matchesCountry && matchesCategory;
      });
    }
  };

  const allCountries = React.useMemo(() => {
    if (activeTab === 'products') {
      return Array.from(new Set(products.flatMap(p => p.countries || []))).sort() as string[];
    } else if (activeTab === 'leads') {
      return Array.from(new Set(leads.map(l => l.country).filter(Boolean))).sort() as string[];
    } else {
      return Array.from(new Set(users.map(u => u.country).filter(Boolean))).sort() as string[];
    }
  }, [activeTab, products, leads, users]);

  const allCategories = Array.from(new Set(products.map(p => p.category))).sort() as string[];

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
    <div className="min-h-screen bg-[#050b18] text-slate-300 selection:bg-[#D4AF37] selection:text-black">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-10 bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-[2rem] flex items-center justify-center border border-[#D4AF37]/30">
                <Activity className="w-8 h-8 text-[#D4AF37] animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#050b18] animate-ping" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none group inline-block">
                Contrôle <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#D4AF37] to-white bg-[length:200%_auto] animate-gradient-x">Omega</span>
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full">
                  <p className="text-[#D4AF37] font-black uppercase tracking-[0.3em] text-[8px] drop-shadow-[0_0_10px_#D4AF37]">v2.030 Alpha Commander</p>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/80">Flux Temps Réel Connecté</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-[2rem] border border-white/10 shadow-2xl">
              <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Utilisateurs" />
              <TabButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} icon={Send} label="Prospects" />
              <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={ShoppingBag} label="Produits" />
              <TabButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={AlertCircle} label="Annonces" />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
          <StatCard label="Total Utilisateurs" value={stats.totalUsers} icon={Users} color="blue" />
          <StatCard label="Abonnements Actifs" value={stats.activeSubs} icon={CreditCard} color="emerald" />
          <StatCard label="Leads Générés" value={stats.totalLeads} icon={TrendingUp} color="orange" />
          <StatCard label="Taux de Conversion" value={`${stats.conversionRate}%`} icon={Star} color="indigo" />
          <StatCard label="Ambassadeurs" value={stats.ambassadors} icon={Shield} color="slate" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          {/* Search Bar */}
          <div className="relative w-full max-w-md group">
            <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#D4AF37] transition-colors" />
              <input 
                type="text"
                placeholder={`Rechercher ${activeTab === 'users' ? 'utilisateurs' : activeTab === 'leads' ? 'prospects' : 'produits'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-8 text-sm font-bold text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 focus:outline-none transition-all backdrop-blur-md placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {(activeTab === 'users' || activeTab === 'leads') && (
              <button 
                onClick={() => exportData(activeTab)}
                className="flex items-center space-x-3 px-8 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 hover:border-[#D4AF37]/50 transition-all active:scale-95 group"
              >
                <Download className="w-4 h-4 text-[#D4AF37] group-hover:bounce" />
                <span>Exporter Archives</span>
              </button>
            )}

            {activeTab === 'products' && (
              <button 
                onClick={() => setShowAddProduct(true)}
                className="flex items-center space-x-3 px-10 py-5 bg-[#D4AF37] text-black rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all active:scale-95 group"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                <span>Nouveau Produit</span>
              </button>
            )}
          </div>
        </div>

        {(activeTab === 'products' || activeTab === 'leads' || activeTab === 'users') && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {activeTab === 'products' && (
              <div className="relative group">
                <div className="absolute inset-0 bg-[#D4AF37]/5 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center border border-[#D4AF37]/30">
                      <Filter className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Spécification Catégorie</h3>
                      <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Filtrage de la Matrice Produit</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <FilterChip 
                      active={categoryFilter === 'all'} 
                      onClick={() => setCategoryFilter('all')} 
                      label="Tous les Secteurs" 
                    />
                    {allCategories.map((cat, i) => (
                      <motion.div
                        key={cat}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <FilterChip 
                          active={categoryFilter === cat} 
                          onClick={() => setCategoryFilter(cat)} 
                          label={cat} 
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500/5 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Segmentation Géographique</h3>
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Analyse des Hubs de Distribution</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <FilterChip 
                    active={countryFilter === 'all'} 
                    onClick={() => setCountryFilter('all')} 
                    label="Zone Globale" 
                    color="blue"
                  />
                  {allCountries.map((country, i) => (
                    <motion.div
                      key={country}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <FilterChip 
                        active={countryFilter === country} 
                        onClick={() => setCountryFilter(country)} 
                        label={country} 
                        color="blue"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="bg-white/5 backdrop-blur-2xl rounded-[3rem] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10 mb-16 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <Send className="w-64 h-64 text-[#D4AF37]" />
          </div>
            <div className="flex items-center justify-between mb-12 relative z-10">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-[#D4AF37]/20 text-[#D4AF37] rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.2)] border border-[#D4AF37]/30">
                  <Send className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Annonce Globale</h2>
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Hologramme Direct vers Distributeurs</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAiTopicModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95 group"
              >
                <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                Générer Annonce IA
              </button>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Titre de la Transmission</label>
                <input 
                  value={announcement.title}
                  onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                  placeholder="Ex: Mise à jour Système v2030.4"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm font-bold focus:border-[#D4AF37] focus:outline-none transition-all placeholder:text-white/20"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Urgence Séquentielle</label>
                <select 
                  value={announcement.type}
                  onChange={(e) => setAnnouncement({...announcement, type: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm font-bold focus:border-[#D4AF37] focus:outline-none transition-all appearance-none"
                >
                  <option value="info" className="bg-[#0f172a]">Priorité Alpha (Info)</option>
                  <option value="success" className="bg-[#0f172a]">Succès Mission (Vert)</option>
                  <option value="warning" className="bg-[#0f172a]">Alerte Système (Orange)</option>
                </select>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Matrice du Message</label>
                <textarea 
                  value={announcement.message}
                  onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
                  placeholder="Encodez votre message ici..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm font-bold focus:border-[#D4AF37] focus:outline-none transition-all h-[140px] resize-none placeholder:text-white/20"
                />
              </div>
              <button 
                onClick={sendAnnouncement}
                className="w-full py-5 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all active:scale-95 shadow-xl"
              >
                Lancer la Transmission
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden mb-24">
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/10">
                  <tr>
                    <th className="px-10 py-8">Identité</th>
                    <th className="px-10 py-8">Rôle Maître</th>
                    <th className="px-10 py-8">Nexus Link</th>
                    <th className="px-10 py-8">Rang Élite</th>
                    <th className="px-10 py-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-400">
                  {(data as User[]).map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center space-x-5">
                          <div className="relative">
                            <div className="absolute inset-0 bg-[#D4AF37]/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                            <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="relative w-14 h-14 rounded-2xl border border-white/10 grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                            {u.isAmbassador && (
                              <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#D4AF37] rounded-full flex items-center justify-center border-4 border-[#050b18] shadow-lg">
                                <Star className="w-3.5 h-3.5 text-black fill-black" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-white text-lg font-black tracking-tight group-hover:text-[#D4AF37] transition-colors">{u.displayName}</p>
                            <p className="text-xs font-bold text-white/30 uppercase tracking-widest">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          u.role === 'admin' ? "bg-red-500/10 text-red-500 border-red-500/30" :
                          u.role === 'distributor' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                          "bg-white/5 text-white/50 border-white/10"
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col space-y-2">
                          <button 
                            onClick={() => toggleSubscription(u.id, u.subscriptionStatus || 'expired')}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all text-center border",
                              u.subscriptionStatus === 'active' 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                : "bg-red-500/10 text-red-500 border-red-500/30"
                            )}
                          >
                            {u.subscriptionStatus === 'active' ? "SÉQUENCE ACTIVE" : "SIGNAL ROMPU"}
                          </button>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <button 
                           onClick={() => toggleAmbassador(u.id, u.isAmbassador || false)}
                           className={cn(
                             "px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 border",
                             u.isAmbassador 
                               ? "bg-[#D4AF37] text-black border-transparent shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
                               : "bg-white/5 text-white/30 border-white/10 hover:border-[#D4AF37]/50"
                           )}
                        >
                          {u.isAmbassador ? "✓ PARTENAIRE ÉLITE" : "PROMOUVOIR"}
                        </button>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => deleteDoc(doc(db, 'users', u.id))}
                            className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"
                          >
                            <Trash2 className="w-5 h-5" />
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
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/10">
                  <tr>
                    <th className="px-10 py-8">Identité Prospect</th>
                    <th className="px-10 py-8">Vecteur d'Intérêt</th>
                    <th className="px-10 py-8">Notes</th>
                    <th className="px-10 py-8">Trace de Message</th>
                    <th className="px-10 py-8">Status</th>
                    <th className="px-10 py-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-400">
                  {(data as Lead[]).map(l => (
                    <tr key={l.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => handleOpenLeadDetails(l)}>
                      <td className="px-10 py-8">
                        <div>
                          <p className="text-white text-base font-black uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">{l.name || 'Anonyme'}</p>
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{l.email || l.whatsapp || 'Pas de contact'}</p>
                          {l.country && <p className="text-[8px] font-black text-[#D4AF37] uppercase mt-1">{l.country}</p>}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center space-x-3">
                           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
                           <span className="text-white text-xs font-black uppercase tracking-tight">{l.intent}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <p className="text-[10px] font-medium text-white/40 line-clamp-2 max-w-[150px]">
                          {l.notes ? l.notes : <span className="italic opacity-30">Aucune note</span>}
                        </p>
                      </td>
                      <td className="px-10 py-8">
                        <p className="text-sm font-medium text-slate-500 truncate max-w-sm italic">“{l.message}”</p>
                      </td>
                      <td className="px-10 py-8">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                          l.status === 'converted' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          l.status === 'contacted' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                          "bg-white/5 text-white/30 border-white/10"
                        )}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenLeadDetails(l); }}
                            className="w-10 h-10 flex items-center justify-center bg-white/5 text-[#D4AF37] border border-white/10 rounded-xl hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteLead(l.id); }}
                            className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-lg"
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

          {activeTab === 'products' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/10">
                  <tr>
                    <th className="px-10 py-8">Matérialisation Produit</th>
                    <th className="px-10 py-8">Zones Delta</th>
                    <th className="px-10 py-8">Classification</th>
                    <th className="px-10 py-8">Actions Séquentielles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(data as Product[]).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-10 py-32 text-center">
                         <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-white/10">
                            <ShoppingBag className="w-10 h-10" />
                         </div>
                         <p className="text-white/20 font-black uppercase tracking-[0.4em] text-[10px]">Néant. Aucune entité détectée.</p>
                      </td>
                    </tr>
                  ) : (data as Product[]).map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center space-x-6">
                          <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-[#D4AF37]/50 shadow-inner group-hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="w-full h-full object-contain p-2" />
                            ) : (
                              <ShoppingBag className="w-8 h-8 text-white/10" />
                            )}
                          </div>
                          <div className="max-w-xs">
                            <p className="text-white text-xl font-black uppercase tracking-tighter mb-1 group-hover:text-[#D4AF37] transition-colors">{p.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest line-clamp-2 leading-relaxed">{p.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-wrap gap-2">
                          {p.countries?.map(c => (
                            <span key={c} className="px-3 py-1 bg-white/5 border border-white/10 text-white/50 rounded-lg text-[9px] font-black uppercase tracking-widest group-hover:border-[#D4AF37]/30 transition-colors">
                              {c}
                            </span>
                          )) || <span className="text-white/20 text-[9px] font-black uppercase tracking-widest italic">Omniprésence</span>}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="px-5 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-[0.2em]">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => handleEditProduct(p)}
                            title="Modifier l'entité"
                            className="w-12 h-12 flex items-center justify-center bg-white/5 text-white/50 border border-white/10 rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] active:scale-90"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleShareProduct(p.id)}
                            className={cn(
                              "w-12 h-12 flex items-center justify-center border rounded-2xl transition-all active:scale-90 shadow-lg",
                              copiedId === p.id 
                                ? "bg-emerald-500 text-white border-transparent" 
                                : "bg-white/5 text-[#D4AF37] border-white/10 hover:bg-[#D4AF37] hover:text-black hover:border-transparent"
                            )}
                          >
                            {copiedId === p.id ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id)}
                            className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/10">
                  <tr>
                    <th className="px-10 py-8">Annonce</th>
                    <th className="px-10 py-8">Type</th>
                    <th className="px-10 py-8">Date</th>
                    <th className="px-10 py-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {announcements.map(ann => (
                    <tr key={ann.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-10 py-8">
                        <p className="text-white font-black uppercase tracking-tight">{ann.title}</p>
                        <p className="text-xs text-white/40 line-clamp-1">{ann.message}</p>
                      </td>
                      <td className="px-10 py-8">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                          ann.type === 'warning' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : 
                          ann.type === 'success' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : 
                          "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                        )}>
                          {ann.type}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-xs font-medium text-white/30">
                        {ann.createdAt?.toDate ? format(ann.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}
                      </td>
                      <td className="px-10 py-8">
                        <button 
                          onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                          className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {announcements.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-10 py-20 text-center">
                         <p className="text-white/20 font-black uppercase tracking-widest text-[10px]">Aucune annonce dans l'historique.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* AI Topic Modal */}
      <AnimatePresence>
        {showAiTopicModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-lg shadow-[0_0_50px_rgba(79,70,229,0.2)] overflow-hidden border border-indigo-500/30 relative p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <Brain className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Générateur IA</h2>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Cerf-Volant Cognitif Gemini</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAiTopicModal(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 text-white/50 rounded-xl hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Sujet de l'Annonce</label>
                  <textarea 
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Ex: Nouvelle promotion sur le Super Gro pour le mois de Juin..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm font-bold focus:border-indigo-500 focus:outline-none transition-all h-[120px] resize-none placeholder:text-white/10"
                  />
                </div>

                <button 
                  onClick={handleGenerateAiAnnouncement}
                  disabled={isGeneratingAi || !aiTopic}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Calculateur de Matrice...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Générer Hologramme</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-2xl shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden border border-white/10 relative"
          >
            {/* Artistic Gold Header */}
            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#1e293b] to-[#0f172a]">
              <div>
                <h2 className="text-3xl font-black text-[#D4AF37] uppercase tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  {editingProduct ? 'Oracle Édition' : 'Nexus Produit'} <span className="text-white/50 text-sm align-middle ml-2 font-light">v2030</span>
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse shadow-[0_0_10px_#D4AF37]" />
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{editingProduct ? 'Altération de Réalité Produit' : 'Module de Création Holographique'}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAddProduct(false);
                  setEditingProduct(null);
                  setEditingTestimonialId(null);
                  setNewTestimonial({ author: '', text: '', rating: 5 });
                }}
                className="w-12 h-12 flex items-center justify-center bg-white/5 text-white/50 rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Identification Produit</label>
                  <input 
                    required
                    placeholder="Nom du produit"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 focus:outline-none transition-all placeholder:text-white/20"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Secteur Bio-Actif</label>
                  <select 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value as any})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold focus:border-[#D4AF37] focus:outline-none appearance-none transition-all"
                  >
                    <option value="health">Santé & Vitalité</option>
                    <option value="agriculture">Agriculture Biotech</option>
                    <option value="income">Croissance Financière</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Algorithme de Description</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Quels sont les bienfaits maîtres de ce produit ?"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold focus:border-[#D4AF37] focus:outline-none transition-all resize-none placeholder:text-white/20"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Zones de Livraison Delta (comma sep)</label>
                <input 
                  placeholder="Bénin, Togo, France..."
                  value={newProduct.countries.join(', ')}
                  onChange={(e) => setNewProduct({...newProduct, countries: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold focus:border-[#D4AF37] focus:outline-none transition-all placeholder:text-white/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Portail Acquisition (Shop URL)</label>
                  <input 
                    required
                    placeholder="https://shopneolife.com/..."
                    value={newProduct.shopUrl}
                    onChange={(e) => setNewProduct({...newProduct, shopUrl: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold focus:border-[#D4AF37] focus:outline-none transition-all placeholder:text-white/20"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Interface Visuelle</label>
                  
                  <div className="flex flex-col gap-4">
                    {/* Image Preview / Upload Area */}
                    <div className="relative group">
                      <div className={cn(
                        "w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative bg-white/5",
                        newProduct.imageUrl ? "border-[#D4AF37]/50" : "border-white/10 hover:border-[#D4AF37]/30"
                      )}>
                        {newProduct.imageUrl ? (
                          <>
                            <img src={newProduct.imageUrl} alt="Preview" className="w-full h-full object-contain p-4" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <label className="cursor-pointer bg-[#D4AF37] text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                                Changer l'image
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                              </label>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6">
                            {uploadProgress !== null ? (
                              <div className="flex flex-col items-center gap-4">
                                <div className="relative w-16 h-16">
                                  <svg className="w-full h-full" viewBox="0 0 36 36">
                                    <path className="stroke-white/10 fill-none" strokeWidth="2" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="stroke-[#D4AF37] fill-none transition-all duration-300" strokeWidth="2" strokeDasharray={`${uploadProgress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#D4AF37] font-mono">
                                    {Math.round(uploadProgress)}%
                                  </div>
                                </div>
                                <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Transmission Ionique...</p>
                              </div>
                            ) : (
                              <>
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-3 mx-auto border border-white/10 group-hover:scale-110 transition-transform">
                                  <Upload className="w-6 h-6 text-[#D4AF37]" />
                                </div>
                                <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Télécharger Image</p>
                                <p className="text-[8px] font-bold text-white/40 uppercase">PNG, JPG, WEBP (Max 5MB)</p>
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <ExternalLink className="w-3 h-3 text-white/20" />
                      </div>
                      <input 
                        placeholder="Ou coller une URL d'image..."
                        value={newProduct.imageUrl}
                        onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-[10px] font-bold focus:border-[#D4AF37] focus:outline-none transition-all placeholder:text-white/20 italic"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 bg-white/5 p-6 rounded-3xl border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Témoignages Clients</label>
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{newProduct.testimonials?.length || 0} Témoignages</span>
                </div>

                <div className="space-y-4">
                  {newProduct.testimonials?.map((t, idx) => (
                    <div key={t.id || idx} className={cn(
                      "p-4 bg-white/5 rounded-2xl border transition-all relative group",
                      editingTestimonialId === t.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-white/5"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-white uppercase">{t.author}</span>
                        <div className="flex gap-4 items-center">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map((i) => (
                              <Star key={i} className={cn("w-2 h-2", i <= t.rating ? "text-[#D4AF37] fill-[#D4AF37]" : "text-white/20")} />
                            ))}
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              type="button"
                              onClick={() => {
                                setNewTestimonial({ author: t.author, text: t.text, rating: t.rating });
                                setEditingTestimonialId(t.id);
                              }}
                              className="p-1 hover:text-[#D4AF37] transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                if (editingTestimonialId === t.id) {
                                  setEditingTestimonialId(null);
                                  setNewTestimonial({ author: '', text: '', rating: 5 });
                                }
                                setNewProduct({
                                  ...newProduct,
                                  testimonials: newProduct.testimonials?.filter((_, i) => i !== idx) || []
                                });
                              }}
                              className="p-1 hover:text-red-500 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-white/60 italic leading-relaxed">"{t.text}"</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-white/30">Auteur</label>
                      <input 
                        type="text"
                        placeholder="Nom du client"
                        value={newTestimonial.author}
                        onChange={(e) => setNewTestimonial({...newTestimonial, author: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-[10px] font-bold focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-white/30">Note</label>
                      <select 
                        value={newTestimonial.rating}
                        onChange={(e) => setNewTestimonial({...newTestimonial, rating: parseInt(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-[10px] font-bold focus:border-[#D4AF37] focus:outline-none appearance-none"
                      >
                        {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Étoiles</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-white/30">Témoignage</label>
                    <textarea 
                      placeholder="Contenu du témoignage..."
                      value={newTestimonial.text}
                      onChange={(e) => setNewTestimonial({...newTestimonial, text: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-[10px] font-bold focus:border-[#D4AF37] focus:outline-none resize-none h-20 placeholder:text-white/10"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (!newTestimonial.author || !newTestimonial.text) return;
                      
                      if (editingTestimonialId) {
                        setNewProduct({
                          ...newProduct,
                          testimonials: newProduct.testimonials?.map(t => 
                            t.id === editingTestimonialId 
                              ? { ...newTestimonial, id: editingTestimonialId } 
                              : t
                          ) || []
                        });
                        setEditingTestimonialId(null);
                      } else {
                        setNewProduct({
                          ...newProduct,
                          testimonials: [...(newProduct.testimonials || []), { ...newTestimonial, id: Date.now().toString() }]
                        });
                      }
                      setNewTestimonial({ author: '', text: '', rating: 5 });
                    }}
                    className={cn(
                      "w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 border",
                      editingTestimonialId 
                        ? "bg-[#D4AF37] text-black border-transparent" 
                        : "bg-white/10 text-white border-white/10 hover:bg-[#D4AF37] hover:text-black"
                    )}
                  >
                    {editingTestimonialId ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {editingTestimonialId ? 'Mettre à jour le Témoignage' : 'Ajouter ce Témoignage'}
                  </button>
                  {editingTestimonialId && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingTestimonialId(null);
                        setNewTestimonial({ author: '', text: '', rating: 5 });
                      }}
                      className="w-full py-2 text-[8px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                    >
                      Annuler la Modification
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit"
                  disabled={isSubmitting || uploadProgress !== null}
                  className="w-full py-6 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#0f172a] rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-[10px] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Séquence de Synchronisation...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>{editingProduct ? 'Mettre à Jour la Réalité' : 'Matérialiser le Produit'}</span>
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, rotateX: 20 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.9, opacity: 0, rotateX: 20 }}
              className="bg-[#0f172a] rounded-[3rem] w-full max-w-3xl shadow-[0_0_100px_rgba(212,175,55,0.2)] overflow-hidden border border-[#D4AF37]/20 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none" />
              
              <div className="relative p-10">
                <div className="flex items-start justify-between mb-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-[2rem] border border-[#D4AF37]/30 flex items-center justify-center shadow-inner">
                      <Send className="w-10 h-10 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">{selectedLead.name || 'Prospect Inconnu'}</h2>
                      <div className="flex flex-wrap gap-3">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white/40 uppercase tracking-widest">{selectedLead.email || 'Email non fourni'}</span>
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">{selectedLead.whatsapp || 'WhatsApp non fourni'}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="w-14 h-14 bg-white/5 border border-white/10 text-white/50 rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center group"
                  >
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                      <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-4">Analyse Sémantique</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Vecteur d'Entrée</p>
                          <p className="text-white font-black uppercase text-sm tracking-tight">{selectedLead.intent}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Status de Réalité</p>
                          <select 
                            value={leadStatus}
                            onChange={(e) => setLeadStatus(e.target.value as Lead['status'])}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-emerald-500 font-black uppercase text-xs tracking-tight focus:outline-none focus:border-[#D4AF37] transition-all"
                          >
                            <option value="new" className="bg-[#0f172a]">Nouveau (Alpha)</option>
                            <option value="contacted" className="bg-[#0f172a]">Contacté (Flux)</option>
                            <option value="converted" className="bg-[#0f172a]">Converti (Nexus)</option>
                          </select>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Date de Capture</p>
                          <p className="text-white/60 font-bold text-xs">{format(new Date(selectedLead.createdAt), 'dd MMMM yyyy, HH:mm')}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Distributeur Alloué</p>
                          <div className="flex items-center gap-2">
                             <div className="px-2 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded text-[8px] font-black text-[#D4AF37] uppercase tracking-widest">
                               SIG: {selectedLead.distributorId.slice(0, 16)}
                             </div>
                             <button 
                               onClick={() => {
                                 navigator.clipboard.writeText(selectedLead.distributorId);
                                 alert('ID Distributeur copié');
                               }}
                               className="text-[8px] font-black text-white/20 hover:text-white uppercase tracking-widest"
                             >
                               Copier ID
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Transmission d'origine</h3>
                        <button 
                          onClick={() => speak(selectedLead.message)}
                          className="p-1 px-2 flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all text-[8px] font-black uppercase"
                          title="Écouter le message"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Écouter</span>
                        </button>
                      </div>
                      <p className="text-sm font-medium text-white/80 leading-relaxed italic">“{selectedLead.message}”</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] flex items-center justify-between">
                        <span>Journal de Suivi (Notes)</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
                          <span className="text-[8px] opacity-40">Encryption Active</span>
                        </div>
                      </label>
                      <textarea 
                        value={leadNotes}
                        onChange={(e) => setLeadNotes(e.target.value)}
                        placeholder="Consignez ici les détails du suivi orbital..."
                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-white text-sm font-medium focus:border-[#D4AF37] focus:outline-none transition-all h-[260px] resize-none placeholder:text-white/10 leading-relaxed"
                      />
                    </div>
                    
                    <button 
                      onClick={handleSaveLead}
                      disabled={isSavingNotes}
                      className="w-full py-5 bg-white text-black rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-[#D4AF37] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isSavingNotes ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Synchronisation...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Enregistrer Séquence</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center space-x-3 px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group",
        active 
          ? "bg-[#D4AF37] text-black shadow-[0_10px_30px_rgba(212,175,55,0.3)] scale-105 z-10" 
          : "text-white/40 hover:text-white/70 hover:bg-white/5"
      )}
    >
      <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", active ? "text-black" : "text-[#D4AF37]")} />
      <span>{label}</span>
      {active && (
        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] animate-shimmer" />
      )}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const themes: any = {
    blue: "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]",
    emerald: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
    orange: "from-orange-500/20 to-orange-600/5 text-orange-400 border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]",
    indigo: "from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]",
    slate: "from-[#D4AF37]/20 to-[#D4AF37]/5 text-[#D4AF37] border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]",
  };

  return (
    <div className={cn(
      "p-8 rounded-[2.5rem] border backdrop-blur-xl bg-gradient-to-br transition-all hover:scale-[1.05] hover:shadow-2xl group relative overflow-hidden",
      themes[color]
    )}>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-24 h-24" />
      </div>
      <Icon className="w-6 h-6 mb-4 opacity-50" />
      <div className="space-y-1">
        <div className="text-3xl font-black tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{value}</div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 leading-none">{label}</p>
      </div>
    </div>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: 'slate' | 'blue';
  key?: string | number;
}

function FilterChip({ active, onClick, label, color = 'slate' }: FilterChipProps) {
  const themes = {
    slate: active 
      ? "bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black shadow-[0_0_30px_rgba(212,175,55,0.4)] border-transparent" 
      : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white hover:border-[#D4AF37]/50",
    blue: active 
      ? "bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] border-transparent" 
      : "bg-white/5 text-blue-400/50 border-white/10 hover:bg-white/10 hover:text-blue-400 hover:border-blue-400/50",
  };

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border relative overflow-hidden group/chip",
        themes[color]
      )}
    >
      <span className="relative z-10">{label}</span>
      {active && (
        <motion.div 
          layoutId={`active-glow-${color}`}
          className="absolute inset-0 bg-white/20 blur-md pointer-events-none"
        />
      )}
      <div className="absolute inset-0 bg-white/10 translate-y-[100%] group-hover/chip:translate-y-0 transition-transform duration-300" />
    </motion.button>
  );
}
