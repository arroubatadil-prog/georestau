import React, { useState, useEffect, useRef } from 'react';
import { User, Restaurant, Order } from '../types';
import { 
  User as UserIcon, LayoutDashboard, List, ShoppingBag, LogOut, TrendingUp, Bell, Moon, Sun, MessageCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { doc, setDoc, getDoc, collection, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useI18n } from '../i18n';

// Import des nouveaux composants
import { ChefProfile } from './chef/ChefProfile';
import { ChefMenu } from './chef/ChefMenu';
import { ChefOrders } from './chef/ChefOrders';
import { ChefMessages } from './chef/ChefMessages';

interface ChefDashboardProps {
  user: User;
  onLogout: () => void;
  userSettings?: {
    lang: 'fr' | 'en' | 'ar';
    theme: 'light' | 'dark';
    setLang: (lang: 'fr' | 'en' | 'ar') => void;
    setTheme: (theme: 'light' | 'dark') => void;
  };
}

export const ChefDashboard: React.FC<ChefDashboardProps> = ({ user, onLogout, userSettings }) => {
  // --- ÉTATS ---
  const { t } = useI18n();
  
  // Restaurer l'état depuis localStorage au chargement
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'stats' | 'profile' | 'messages'>(() => {
    try {
      const saved = localStorage.getItem('chefDashboard_activeTab');
      return (saved as 'menu' | 'orders' | 'stats' | 'profile' | 'messages') || 'profile';
    } catch { return 'profile'; }
  });
  
  const [statsPeriod, setStatsPeriod] = useState<'hour' | 'day' | 'week' | 'month' | 'year'>(() => {
    try {
      const saved = localStorage.getItem('chefDashboard_statsPeriod');
      return (saved as 'hour' | 'day' | 'week' | 'month' | 'year') || 'week';
    } catch { return 'week'; }
  });
  
  const [tabHistory, setTabHistory] = useState<Array<'menu' | 'orders' | 'stats' | 'profile' | 'messages'>>(() => {
    try {
      const saved = localStorage.getItem('chefDashboard_tabHistory');
      return saved ? JSON.parse(saved) : ['profile'];
    } catch { return ['profile']; }
  });
  
  // Gérer le bouton retour du navigateur/téléphone
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      
      // Si on a un historique, revenir à l'onglet précédent
      if (tabHistory.length > 1) {
        const newHistory = [...tabHistory];
        newHistory.pop(); // Retirer l'état actuel
        const previousTab = newHistory[newHistory.length - 1];
        
        setTabHistory(newHistory);
        setActiveTab(previousTab);
        
        // Remettre un état dans l'historique pour le prochain retour
        window.history.pushState(null, '', window.location.href);
      } else {
        // Si on est au début, déconnecter
        onLogout();
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [tabHistory, onLogout]);
  
  // Ajouter un état dans l'historique du navigateur au montage
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
  }, []);
  
  // Sauvegarder l'état dans localStorage à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem('chefDashboard_activeTab', activeTab);
      localStorage.setItem('chefDashboard_statsPeriod', statsPeriod);
      localStorage.setItem('chefDashboard_tabHistory', JSON.stringify(tabHistory));
    } catch {}
  }, [activeTab, statsPeriod, tabHistory]);
  
  // Fonction helper pour changer d'onglet avec historique
  const navigateToTab = (newTab: 'menu' | 'orders' | 'stats' | 'profile' | 'messages') => {
    setActiveTab(newTab);
    setTabHistory(prev => [...prev, newTab]);
    window.history.pushState(null, '', window.location.href);
  };
  
  const [restaurant, setRestaurant] = useState<Restaurant>({
    id: user.uid, ownerId: user.uid, name: user.displayName || "Mon Restaurant", description: 'Une expérience culinaire unique.', phone: '+212 600 000 000', type: 'restaurant', delivery: false, location: { lat: 40.7128, lng: -74.0060 }, coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80', profileImage: user.photoURL || 'https://via.placeholder.com/150', menu: []
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const prevOrdersRef = useRef<Order[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Calculer les statistiques dynamiques basées sur les vraies commandes
  const calculateStats = () => {
    const now = Date.now();
    let periodStart: number;
    let periodLabel: string;
    
    // Définir la période selon le filtre
    switch (statsPeriod) {
      case 'hour':
        periodStart = now - (60 * 60 * 1000); // Dernière heure
        periodLabel = 'Dernière heure';
        break;
      case 'day':
        periodStart = now - (24 * 60 * 60 * 1000); // Dernier jour
        periodLabel = "Aujourd'hui";
        break;
      case 'week':
        periodStart = now - (7 * 24 * 60 * 60 * 1000); // 7 jours
        periodLabel = '7 derniers jours';
        break;
      case 'month':
        periodStart = now - (30 * 24 * 60 * 60 * 1000); // 30 jours
        periodLabel = '30 derniers jours';
        break;
      case 'year':
        periodStart = now - (365 * 24 * 60 * 60 * 1000); // 365 jours
        periodLabel = 'Cette année';
        break;
      default:
        periodStart = now - (7 * 24 * 60 * 60 * 1000);
        periodLabel = '7 derniers jours';
    }
    
    // Filtrer les commandes complétées de la période
    const recentOrders = orders.filter(o => 
      o.status === 'completed' && o.timestamp > periodStart
    );

    // Calculer le revenu total
    const totalRevenue = recentOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    // Nombre total de commandes
    const totalOrders = recentOrders.length;

    // Plat le plus populaire
    const dishCount: Record<string, number> = {};
    recentOrders.forEach(order => {
      order.items.forEach(item => {
        dishCount[item.name] = (dishCount[item.name] || 0) + item.count;
      });
    });
    const popularDish = Object.entries(dishCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Aucun';

    // Créer les données pour le graphique selon la période
    let chartData: { name: string; sales: number }[] = [];
    
    if (statsPeriod === 'hour') {
      // Dernières 12 périodes de 5 minutes
      const minuteData: Record<number, number> = {};
      recentOrders.forEach(order => {
        const minute = Math.floor((new Date(order.timestamp).getMinutes()) / 5) * 5;
        minuteData[minute] = (minuteData[minute] || 0) + (order.total || 0);
      });
      for (let i = 11; i >= 0; i--) {
        const minute = (Math.floor(new Date().getMinutes() / 5) * 5 - i * 5 + 60) % 60;
        chartData.push({ name: `${minute}min`, sales: minuteData[minute] || 0 });
      }
    } else if (statsPeriod === 'day') {
      // Dernières 24 heures par heure
      const hourData: Record<number, number> = {};
      recentOrders.forEach(order => {
        const hour = new Date(order.timestamp).getHours();
        hourData[hour] = (hourData[hour] || 0) + (order.total || 0);
      });
      const currentHour = new Date().getHours();
      for (let i = 23; i >= 0; i--) {
        const hour = (currentHour - i + 24) % 24;
        chartData.push({ name: `${hour}h`, sales: hourData[hour] || 0 });
      }
    } else if (statsPeriod === 'week') {
      // 7 derniers jours
      const dayData: Record<string, number> = {};
      recentOrders.forEach(order => {
        const date = new Date(order.timestamp);
        const dayKey = `${date.getDate()}/${date.getMonth() + 1}`;
        dayData[dayKey] = (dayData[dayKey] || 0) + (order.total || 0);
      });
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        const dayKey = `${date.getDate()}/${date.getMonth() + 1}`;
        const dayName = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()];
        chartData.push({ name: dayName, sales: dayData[dayKey] || 0 });
      }
    } else if (statsPeriod === 'month') {
      // 30 derniers jours groupés par 5 jours
      const periodData: Record<number, number> = {};
      recentOrders.forEach(order => {
        const daysAgo = Math.floor((now - order.timestamp) / (24 * 60 * 60 * 1000));
        const period = Math.floor(daysAgo / 5);
        periodData[period] = (periodData[period] || 0) + (order.total || 0);
      });
      for (let i = 5; i >= 0; i--) {
        chartData.push({ name: `J-${i * 5}`, sales: periodData[i] || 0 });
      }
    } else if (statsPeriod === 'year') {
      // 12 derniers mois
      const monthData: Record<number, number> = {};
      recentOrders.forEach(order => {
        const month = new Date(order.timestamp).getMonth();
        monthData[month] = (monthData[month] || 0) + (order.total || 0);
      });
      const currentMonth = new Date().getMonth();
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      for (let i = 11; i >= 0; i--) {
        const month = (currentMonth - i + 12) % 12;
        chartData.push({ name: monthNames[month], sales: monthData[month] || 0 });
      }
    }

    return {
      totalRevenue,
      totalOrders,
      popularDish,
      chartData,
      periodLabel
    };
  };

  const stats = calculateStats();

  // --- EFFETS ---
  useEffect(() => {
      const fetchRestoData = async () => {
          if (!user.uid) return;
          try {
              const docRef = doc(db, "restaurants", user.uid);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                  const data = docSnap.data() as any;
                  setRestaurant(prev => ({ ...prev, ...data, menu: data.menu || prev.menu }));
              }
          } catch (e) { console.error("Erreur chargement", e); }
      };
      fetchRestoData();
  }, [user.uid]);

  useEffect(() => {
      if (!user.uid) return;
      const q = query(collection(db, "orders"), where("restaurantId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const liveOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
          
          // Notifications
          liveOrders.forEach(newOrder => {
              const oldOrder = prevOrdersRef.current.find(o => o.id === newOrder.id);
              if (!oldOrder) showNotification(`🎉 Nouvelle commande de ${newOrder.clientName || 'Client'} !`);
              else if (newOrder.chat && oldOrder.chat && newOrder.chat.length > oldOrder.chat.length) {
                  const lastMsg = newOrder.chat[newOrder.chat.length - 1];
                  if (lastMsg.sender === 'client') showNotification(`💬 Message de ${newOrder.clientName || 'Client'}`);
              }
          });

          prevOrdersRef.current = liveOrders;
          setOrders(liveOrders.sort((a, b) => b.timestamp - a.timestamp));
      });
      return () => unsubscribe();
  }, [user.uid]);

  // --- HANDLERS ---
  const showNotification = (msg: string) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 5000);
  };

  const saveToFirebase = async (updatedData: Partial<Restaurant>) => {
      try {
          const docRef = doc(db, "restaurants", user.uid);
          await setDoc(docRef, updatedData, { merge: true });
          setRestaurant(prev => ({ ...prev, ...updatedData }));
      } catch (e) { console.error("Erreur sauvegarde", e); }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: any) => {
      try { 
          const updateData: any = { status: newStatus };
          
          // Si le statut passe à "ready" (prêt/en route), calculer la durée estimée de livraison
          if (newStatus === 'ready') {
              const order = orders.find(o => o.id === orderId);
              
              if (order && order.deliveryLocation && restaurant?.location) {
                  // Calculer la distance entre le restaurant et le client
                  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                      const R = 6371; // Rayon de la Terre en km
                      const dLat = (lat2 - lat1) * Math.PI / 180;
                      const dLon = (lon2 - lon1) * Math.PI / 180;
                      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                                Math.sin(dLon / 2) * Math.sin(dLon / 2);
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                      return R * c;
                  };
                  
                  const distance = getDistanceFromLatLonInKm(
                      restaurant.location.lat,
                      restaurant.location.lng,
                      order.deliveryLocation.lat,
                      order.deliveryLocation.lng
                  );
                  
                  // Estimer le temps de livraison (vitesse moyenne en ville: 30 km/h + 5 min de préparation)
                  const travelTimeMinutes = Math.ceil((distance / 30) * 60);
                  const preparationTime = 5;
                  const estimatedDeliveryMinutes = travelTimeMinutes + preparationTime;
                  
                  // Calculer l'heure d'arrivée estimée
                  const estimatedArrivalTime = Date.now() + (estimatedDeliveryMinutes * 60 * 1000);
                  
                  updateData.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
                  updateData.estimatedArrivalTime = estimatedArrivalTime;
                  updateData.deliveryDistance = Math.round(distance * 10) / 10; // Arrondir à 1 décimale
              }
          }
          
          await updateDoc(doc(db, "orders", orderId), updateData); 
      } catch(e){ console.error(e); }
  };

  const isDarkMode = userSettings?.theme === 'dark';

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 md:flex-row relative overflow-hidden">
      
      {notification && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[3000] bg-gray-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 sm:gap-3 animate-slideUp max-w-[90vw]">
              <Bell className="text-orange-500 animate-bounce flex-shrink-0" size={18} />
              <span className="font-bold text-xs sm:text-sm truncate">{notification}</span>
          </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-lg z-20 md:w-64 flex flex-col md:h-full fixed bottom-0 w-full md:static border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-700 safe-area-bottom">
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg"><LayoutDashboard className="text-orange-600 dark:text-orange-400" size={24} /></div>
            <div><h2 className="font-bold text-gray-800 dark:text-gray-100">{t('chef_portal')}</h2><p className="text-xs text-gray-500 dark:text-gray-400 truncate w-32">{restaurant.name}</p></div>
        </div>
        <nav className="flex md:flex-col justify-around md:justify-start flex-1 md:p-4 overflow-x-auto pb-safe">
          <button onClick={() => navigateToTab('profile')} className={`flex flex-col md:flex-row items-center md:gap-3 p-2 sm:p-3 rounded-xl transition-colors min-w-[60px] md:min-w-0 ${activeTab === 'profile' ? 'text-orange-600 dark:text-orange-400 md:bg-orange-50 dark:md:bg-orange-900/20' : 'text-gray-400 dark:text-gray-500 active:text-gray-600 dark:active:text-gray-300'}`}><UserIcon size={20} className="sm:w-[22px] sm:h-[22px]" /><span className="text-[10px] sm:text-xs md:text-sm font-medium mt-1 md:mt-0">{t('profile')}</span></button>
          <button onClick={() => navigateToTab('menu')} className={`flex flex-col md:flex-row items-center md:gap-3 p-2 sm:p-3 rounded-xl transition-colors min-w-[60px] md:min-w-0 ${activeTab === 'menu' ? 'text-orange-600 dark:text-orange-400 md:bg-orange-50 dark:md:bg-orange-900/20' : 'text-gray-400 dark:text-gray-500 active:text-gray-600 dark:active:text-gray-300'}`}><List size={20} className="sm:w-[22px] sm:h-[22px]" /><span className="text-[10px] sm:text-xs md:text-sm font-medium mt-1 md:mt-0">{t('menu')}</span></button>
          <button onClick={() => navigateToTab('orders')} className={`flex flex-col md:flex-row items-center md:gap-3 p-2 sm:p-3 rounded-xl transition-colors min-w-[60px] md:min-w-0 ${activeTab === 'orders' ? 'text-orange-600 dark:text-orange-400 md:bg-orange-50 dark:md:bg-orange-900/20' : 'text-gray-400 dark:text-gray-500 active:text-gray-600 dark:active:text-gray-300'}`}><ShoppingBag size={20} className="sm:w-[22px] sm:h-[22px]" /><span className="text-[10px] sm:text-xs md:text-sm font-medium mt-1 md:mt-0">{t('orders')}</span></button>
          <button onClick={() => navigateToTab('messages')} className={`flex flex-col md:flex-row items-center md:gap-3 p-2 sm:p-3 rounded-xl transition-colors min-w-[60px] md:min-w-0 ${activeTab === 'messages' ? 'text-orange-600 dark:text-orange-400 md:bg-orange-50 dark:md:bg-orange-900/20' : 'text-gray-400 dark:text-gray-500 active:text-gray-600 dark:active:text-gray-300'}`}><MessageCircle size={20} className="sm:w-[22px] sm:h-[22px]" /><span className="text-[10px] sm:text-xs md:text-sm font-medium mt-1 md:mt-0">Messages</span></button>
          <button onClick={() => navigateToTab('stats')} className={`flex flex-col md:flex-row items-center md:gap-3 p-2 sm:p-3 rounded-xl transition-colors min-w-[60px] md:min-w-0 ${activeTab === 'stats' ? 'text-orange-600 dark:text-orange-400 md:bg-orange-50 dark:md:bg-orange-900/20' : 'text-gray-400 dark:text-gray-500 active:text-gray-600 dark:active:text-gray-300'}`}><TrendingUp size={20} className="sm:w-[22px] sm:h-[22px]" /><span className="text-[10px] sm:text-xs md:text-sm font-medium mt-1 md:mt-0">{t('stats')}</span></button>
        </nav>
        <div className="hidden md:block p-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
          {userSettings && (
            <button 
              onClick={() => userSettings.setTheme(isDarkMode ? 'light' : 'dark')} 
              className="w-full flex items-center gap-3 p-3 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
            >
              {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              <span className="font-medium">{isDarkMode ? t('dark_mode') : t('theme_light')}</span>
            </button>
          )}
          <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><LogOut size={20} /><span className="font-medium">{t('logout')}</span></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="md:hidden bg-white dark:bg-gray-800 p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100 capitalize">{activeTab}</h1>
            <div className="flex items-center gap-2">
              {userSettings && (
                <button 
                  onClick={() => userSettings.setTheme(isDarkMode ? 'light' : 'dark')} 
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                </button>
              )}
              <button onClick={onLogout} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"><LogOut size={18} /></button>
            </div>
        </div>

        {/* --- AFFICHAGE DES SOUS-COMPOSANTS --- */}
        
        {activeTab === 'profile' && (
            <ChefProfile 
                restaurant={restaurant} 
                onUpdate={(field, val) => saveToFirebase({ [field]: val })} 
                onImageUpload={(e, type) => { /* Logique identique gérée dans le composant fils ou passée ici */ }}
                onSave={() => {}}
                userSettings={userSettings}
            />
        )}

        {activeTab === 'menu' && (
            <ChefMenu 
                restaurant={restaurant} 
                onUpdateMenu={(newMenu) => saveToFirebase({ menu: newMenu })}
                onUpdateMenuImage={(menuImage) => saveToFirebase({ menuImage: menuImage })}
            />
        )}

        {activeTab === 'orders' && (
            <ChefOrders orders={orders} onUpdateStatus={handleUpdateStatus} />
        )}

        {activeTab === 'messages' && (
            <div className="p-6 max-w-6xl mx-auto h-full">
                <ChefMessages restaurantId={user.uid} />
            </div>
        )}

        {activeTab === 'stats' && (
            <div className="p-6 max-w-5xl mx-auto flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="font-bold text-2xl text-gray-800 dark:text-gray-100">{t('performance')}</h2>
                    
                    {/* Filtres de période */}
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setStatsPeriod('hour')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${statsPeriod === 'hour' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Heure</button>
                        <button onClick={() => setStatsPeriod('day')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${statsPeriod === 'day' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Jour</button>
                        <button onClick={() => setStatsPeriod('week')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${statsPeriod === 'week' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Semaine</button>
                        <button onClick={() => setStatsPeriod('month')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${statsPeriod === 'month' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Mois</button>
                        <button onClick={() => setStatsPeriod('year')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${statsPeriod === 'year' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Année</button>
                    </div>
                </div>
                
                {/* Message si pas de données */}
                {stats.totalOrders === 0 ? (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-2xl p-8 text-center">
                        <TrendingUp size={48} className="mx-auto mb-4 text-orange-400" />
                        <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">Pas encore de statistiques</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Les statistiques apparaîtront après vos premières commandes complétées.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="text-gray-400 dark:text-gray-400 text-sm font-medium mb-2">{t('revenue')}</div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalRevenue.toFixed(0)} DH</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.periodLabel}</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="text-gray-400 dark:text-gray-400 text-sm font-medium mb-2">{t('orders')}</div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalOrders}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {stats.totalOrders > 0 ? `Moyenne: ${(stats.totalRevenue / stats.totalOrders).toFixed(0)} DH` : stats.periodLabel}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="text-gray-400 dark:text-gray-400 text-sm font-medium mb-2">{t('popular')}</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{stats.popularDish}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.periodLabel}</div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Ventes - {stats.periodLabel}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Évolution des ventes sur la période</p>
                            {stats.chartData.every(d => d.sales === 0) ? (
                                <div className="flex items-center justify-center h-64 text-gray-400">
                                    <div className="text-center">
                                        <TrendingUp size={48} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">Aucune vente dans les dernières heures</p>
                                    </div>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={stats.chartData}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#9ca3af' : '#9ca3af'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#9ca3af' : '#9ca3af'}} />
                                        <Tooltip 
                                            cursor={{fill: isDarkMode ? '#374151' : '#f9fafb'}} 
                                            contentStyle={{
                                                borderRadius: '12px', 
                                                border: 'none', 
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                                                color: isDarkMode ? '#f3f4f6' : '#111827'
                                            }}
                                            formatter={(value: any) => [`${value} DH`, 'Ventes']}
                                        />
                                        <Bar dataKey="sales" fill="#f97316" radius={[4, 4, 0, 0]}>
                                            {stats.chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#f97316' : '#fdba74'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </>
                )}
            </div>
        )}

      </div>
    </div>
  );
};