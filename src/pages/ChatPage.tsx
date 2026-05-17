import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, Link } from 'react-router-dom';
import { Send, User as UserIcon, Bot, Loader2, Globe, Heart, DollarSign, Sprout, ShoppingCart, MessageCircle, Volume2, VolumeX, Trash2, Mic, MicOff, AlertCircle, Paperclip, X, Image as ImageIcon, Rocket, Zap } from 'lucide-react';
import { getCoachJoseResponse } from '../services/geminiService';
import { useNotifications } from '../context/NotificationContext';
import { ChatMessage, Lead, User } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, doc, updateDoc } from 'firebase/firestore';
import { isSubscriptionActive } from '../lib/subscription';
import { FOUNDER_CONFIG } from '../constants';
import { speak, stopSpeaking } from '../lib/tts';

export default function ChatPage() {
  const { addNotification } = useNotifications();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');
  const productParam = searchParams.get('product');

  const [distributor, setDistributor] = React.useState<User | null>(null);
  const [isCheckingDistributor, setIsCheckingDistributor] = React.useState(!!refCode);

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      content: "Bonjour ! Ravi de vous accueillir sur le GMBC-OS. Je suis Coach José, votre expert NeoLife. Pour mieux vous conseiller, de quel pays nous contactez-vous ?",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [userCountry, setUserCountry] = React.useState<string | null>(null);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const [attachedFile, setAttachedFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [speakingId, setSpeakingId] = React.useState<string | null>(null);
  const [isListening, setIsListening] = React.useState(false);
  const [hasInitializedProduct, setHasInitializedProduct] = React.useState(false);
  const [currentLeadId, setCurrentLeadId] = React.useState<string | null>(null);
  const [detectedIntent, setDetectedIntent] = React.useState<Lead['intent']>('unknown');
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    async function checkDistributor() {
      if (!refCode) {
        setIsCheckingDistributor(false);
        return;
      }

      try {
        const q = query(collection(db, 'users'), where('referralCode', '==', refCode), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as User;
          if (isSubscriptionActive(data)) {
            setDistributor(data);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users?referralCode=${refCode}`);
      } finally {
        setIsCheckingDistributor(false);
      }
    }
    checkDistributor();
  }, [refCode]);

  React.useEffect(() => {
    if (!isCheckingDistributor && productParam && !hasInitializedProduct && messages.length === 1) {
      setHasInitializedProduct(true);
      const initialMessage = `Je souhaite avoir plus de conseils sur le produit : ${productParam}`;
      handleSubmit(undefined, initialMessage);
    }
  }, [productParam, hasInitializedProduct, messages.length]);

  React.useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR'; // Default to French for this app

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSpeak = (text: string, id: string) => {
    if (speakingId === id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }

    stopSpeaking();
    setSpeakingId(id);
    speak(text, 'fr-FR');
    
    // Check when speech ends to reset UI
    const checkEnd = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        setSpeakingId(null);
        clearInterval(checkEnd);
      }
    }, 100);
  };

  const activeDistributor = distributor || FOUNDER_CONFIG;
  const refQuery = refCode ? `?ref=${refCode}` : '';

  const trackLead = async (message: string, intent: Lead['intent'], status: Lead['status'] = 'new') => {
    try {
      if (currentLeadId) {
        const leadRef = doc(db, 'leads', currentLeadId);
        await updateDoc(leadRef, { 
          intent,
          status,
          updatedAt: serverTimestamp()
        });
      } else {
        const leadData: Omit<Lead, 'id'> = {
          distributorId: distributor?.id || 'founder',
          message,
          intent,
          country: userCountry || undefined,
          status,
          createdAt: serverTimestamp() as any,
        };
        const docRef = await addDoc(collection(db, 'leads'), leadData);
        setCurrentLeadId(docRef.id);
      }
      setDetectedIntent(intent);
    } catch (error) {
      console.error("Error tracking lead:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    if (e.target && 'files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e) {
      file = (e as React.DragEvent).dataTransfer.files[0];
    }

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Fichier trop volumineux (max 5MB)");
        return;
      }
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e);
  };

  const handleSubmit = async (e?: React.FormEvent, customInput?: string) => {
    e?.preventDefault();
    const finalInput = customInput || input;
    if (!finalInput.trim() && !attachedFile) return;
    if (isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: finalInput,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!userCountry) {
      setUserCountry(finalInput);
      setIsTyping(true);
      setTimeout(() => {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: `Parfait, vous êtes au ${finalInput} ! Je peux maintenant vous donner des conseils adaptés à votre région. Que souhaitez-vous explorer aujourd'hui ?\n\n1. 🌿 Santé & Bien-être\n2. 💰 Opportunité d'Affaires\n3. 🚜 Agriculture Moderne\n4. 📦 Catalogue Produits`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    setIsLoading(true);
    setIsTyping(true);

    try {
      // Intent detection
      let intent: Lead['intent'] = detectedIntent;
      let status: Lead['status'] = 'new';

      const lowerInput = finalInput.toLowerCase();
      if (finalInput === '1' || lowerInput.includes('santé') || lowerInput.includes('bien-être')) intent = 'health';
      if (finalInput === '2' || lowerInput.includes('affaire') || lowerInput.includes('revenu') || lowerInput.includes('argent') || lowerInput.includes('business')) intent = 'income';
      if (finalInput === '3' || lowerInput.includes('agri') || lowerInput.includes('culture') || lowerInput.includes('super gro')) intent = 'agriculture';
      if (finalInput === '4' || lowerInput.includes('catalogue') || lowerInput.includes('boutique') || lowerInput.includes('produit')) intent = 'products';

      // Detect conversion cues
      if (lowerInput.includes('commander') || lowerInput.includes('acheter') || lowerInput.includes('whatsapp') || lowerInput.includes('boutique')) status = 'contacted';
      if (lowerInput.includes('devenir distributeur') || lowerInput.includes('inscription') || lowerInput.includes('rejoindre')) {
        intent = 'income';
        status = 'contacted';
      }

      await trackLead(finalInput, intent, status);

      const responseText = await getCoachJoseResponse(messages.concat(userMessage).map(m => ({
        role: m.role,
        content: m.content
      })), userCountry);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      addNotification("Coach José", "Nouveau message reçu", "message");
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: 'err',
        role: 'model',
        content: "Désolé, j'ai rencontré une petite erreur. Pouvons-nous réessayer ?",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const quickReplies = [
    { label: 'Santé', icon: Heart, value: '1' },
    { label: 'Revenus', icon: DollarSign, value: '2' },
    { label: 'Agriculture', icon: Sprout, value: '3' },
    { label: 'Produits', icon: ShoppingCart, value: '4' },
  ];

  const clearChat = () => {
    if (confirm('Voulez-vous effacer la conversation ?')) {
      window.speechSynthesis.cancel();
      setMessages([
        {
          id: Date.now().toString(),
          role: 'model',
          content: "Chat réinitialisé. Comment puis-je vous aider aujourd’hui ?",
          timestamp: new Date().toISOString(),
        }
      ]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col p-4 md:p-8 bg-slate-50">
      <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Chat Header */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-sm md:text-base">Coach José</h2>
              <div className="flex items-center space-x-1 text-[10px] text-blue-300 uppercase tracking-widest font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>Expert IA en ligne</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={clearChat}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Effacer le chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <p className="text-xs text-slate-400 hidden sm:block">Agent Neo Digital System</p>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth"
        >
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={cn(
                "flex items-start space-x-3 mb-4",
                msg.role === 'user' ? "flex-row-reverse space-x-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                msg.role === 'model' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
              )}>
                {msg.role === 'model' ? <Bot className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
              </div>
              <div className="flex flex-col max-w-[85%]">
                <div className={cn(
                  "relative group rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
                  msg.role === 'model' ? "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100" : "bg-blue-600 text-white rounded-tr-none"
                )}>
                  {msg.content}
                  {msg.role === 'model' && (
                    <button
                      onClick={() => handleSpeak(msg.content, msg.id)}
                      className={cn(
                        "absolute -right-10 top-0 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 bg-white shadow-sm border border-slate-100",
                        speakingId === msg.id ? "opacity-100 text-blue-600" : "text-slate-400 hover:text-blue-600"
                      )}
                      title="Écouter le message"
                    >
                      {speakingId === msg.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Replies */}
        {(messages.length === 1 || (messages.length === 3 && userCountry)) && !isLoading && (
          <div className="p-4 border-t border-slate-50 flex flex-wrap gap-2 justify-center bg-slate-50/30">
            {quickReplies.map((reply) => (
              <button
                key={reply.label}
                onClick={() => handleSubmit(undefined, reply.value)}
                className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 hover:border-blue-200 shadow-sm active:scale-95"
              >
                <reply.icon className="w-3 h-3" />
                <span>{reply.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Closing Action Buttons */}
        <AnimatePresence>
          {messages.some(m => m.id === 'err') === false && messages.length > 5 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 flex flex-wrap gap-2 justify-center border-t border-slate-100 bg-slate-50/50"
            >
              {detectedIntent === 'income' && (
                <Link
                  to={`/login${refQuery}`}
                  className="flex items-center space-x-2 px-6 py-2 bg-[#D4AF37] text-black rounded-xl text-sm font-black uppercase tracking-widest shadow-lg hover:bg-white transition-all active:scale-95"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Démarrer Maintenant</span>
                </Link>
              )}
              
              <a 
                href={`https://wa.me/${activeDistributor.whatsapp?.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent("Bonjour j'aimerais en savoir plus après ma discussion avec Coach José")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Expert</span>
              </a>
              <Link 
                to={`/catalog${refQuery}`}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Voir le Catalogue</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <form 
          onSubmit={handleSubmit}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "p-4 border-t border-slate-200 bg-white transition-colors relative",
            isDragging ? "bg-blue-50 ring-2 ring-inset ring-blue-600/30" : ""
          )}
        >
          <AnimatePresence>
            {attachedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-900 uppercase truncate">{attachedFile.name}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">{(attachedFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <Paperclip className="w-5 h-5 animate-bounce" />
                </div>
                <span className="text-sm font-black text-blue-600 uppercase tracking-widest italic">Déposez pour joindre</span>
              </div>
            </div>
          )}

          <div className="relative flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-2 p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded-lg transition-all"
              title="Joindre un fichier"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre message ici..."
              disabled={isLoading}
              className="w-full bg-slate-100 border-none rounded-xl py-4 pl-12 pr-24 text-sm focus:ring-2 focus:ring-blue-600/20 focus:outline-none placeholder:text-slate-500 disabled:opacity-50"
            />
            <div className="absolute right-2 flex items-center space-x-2">
              <button
                type="button"
                onClick={toggleListening}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  isListening ? "bg-red-100 text-red-600 animate-pulse" : "text-slate-400 hover:text-blue-600 hover:bg-slate-200"
                )}
                title={isListening ? "Arrêter l'écoute" : "Utiliser le microphone"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            Coach José fournit des conseils de bien-être et de business. Ce n'est pas un diagnostic médical localisé.
          </p>
        </form>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
