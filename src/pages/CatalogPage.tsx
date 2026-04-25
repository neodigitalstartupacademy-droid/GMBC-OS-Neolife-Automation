import React from 'react';
import { collection, onSnapshot, query, orderBy, where, getDocs, limit } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, User } from '../types';
import { ShoppingBag, Search, ExternalLink, Filter, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isSubscriptionActive } from '../lib/subscription';
import { FOUNDER_CONFIG } from '../constants';

export default function CatalogPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string>('all');
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const [distributor, setDistributor] = React.useState<User | null>(null);
  const refCode = searchParams.get('ref');
  const productIdFromUrl = searchParams.get('product');

  React.useEffect(() => {
    async function checkDistributor() {
      if (!refCode) return;
      try {
        const q = query(collection(db, 'users'), where('referralCode', '==', refCode), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data() as User;
          if (isSubscriptionActive(data)) {
            setDistributor(data);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users?referralCode=${refCode}`);
      }
    }
    checkDistributor();
  }, [refCode]);

  React.useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'products'), orderBy('name', 'asc')), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsub();
  }, []);

  const activeDistributor = distributor || FOUNDER_CONFIG;

  const filteredProducts = products.filter(p => {
    if (productIdFromUrl) return p.id === productIdFromUrl;
    
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'Tous', icon: Filter },
    { id: 'health', label: 'Santé', icon: ShoppingBag },
    { id: 'agriculture', label: 'Agriculture', icon: ShoppingBag },
    { id: 'income', label: 'Revenus', icon: ShoppingBag },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4">Catalogue NeoLife</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Découvrez nos solutions mondiales pour la santé et le business</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-12 items-center justify-between">
        {productIdFromUrl ? (
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSearchParams({})}
              className="flex items-center space-x-2 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all shadow-sm"
            >
              <X className="w-4 h-4" />
              <span>Voir tout le catalogue</span>
            </button>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:border-blue-600 focus:outline-none transition-colors shadow-sm"
              />
            </div>

            {/* Categories */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeCategory === cat.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement du catalogue...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
           <ShoppingBag className="w-16 h-16 text-slate-100 mx-auto mb-6" />
           <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Aucun produit trouvé</h3>
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Essayez une autre recherche ou catégorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -10 }}
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-100/50 transition-all group"
              >
                <div className="aspect-square bg-slate-50 relative overflow-hidden">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-slate-200" />
                    </div>
                  )}
                  <div className="absolute top-6 left-6">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                      {product.category}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-slate-500 text-xs font-bold leading-relaxed mb-8 line-clamp-3 min-h-[4.5em]">
                    {product.description}
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <a 
                      href={activeDistributor.neoLifeShopUrl || product.shopUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center space-x-2 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                    >
                      <span>Site Officiel</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button 
                      onClick={() => window.location.href = `/chat?product=${encodeURIComponent(product.name)}${refCode ? `&ref=${refCode}` : ''}`}
                      className="w-full flex items-center justify-center space-x-2 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 hover:text-white transition-all active:scale-95 border-2 border-transparent hover:border-emerald-100"
                    >
                      <span>Conseil Expert</span>
                      <MessageSquare className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
