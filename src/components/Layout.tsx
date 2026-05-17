import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, 
  Menu, 
  X, 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut, 
  User, 
  ShieldCheck,
  Bell,
  Trash2,
  CheckCircle2,
  Database,
  ShoppingBag
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t } = useLanguage();
  const [user] = useAuthState(auth);
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  const navigation = [
    { name: 'Accueil', href: '/', icon: Rocket },
    { name: 'Coach José', href: 'https://gmbcoreos.com/s/coachjose', icon: MessageSquare, external: true },
    { name: 'Catalogue', href: '/catalog', icon: ShoppingBag },
    ...(user ? [
      { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Profil', href: '/profile', icon: User }
    ] : []),
  ];

  const adminNav = user?.email === 'neodigitalstartupacademy@gmail.com' 
    ? { name: 'Admin', href: '/admin', icon: Database } 
    : null;

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-slate-900 leading-tight tracking-tighter">
                    GMBC-OS
                  </span>
                  <span className="text-[7px] font-bold text-blue-600 uppercase tracking-widest leading-none">
                    NeoLife Optimizer
                  </span>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                if (item.external) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2",
                      isActive 
                        ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              {adminNav && (
                <Link
                  to={adminNav.href}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2",
                    location.pathname === adminNav.href 
                      ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <adminNav.icon className="w-4 h-4" />
                  <span>{adminNav.name}</span>
                </Link>
              )}

              {/* Language Selector */}
              <div className="flex items-center gap-1 px-3 py-1 bg-slate-50 rounded-xl border border-slate-100 ml-2">
                {[
                  { code: 'fr', label: 'FR' },
                  { code: 'en', label: 'EN' },
                  { code: 'es', label: 'ES' },
                  { code: 'pt', label: 'PT' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as any)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[9px] font-black transition-all",
                      language === lang.code 
                        ? "bg-white text-blue-600 shadow-sm" 
                        : "text-slate-400 hover:text-slate-900"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              {!user ? (
                <Link
                  to="/login"
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 ml-4"
                >
                  Démarrer
                </Link>
              ) : (
                <div className="flex items-center space-x-2 ml-4 border-l border-slate-100 pl-4">
                  <div className="relative">
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className={cn(
                        "p-2 rounded-xl transition-all relative",
                        showNotifications ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {showNotifications && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                          >
                            <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Notifications</h3>
                              <div className="flex gap-2">
                                <button onClick={markAllAsRead} className="text-[8px] font-black text-blue-600 uppercase hover:underline">Tout lire</button>
                                <button onClick={clearNotifications} className="text-slate-400 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                              {notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                  <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Aucune notification</p>
                                </div>
                              ) : (
                                <div className="divide-y divide-slate-50">
                                  {notifications.map((n) => (
                                    <div 
                                      key={n.id} 
                                      onClick={() => markAsRead(n.id)}
                                      className={cn(
                                        "p-4 cursor-pointer transition-colors hover:bg-slate-50 text-left",
                                        !n.read ? "bg-blue-50/30" : ""
                                      )}
                                    >
                                      <div className="flex gap-3">
                                        <div className={cn(
                                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                          n.type === 'lead' ? "bg-emerald-100 text-emerald-600" :
                                          n.type === 'message' ? "bg-blue-100 text-blue-600" :
                                          "bg-slate-100 text-slate-600"
                                        )}>
                                          {n.type === 'lead' ? <CheckCircle2 className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                        </div>
                                        <div>
                                          <div className="text-[10px] font-black text-slate-900 mb-1 tracking-tight">{n.title}</div>
                                          <p className="text-[9px] font-medium text-slate-500 leading-tight mb-2">{n.message}</p>
                                          <div className="text-[8px] font-bold text-slate-400 uppercase">{new Date(n.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="md:hidden flex items-center space-x-2">
              {user && (
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-400 relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
                </button>
              )}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all font-sans"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-200"
            >
              <div className="px-4 pt-2 pb-3 space-y-1">
                {navigation.map((item) => {
                  if (item.external) {
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-3 px-3 py-2 rounded-md font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-md font-medium transition-colors",
                        location.pathname === item.href ? "text-blue-600 bg-blue-50" : "text-slate-700"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                {!user ? (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium"
                  >
                    Démarrer
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      auth.signOut();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600"
                  >
                    Déconnexion
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center space-x-2 text-white mb-4 uppercase tracking-tighter font-black">
                <Rocket className="w-6 h-6 text-blue-500" />
                <span>GMBC-OS</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Global MLM Business Core Optimization System.<br />
                Propulser les distributeurs NeoLife grâce à l'automatisation intelligente.
              </p>
            </div>
            <div>
              <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-4">Liens Rapides</h3>
              <ul className="space-y-2 text-[11px] font-bold uppercase tracking-tight">
                <li><a href="https://gmbcoreos.com/s/coachjose" className="hover:text-blue-400">Coach José</a></li>
                <li><a href="https://gmbcoreos.com" className="hover:text-blue-400">Portail GMBC-OS</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-4">Support</h3>
              <ul className="space-y-2 text-[11px] font-bold uppercase tracking-tight">
                <li><a href="https://wa.me/2290195388292" className="hover:text-green-400">Support WhatsApp</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-[10px] font-medium text-slate-500">
            © {new Date().getFullYear()} GMBC-OS – Neo Digital System. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
