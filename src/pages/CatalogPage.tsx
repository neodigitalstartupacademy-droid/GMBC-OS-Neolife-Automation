import React from 'react';
import { collection, onSnapshot, query, orderBy, where, getDocs, limit } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, User } from '../types';
import { ShoppingBag, Search, ExternalLink, Filter, X, MessageSquare, Volume2, Star, UserCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isSubscriptionActive } from '../lib/subscription';
import { FOUNDER_CONFIG } from '../constants';
import { speak } from '../lib/tts';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export default function CatalogPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string>('all');
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedProductTestimonials, setSelectedProductTestimonials] = React.useState<Product | null>(null);
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
        
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <a 
            href="https://www.neolife.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Catalogue Officiel</span>
          </a>
          <a 
            href="https://shopneolife.com/startupforworld/shop/atoz"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
          >
            <ShoppingBag className="w-3 h-3" />
            <span>Ma Boutique NeoLife</span>
          </a>
        </div>
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
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                      {product.category}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(`${product.name}. ${product.description}`);
                      }}
                      className="p-1.5 bg-white/90 backdrop-blur-md rounded-lg text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm"
                      title="Écouter la description"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
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
                  
                  {product.testimonials && product.testimonials.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <button 
                        onClick={() => setSelectedProductTestimonials(product)}
                        className="w-full flex items-center justify-between group/tt"
                      >
                         <div className="flex items-center gap-2">
                           <div className="flex -space-x-2">
                             {product.testimonials.slice(0, 3).map((_, i) => (
                               <div key={i} className="w-6 h-6 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center">
                                 <UserCircle className="w-3.5 h-3.5 text-slate-300" />
                               </div>
                             ))}
                           </div>
                           <span className="text-[9px] font-black uppercase text-slate-400">{product.testimonials.length} Avis</span>
                         </div>
                         <div className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 group-hover:translate-x-1 transition-all">
                           <span>Découvrir</span>
                           <ArrowRight className="w-3 h-3" />
                         </div>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Testimonials Modal */}
      <AnimatePresence>
        {selectedProductTestimonials && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Avis Clients</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedProductTestimonials.name}</p>
                </div>
                <button 
                  onClick={() => setSelectedProductTestimonials(null)}
                  className="w-12 h-12 flex items-center justify-center bg-slate-100 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
                {selectedProductTestimonials.testimonials?.map((t, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={t.id || i} 
                    className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <UserCircle className="w-6 h-6 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase">{t.author}</p>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} className={cn("w-2.5 h-2.5", star <= t.rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => speak(`${t.author} dit : ${t.text}`)}
                        className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-blue-600 hover:shadow-lg transition-all flex items-center justify-center border border-slate-200 active:scale-95 shadow-sm"
                        title="Écouter le témoignage"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                      "{t.text}"
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                <button 
                  onClick={() => setSelectedProductTestimonials(null)}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
