import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Restaurant, Cart, OrderItem, MenuItem, Location, Order, ChatMessage, Review } from '../types';
import { MapComponent, MapBounds } from './MapComponent';
import { RestaurantList } from './client/RestaurantList';
import { RestaurantDetail } from './client/RestaurantDetail';
import { CartModal } from './client/CartModal';
import { ProfileModal } from './client/ProfileModal';
import { ClientMessages } from './client/ClientMessages';
import { RatingModal } from './RatingModal';
import { 
    ArrowLeft, ShoppingCart, Receipt, MessageCircle, Send, Bell, History, CheckCircle, Loader2,
    Search, Crosshair, List, SlidersHorizontal, ChevronDown, X, Globe, Settings, Sun, Moon, User as UserIcon
} from 'lucide-react';
import { useI18n } from '../i18n';
import LanguageSelector from './LanguageSelector';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, query, where, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { ChatbotWidget } from './client/ChatbotWidget';
import { notificationService } from '../services/notifications';

interface ClientAppProps {
  user: User;
  onLogout: () => void;
  userSettings?: {
    lang: 'fr' | 'en' | 'ar';
    theme: 'light' | 'dark';
    setLang: (lang: 'fr' | 'en' | 'ar') => void;
    setTheme: (theme: 'light' | 'dark') => void;
  };
}

// --- UTILITAIRES ---
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg: number) { return deg * (Math.PI / 180); }

const OrderStatusStepper = ({ status }: { status: string }) => {
    const { t } = useI18n();
    const steps = ['pending', 'preparing', 'ready', 'completed'];
    const currentStep = steps.indexOf(status);
    const labels: any = { pending: t('status_pending'), preparing: t('status_preparing'), ready: t('status_ready'), completed: t('status_completed') };
    return (
        <div className="w-full py-3">
            <div className="flex justify-between mb-2 relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 rounded"></div>
                <div className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 rounded transition-all duration-500" style={{width: `${(currentStep / 3) * 100}%`}}></div>
                {steps.map((s, idx) => (
                    <div key={s} className={`flex flex-col items-center transition-all duration-300 ${idx <= currentStep ? 'scale-110' : 'opacity-50'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${idx <= currentStep ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300'}`}>{idx <= currentStep && <CheckCircle size={12} />}</div>
                    </div>
                ))}
            </div>
            <div className="text-center font-bold text-green-700 text-sm uppercase tracking-wide animate-pulse">{labels[status] || status}</div>
        </div>
    );
};

// Composant de compte à rebours en temps réel
const DeliveryCountdown = ({ estimatedArrivalTime, deliveryDistance }: { estimatedArrivalTime: number, deliveryDistance?: number }) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    
    useEffect(() => {
        const updateCountdown = () => {
            const now = Date.now();
            const remaining = Math.max(0, estimatedArrivalTime - now);
            setTimeLeft(remaining);
        };
        
        // Mise à jour immédiate
        updateCountdown();
        
        // Mise à jour toutes les secondes
        const interval = setInterval(updateCountdown, 1000);
        
        return () => clearInterval(interval);
    }, [estimatedArrivalTime]);
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    // Si le temps est écoulé
    if (timeLeft === 0) {
        return (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-700">
                <div className="flex items-center justify-center gap-2">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="text-white" size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">✅ Arrivée imminente</p>
                        <p className="text-lg font-extrabold text-green-900 dark:text-green-200">Votre commande arrive!</p>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">🚀 En route vers vous</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-blue-900 dark:text-blue-200 tabular-nums">{minutes}</span>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">min</span>
                            <span className="text-2xl font-extrabold text-blue-900 dark:text-blue-200 tabular-nums">{seconds.toString().padStart(2, '0')}</span>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">sec</span>
                        </div>
                    </div>
                </div>
                {deliveryDistance && (
                    <div className="text-right">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Distance</p>
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-200">{deliveryDistance} km</p>
                    </div>
                )}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                Arrivée prévue: {new Date(estimatedArrivalTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    );
};

// Données et fonctions utilitaires inchangées
const PARTNER_RESTAURANT: Restaurant = { id: 'partner-1', ownerId: 'owner-1', name: 'Le Gourmet GeoResto', description: 'Cuisine gastronomique.', category: 'restaurant', source: 'firebase', location: { lat: 48.8584, lng: 2.2945 }, phone: '+33 1 23 45 67 89', openingHours: '11:00 - 23:00', delivery: true, coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', profileImage: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf', menu: [{ id: 'p1', name: 'Burger Signature', price: 65, category: 'Mains', description: 'Black Angus', image: '' }] };
const generateMockMenu = (name: string, type: string): MenuItem[] => { const items: MenuItem[] = []; const makeItem = (n: string, p: number) => ({ id: `m-${Math.random()}`, name: n, price: p, category: 'Mains', description: 'Délicieux', image: '' }); const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min); if (name.includes('pizza')) items.push(makeItem('Pizza Margherita', r(30, 50))); return items; };
// Nouvelle fonction pour charger les restaurants dans une zone (bounds)
const fetchRestaurantsInBounds = async (bounds: MapBounds): Promise<Restaurant[]> => {
  try {
    // Utiliser viewbox de Nominatim avec les bounds exacts de la carte
    const viewbox = `${bounds.west},${bounds.north},${bounds.east},${bounds.south}`;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=restaurant&bounded=1&viewbox=${viewbox}&limit=100`);
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn('Nominatim returned non-array data:', data);
      return [];
    }
    
    const restaurants: Restaurant[] = data
      .filter((place: any) => place && place.name && place.name.trim())
      .map((place: any) => ({
        id: place.osm_id ? `osm-${place.osm_id}` : `osm-${place.name}-${Math.random()}`,
        ownerId: 'osm',
        name: place.name.trim(),
        description: place.type ? `Type : ${place.type}` : (place.address ? place.address.road || place.address.city : 'Restaurant'),
        category: 'restaurant' as const,
        source: 'osm' as const,
        location: { lat: parseFloat(place.lat), lng: parseFloat(place.lon) },
        phone: '',
        openingHours: '',
        delivery: false,
        menu: [],
        coverImage: '',
        profileImage: ''
      }));
    
    console.log(`✅ Nominatim trouvé ${restaurants.length} restaurants dans la zone visible`);
    return restaurants;
  } catch (error) {
    console.error('❌ Erreur fetchRestaurantsInBounds:', error);
    return [];
  }
};

// Ancienne fonction pour compatibilité (fallback)
const fetchNearbyPlaces = async (lat: number, lng: number, radius: number = 5000): Promise<Restaurant[]> => { 
  try { 
    // Essayer d'abord avec une recherche par rayon
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=restaurant&lat=${lat}&lon=${lng}&bounded=1&viewbox=${lng-0.1},${lat+0.1},${lng+0.1},${lat-0.1}&limit=50`); 
    const data = await response.json(); 
    
    if (!Array.isArray(data)) {
      console.warn('Nominatim retourned non-array data:', data);
      return generateFallbackRestaurants(lat, lng);
    }
    
    const restaurants: Restaurant[] = data
      .filter((place: any) => place && place.name && place.name.trim())
      .map((place: any) => ({
        id: place.osm_id ? `osm-${place.osm_id}` : `osm-${place.name}-${Math.random()}`,
        ownerId: 'osm',
        name: place.name.trim(),
        description: place.type ? `Type : ${place.type}` : (place.address ? place.address.road || place.address.city : 'Restaurant'),
        category: 'restaurant' as const,
        source: 'osm' as const,
        location: { lat: parseFloat(place.lat), lng: parseFloat(place.lon) },
        phone: '',
        openingHours: '',
        delivery: false,
        menu: [],
        coverImage: '',
        profileImage: ''
      }));
    
    if (restaurants.length === 0) {
      console.log('Aucun restaurant trouvé par Nominatim, utilisation de fallback');
      return generateFallbackRestaurants(lat, lng);
    }
    
    console.log(`✅ Nominatim trouvé ${restaurants.length} restaurants à ${lat},${lng}`);
    return restaurants;
  } catch (error) { 
    console.error('❌ Erreur fetchNearbyPlaces:', error); 
    return generateFallbackRestaurants(lat, lng);
  } 
};

// Restaurants de secours pour tester si aucune API ne répond
const generateFallbackRestaurants = (lat: number, lng: number): Restaurant[] => {
  const fallbacks = [
    { name: '🍕 Pizza & Co', offset: { lat: 0.005, lng: 0.005 } },
    { name: '🍔 Burger King', offset: { lat: -0.005, lng: 0.005 } },
    { name: '🍜 Pho Saigon', offset: { lat: 0.005, lng: -0.005 } },
    { name: '🥙 Kebab House', offset: { lat: -0.005, lng: -0.005 } },
  ];
  
  return fallbacks.map((rest, idx): Restaurant => ({
    id: `fallback-${idx}`,
    ownerId: 'osm',
    name: rest.name,
    description: 'Restaurant local',
    category: 'restaurant',
    source: 'osm',
    location: { lat: lat + rest.offset.lat, lng: lng + rest.offset.lng },
    phone: '',
    openingHours: '',
    delivery: false,
    menu: [],
    coverImage: '',
    profileImage: ''
  }));
};

// CONSTANTES FILTRES
const RESTAURANT_TYPES = [ { label: "Tout", value: "all" }, { label: "Resto", value: "restaurant" }, { label: "Snack", value: "fast_food" }, { label: "Café", value: "cafe" } ];
const DISH_TYPES = [ { label: "Tous", value: "all" }, { label: "🍕 Pizza", value: "pizza" }, { label: "🌮 Tacos", value: "tacos" }, { label: "🍔 Burger", value: "burger" } ];
const SORT_OPTIONS = [ { label: "📍 Proche", value: "distance" }, { label: "💰 - Cher", value: "price_asc" }, { label: "⭐ Meilleur rating", value: "rating_desc" }, { label: "⭐ Rating faible", value: "rating_asc" } ];

export const ClientApp: React.FC<ClientAppProps> = ({ user, onLogout, userSettings }) => {
    // Restaurer l'état depuis localStorage au chargement
    const [view, setView] = useState<'map' | 'details' | 'orders' | 'messages'>(() => {
        try {
            const saved = localStorage.getItem('clientApp_view');
            return (saved as 'map' | 'details' | 'orders' | 'messages') || 'map';
        } catch { return 'map'; }
    });
    
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(() => {
        try {
            const saved = localStorage.getItem('clientApp_selectedRestaurant');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    
    const [viewHistory, setViewHistory] = useState<Array<{view: 'map' | 'details' | 'orders' | 'messages', restaurant?: Restaurant | null}>>(() => {
        try {
            const saved = localStorage.getItem('clientApp_viewHistory');
            return saved ? JSON.parse(saved) : [{view: 'map'}];
        } catch { return [{view: 'map'}]; }
    });
    
    // Gérer le bouton retour du navigateur/téléphone
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            event.preventDefault();
            
            // Si on a un historique, revenir à l'étape précédente
            if (viewHistory.length > 1) {
                const newHistory = [...viewHistory];
                newHistory.pop(); // Retirer l'état actuel
                const previousState = newHistory[newHistory.length - 1];
                
                setViewHistory(newHistory);
                setView(previousState.view);
                setSelectedRestaurant(previousState.restaurant || null);
                
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
    }, [viewHistory, onLogout]);
    
    // Ajouter un état dans l'historique du navigateur au montage
    useEffect(() => {
        window.history.pushState(null, '', window.location.href);
    }, []);
    
    // Sauvegarder l'état dans localStorage à chaque changement
    useEffect(() => {
        try {
            localStorage.setItem('clientApp_view', view);
            localStorage.setItem('clientApp_selectedRestaurant', JSON.stringify(selectedRestaurant));
            localStorage.setItem('clientApp_viewHistory', JSON.stringify(viewHistory));
        } catch {}
    }, [view, selectedRestaurant, viewHistory]);
    
    // Fonction helper pour changer de vue avec historique
    const navigateToView = (newView: 'map' | 'details' | 'orders' | 'messages', restaurant?: Restaurant | null) => {
        console.log('🧭 navigateToView appelé:', newView, restaurant?.name || 'null');
        setView(newView);
        setSelectedRestaurant(restaurant || null);
        setViewHistory(prev => [...prev, {view: newView, restaurant}]);
        window.history.pushState(null, '', window.location.href);
    };
    const [mapCenter, setMapCenter] = useState<Location>({ lat: 48.8566, lng: 2.3522 });
    const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
    const [myGpsLocation, setMyGpsLocation] = useState<Location | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([PARTNER_RESTAURANT]);
    const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
    const [cart, setCart] = useState<Cart>({});
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [notification, setNotification] = useState<string | null>(null);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0); 
    const [activeOrderChat, setActiveOrderChat] = useState<Order | null>(null);
    const [chatMessage, setChatMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    // Ref for MapComponent to control zoom
    const mapRef = useRef<any>(null);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [routeCoords, setRouteCoords] = useState<Location[] | null>(null);
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
    const [showLangSelector, setShowLangSelector] = useState(false);
    const [showClientMenu, setShowClientMenu] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<User>(user);
    
    // Charger les données utilisateur depuis Firestore
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setCurrentUser({
                        ...user,
                        name: userData.name || userData.displayName || user.displayName,
                        phone: userData.phone || '',
                        email: userData.email || user.email,
                        address: userData.address || ''
                    });
                }
            } catch (error) {
                console.error('Erreur chargement données utilisateur:', error);
            }
        };
        
        if (user.uid) {
            loadUserData();
        }
    }, [user.uid]);
    
    // Utiliser les paramètres utilisateur indépendants (passés via props) ou fallback au localStorage
    const [localTheme, setLocalTheme] = useState<'light' | 'dark'>(() => {
        if (userSettings) return userSettings.theme;
        try { return (localStorage.getItem('client_theme') as 'light' | 'dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch { return 'light'; }
    });
    
    const theme = userSettings?.theme ?? localTheme;
    const setTheme = (t: 'light' | 'dark') => {
        if (userSettings) {
            userSettings.setTheme(t);
        } else {
            setLocalTheme(t);
            try { localStorage.setItem('client_theme', t); } catch {}
        }
    };
    
    // Apply theme class to document
    useEffect(() => {
        try {
            if (theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
            if (!userSettings) localStorage.setItem('client_theme', theme);
        } catch {}
    }, [theme, userSettings]);
    const { t } = useI18n();
    
    const [showMobileList, setShowMobileList] = useState(false);
    // Etats Filtres
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterType, setFilterType] = useState("all");
    const [filterDish, setFilterDish] = useState("all");
    const [sortOption, setSortOption] = useState("distance");
    const [minRating, setMinRating] = useState(0);
    const [priceSort, setPriceSort] = useState("all"); // "all", "price_asc", "price_desc"
    
    // État pour le modal de rating
    const [orderToRate, setOrderToRate] = useState<Order | null>(null);

    // Effets de chargement - Charger les restaurants dans la zone visible
    useEffect(() => { 
        const loadPlaces = async () => { 
            // Ne charger que si on a les bounds de la carte
            if (!mapBounds) return;
            
            setIsLoadingRestaurants(true); 
            try { 
                // Charger restaurants Firebase (tous)
                const querySnapshot = await getDocs(collection(db, "restaurants")); 
                const firebaseRestos = querySnapshot.docs
                  .map(doc => ({ id: doc.id, ...doc.data(), source: 'firebase' } as Restaurant))
                  .filter(r => r.name && r.name.trim()); // Filtrer les restaurants sans nom
                console.log(`✅ Firebase: ${firebaseRestos.length} restaurants`);
                
                // Charger restaurants OSM/Nominatim dans la zone visible
                const osmPlaces = await fetchRestaurantsInBounds(mapBounds);
                console.log(`✅ OSM: ${osmPlaces.length} restaurants dans la zone`);
                
                // Combiner et dédupliquer par nom
                const combined = [...firebaseRestos, ...osmPlaces];
                const uniqueByName = Array.from(
                  new Map(
                    combined
                      .filter(r => r.name && r.name.trim()) // Filtrer les restaurants sans nom
                      .map(r => [r.name.toLowerCase().trim(), r])
                  ).values()
                );
                
                setRestaurants(uniqueByName); 
                console.log(`✅ Total unique restaurants: ${uniqueByName.length}`);
            } catch (e) { 
                console.error('❌ Erreur loadPlaces:', e);
            } 
            setIsLoadingRestaurants(false); 
        }; 
        
        // Debounce pour éviter trop de requêtes quand on déplace la carte
        const timeoutId = setTimeout(loadPlaces, 800); 
        return () => clearTimeout(timeoutId);
    }, [mapBounds]);
    
    // Détecter les paramètres de partage/QR code dans l'URL au chargement
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const restaurantId = urlParams.get('restaurant');
        const tableNumber = urlParams.get('table');
        
        // Vérifier aussi le localStorage pour les liens de partage
        let pendingRestaurantId = restaurantId;
        if (!pendingRestaurantId) {
            try {
                pendingRestaurantId = localStorage.getItem('pending_restaurant_id');
            } catch {}
        }
        
        console.log('🔍 Détection lien:', { restaurantId: pendingRestaurantId, tableNumber, restaurantsCount: restaurants.length });
        
        if (pendingRestaurantId && restaurants.length > 0) {
            // Chercher le restaurant dans la liste
            const restaurant = restaurants.find(r => r.id === pendingRestaurantId);
            console.log('🍽️ Restaurant trouvé:', restaurant?.name || 'NON TROUVÉ');
            
            if (restaurant) {
                // Ouvrir directement le profil du restaurant
                console.log('✅ Ouverture du profil restaurant');
                setSelectedRestaurant(restaurant);
                setView('details');
                setViewHistory([{view: 'map'}, {view: 'details', restaurant}]);
                setSelectedMarkerId(restaurant.id);
                
                // Nettoyer l'URL et le localStorage après un court délai
                setTimeout(() => {
                    window.history.replaceState({}, '', '/');
                    try {
                        localStorage.removeItem('pending_restaurant_id');
                    } catch {}
                }, 500);
            } else {
                console.warn('❌ Restaurant non trouvé avec ID:', pendingRestaurantId);
            }
        }
    }, [restaurants]);
    
    // Écouter les commandes avec notifications
    useEffect(() => { 
        if (!user.uid) return;
        
        // Demander la permission de notifications au premier chargement
        notificationService.requestPermission();
        
        let previousOrders: Order[] = [];
        
        const q = query(collection(db, "orders"), where("clientId", "==", user.uid)); 
        const unsubscribe = onSnapshot(q, (snapshot) => { 
            const liveOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
            
            // Détecter les changements pour les notifications
            liveOrders.forEach(newOrder => {
                const oldOrder = previousOrders.find(o => o.id === newOrder.id);
                const restaurant = restaurants.find(r => r.id === newOrder.restaurantId);
                const restaurantName = restaurant?.name || 'Restaurant';
                
                // Nouveau changement de statut
                if (oldOrder && oldOrder.status !== newOrder.status) {
                    notificationService.notifyOrderStatusChange(
                        restaurantName, 
                        newOrder.status,
                        newOrder.estimatedArrivalTime ? newOrder.estimatedArrivalTime - Date.now() : undefined
                    );
                    
                    // Démarrer le compte à rebours si la commande est en route
                    if (newOrder.status === 'ready' && newOrder.estimatedArrivalTime) {
                        notificationService.startDeliveryCountdown(restaurantName, newOrder.estimatedArrivalTime);
                    }
                }
                
                // Nouveau message du restaurant
                if (oldOrder && newOrder.chat.length > oldOrder.chat.length) {
                    const lastMessage = newOrder.chat[newOrder.chat.length - 1];
                    if (lastMessage.sender === 'chef') {
                        notificationService.notifyNewMessage(restaurantName, lastMessage.text);
                    }
                }
            });
            
            previousOrders = liveOrders;
            setMyOrders(liveOrders.sort((a, b) => b.timestamp - a.timestamp));
            
            // Compter les messages non lus dans les commandes
            const unreadFromOrders = liveOrders.reduce((count, order) => {
                return count + (order.chat?.filter((msg: any) => msg.sender === 'chef' && !msg.read).length || 0);
            }, 0);
            setUnreadMessagesCount(unreadFromOrders);
        }); 
        
        return () => unsubscribe(); 
    }, [user.uid, restaurants]);
    
    // Écouter les conversations directes pour les notifications
    useEffect(() => {
        if (!user.uid) return;
        
        let previousConversations = new Map<string, any>();
        
        const q = query(
            collection(db, 'conversations'),
            where('clientId', '==', user.uid)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let unreadFromConversations = 0;
            
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const messages = data.messages || [];
                const previous = previousConversations.get(doc.id);
                
                // Compter les messages non lus
                unreadFromConversations += messages.filter((msg: any) => msg.sender === 'chef' && !msg.read).length;
                
                // Détecter les nouveaux messages du restaurant
                if (previous && messages.length > previous.messages.length) {
                    const newMessages = messages.slice(previous.messages.length);
                    newMessages.forEach((msg: any) => {
                        if (msg.sender === 'chef') {
                            const restaurant = restaurants.find(r => r.id === data.restaurantId);
                            const restaurantName = restaurant?.name || 'Restaurant';
                            notificationService.notifyNewMessage(restaurantName, msg.text);
                        }
                    });
                }
                
                previousConversations.set(doc.id, { messages });
            });
            
            // Mettre à jour le compteur total (ajouter aux messages non lus des commandes)
            setUnreadMessagesCount(prev => {
                // Récupérer uniquement les messages non lus des commandes
                const unreadFromOrders = myOrders.reduce((count, order) => {
                    return count + (order.chat?.filter((msg: any) => msg.sender === 'chef' && !msg.read).length || 0);
                }, 0);
                return unreadFromOrders + unreadFromConversations;
            });
        });
        
        return () => unsubscribe();
    }, [user.uid, restaurants, myOrders]);
    
    // Listener pour mettre à jour la conversation active en temps réel
    useEffect(() => {
        if (!activeOrderChat || activeOrderChat.tableNumber !== 'CONVERSATION') return;
        
        const conversationRef = doc(db, "conversations", activeOrderChat.id);
        const unsubscribe = onSnapshot(conversationRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setActiveOrderChat(prev => prev ? {
                    ...prev,
                    chat: data.messages || []
                } : null);
            }
        });
        
        return () => unsubscribe();
    }, [activeOrderChat?.id, activeOrderChat?.tableNumber]);

    // Logique Tri - Pour la LISTE (avec filtres)
    const sortedRestaurants = useMemo(() => {
        const refLat = myGpsLocation?.lat || mapCenter.lat;
        const refLng = myGpsLocation?.lng || mapCenter.lng;
        return restaurants.map(resto => {
                const distance = getDistanceFromLatLonInKm(refLat, refLng, resto.location.lat, resto.location.lng);
                let matchedPrice = Infinity;
                let matchedItemName = "";
                if (resto.menu && resto.menu.length > 0) {
                    if (filterDish !== "all") {
                        const items = resto.menu.filter(m => m.name.toLowerCase().includes(filterDish.toLowerCase()) || m.description.toLowerCase().includes(filterDish.toLowerCase()));
                        if (items.length > 0) { items.sort((a, b) => a.price - b.price); matchedPrice = items[0].price; matchedItemName = items[0].name; }
                    } else { const sortedMenu = [...resto.menu].sort((a, b) => a.price - b.price); matchedPrice = sortedMenu[0].price; matchedItemName = "À partir de " + sortedMenu[0].name; }
                }
                return { ...resto, distance, matchedPrice, matchedItemName };
            })
            .filter(resto => filterDish === "all" || resto.matchedPrice !== Infinity)
            .filter(resto => minRating > 0 ? (resto.rating || 0) >= minRating : true)
            .filter(resto => { if (filterType !== "all") { if (filterType === "fast_food" && (resto.category === "fast_food" || resto.name.toLowerCase().includes("snack"))) return true; return resto.category === filterType; } return true; })
            .sort((a, b) => {
                // Tri par prix (si sélectionné)
                if (priceSort === "price_asc") return a.matchedPrice - b.matchedPrice;
                if (priceSort === "price_desc") return b.matchedPrice - a.matchedPrice;
                
                // Tri par rating et distance
                if (sortOption === "rating_desc") return (b.rating || 0) - (a.rating || 0);
                if (sortOption === "rating_asc") return (a.rating || 0) - (b.rating || 0);
                if (sortOption === "price_asc") return a.matchedPrice - b.matchedPrice;
                return a.distance - b.distance;
            })
            .slice(0, 50);
    }, [restaurants, mapCenter, myGpsLocation, filterType, filterDish, sortOption, minRating, priceSort]);

    // Pour la CARTE - afficher TOUS les restaurants avec juste la distance calculée
    const restaurantsForMap = useMemo(() => {
        const refLat = myGpsLocation?.lat || mapCenter.lat;
        const refLng = myGpsLocation?.lng || mapCenter.lng;
        return restaurants.map(resto => {
            const distance = getDistanceFromLatLonInKm(refLat, refLng, resto.location.lat, resto.location.lng);
            return { ...resto, distance };
        }).slice(0, 50);
    }, [restaurants, mapCenter, myGpsLocation]);

    // Handlers
    const handleRestaurantSelect = (resto: Restaurant) => { 
        console.log('🍽️ handleRestaurantSelect appelé avec:', resto.name, resto.id);
        setSelectedMarkerId(resto.id); 
        navigateToView('details', resto); 
        setCart({}); 
        setMapCenter(resto.location); 
        setShowMobileList(false); 
    };
        const handleOpenGPS = async (location?: Location) => {
            const target = location || selectedRestaurant?.location;
            if (!target) return;

      // If we have the user's GPS location, try to fetch driving route from OSRM
      if (myGpsLocation) {
        try {
          const from = `${myGpsLocation.lng},${myGpsLocation.lat}`;
          const to = `${target.lng},${target.lat}`;
          const url = `https://router.project-osrm.org/route/v1/driving/${from};${to}?overview=full&geometries=geojson`;
          const resp = await fetch(url);
          const j = await resp.json();
          if (j && j.routes && j.routes.length > 0 && j.routes[0].geometry && j.routes[0].geometry.coordinates) {
            const coords: Location[] = j.routes[0].geometry.coordinates.map((c: any) => ({ lat: c[1], lng: c[0] }));
            const distance = j.routes[0].distance || 0; // meters
            const duration = j.routes[0].duration || 0; // seconds
            setRouteCoords(coords);
            setRouteInfo({ distance, duration });
            setMapCenter(target);
            setSelectedMarkerId(selectedRestaurant?.id || null);
            navigateToView('map');
            return;
          }
        } catch (e) {
          console.warn('OSRM routing failed, fallback to straight line', e);
        }
      }

      // Fallback: draw straight line from either user's location (if available) or just center map on target
      if (myGpsLocation) {
        setRouteCoords([myGpsLocation, target]);
        setRouteInfo(null);
        setMapCenter(target);
        setSelectedMarkerId(selectedRestaurant?.id || null);
        setView('map');
      } else {
        // No user location — just center the map on the target
        setMapCenter(target);
        setSelectedMarkerId(selectedRestaurant?.id || null);
        setView('map');
      }
    };
    const addToCart = (item: MenuItem) => setCart(prev => ({ ...prev, [item.id]: { ...item, count: (prev[item.id]?.count || 0) + 1 } }));
    const removeFromCart = (itemId: string) => setCart(prev => { const newCart = { ...prev }; if (newCart[itemId].count > 1) newCart[itemId].count--; else delete newCart[itemId]; return newCart; });
    const cartCount = useMemo(() => (Object.values(cart) as OrderItem[]).reduce((sum, item) => sum + item.count, 0), [cart]);

    const handleFinalizeOrder = async (orderData: any) => {
        if (!selectedRestaurant) return;
        const { orderType, tableNumber, deliveryCoords, deliveryInstructions } = orderData;
        const initialMessage = orderType === 'delivery' ? `🚀 LIVRAISON\n📍 GPS fourni\n📝 Note: ${deliveryInstructions}` : `🍽️ SUR PLACE\n🪑 Table ${tableNumber}`;
        const cartItems = (Object.values(cart) as OrderItem[]);
        const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.count), 0);
        // Utiliser currentUser pour nom et téléphone
        const newOrder = {
            restaurantId: selectedRestaurant.id,
            clientId: user.uid,
            clientName: currentUser.name || user.displayName || "Client",
            clientPhone: currentUser.phone || '',
            tableNumber: orderType === 'dine_in' ? (tableNumber || 'SUR PLACE') : 'LIVRAISON',
            items: cartItems.map(i => ({ id: i.id, name: i.name, price: Number(i.price), count: Number(i.count), description: i.description, category: i.category, image: i.image || '' })),
            total: Number(cartTotal),
            status: 'pending' as const,
            timestamp: Date.now(),
            deliveryLocation: (orderType === 'delivery' && deliveryCoords) ? { lat: deliveryCoords.lat, lng: deliveryCoords.lng } : null,
            chat: [{ id: 'init', sender: 'client' as const, text: initialMessage, timestamp: Date.now() }],
            paymentMethod: 'cash' as const,
            isPaid: false
        };
        try { await addDoc(collection(db, "orders"), newOrder); setIsCartOpen(false); setOrderPlaced(true); setTimeout(() => { setOrderPlaced(false); setCart({}); navigateToView('orders'); }, 2000); } catch (e: any) { alert("Erreur : " + e.message); }
    };

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        setIsSearching(true);
        try {
            // 1) Chercher d'abord localement (Firebase + OSM combinés)
            const low = q.toLowerCase();
            // Prioriser correspondance exacte, puis inclusion
            let match = restaurants.find(r => r.name && r.name.toLowerCase() === low) as Restaurant | undefined;
            if (!match) match = restaurants.find(r => r.name && r.name.toLowerCase().includes(low));

            if (match) {
                // Si trouvé localement, recentrer la map sur le resto et sélectionner son marqueur (sans ouvrir la fiche)
                setMapCenter(match.location);
                setSelectedMarkerId(match.id);
                setShowMobileList(false);
                return;
            }

            // 2) Sinon, fallback vers Nominatim (recherche géocodage)
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                setMapCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
            }
        } catch (err) {
            console.error('Erreur search:', err);
        } finally {
            setIsSearching(false);
        }
    };
    const handleLocateMe = (target: 'main' | 'delivery') => { if (!navigator.geolocation) { alert("Non supporté"); return; } navigator.geolocation.getCurrentPosition((pos) => { const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }; if (target === 'main') { setMapCenter(loc); setMyGpsLocation(loc); setSearchQuery(""); } }, () => { }); };
    const handleSendMessage = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (!chatMessage.trim() || !activeOrderChat) return; 
        
        const newMessage: ChatMessage = { 
            id: `msg-${Date.now()}`, 
            sender: 'client', 
            text: chatMessage, 
            timestamp: Date.now() 
        }; 
        
        try { 
            // Vérifier si c'est une conversation directe ou une commande
            if (activeOrderChat.tableNumber === 'CONVERSATION') {
                // C'est une conversation directe
                const conversationRef = doc(db, "conversations", activeOrderChat.id);
                await updateDoc(conversationRef, { 
                    messages: arrayUnion(newMessage),
                    lastMessageTime: Date.now()
                });
            } else {
                // C'est une commande normale
                const orderRef = doc(db, "orders", activeOrderChat.id);
                await updateDoc(orderRef, { chat: arrayUnion(newMessage) });
            }
            setChatMessage(''); 
        } catch (error) { 
            console.error(error); 
        } 
    };
    
    const handleOpenMessaging = async () => {
        if (!selectedRestaurant) return;
        
        // Chercher d'abord une commande existante avec ce restaurant
        const existingOrder = myOrders.find(order => 
            order.restaurantId === selectedRestaurant.id && 
            ['pending', 'preparing', 'ready'].includes(order.status)
        );
        
        if (existingOrder) {
            // Ouvrir le chat avec la commande existante
            setActiveOrderChat(existingOrder);
        } else {
            // Créer une conversation directe (sans commande)
            try {
                // Chercher si une conversation directe existe déjà
                const conversationsRef = collection(db, "conversations");
                const q = query(
                    conversationsRef, 
                    where("clientId", "==", user.uid),
                    where("restaurantId", "==", selectedRestaurant.id)
                );
                const snapshot = await getDocs(q);
                
                let conversationId;
                if (!snapshot.empty) {
                    // Conversation existante trouvée
                    conversationId = snapshot.docs[0].id;
                    const conversationData = snapshot.docs[0].data();
                    // Créer un objet Order-like pour réutiliser le même composant de chat
                    setActiveOrderChat({
                        id: conversationId,
                        restaurantId: selectedRestaurant.id,
                        clientId: user.uid,
                        clientName: currentUser.name || user.displayName || "Client",
                        clientPhone: currentUser.phone || '',
                        tableNumber: 'CONVERSATION',
                        items: [],
                        total: 0,
                        status: 'pending',
                        timestamp: conversationData.timestamp || Date.now(),
                        chat: conversationData.messages || [],
                        paymentMethod: 'cash',
                        isPaid: false
                    } as Order);
                } else {
                    // Créer une nouvelle conversation
                    const newConversation = {
                        restaurantId: selectedRestaurant.id,
                        clientId: user.uid,
                        clientName: currentUser.name || user.displayName || "Client",
                        clientPhone: currentUser.phone || '',
                        timestamp: Date.now(),
                        messages: [{
                            id: 'init',
                            sender: 'client' as const,
                            text: t('hello_restaurant') || '👋 Bonjour, j\'aimerais vous poser une question.',
                            timestamp: Date.now()
                        }]
                    };
                    
                    const docRef = await addDoc(conversationsRef, newConversation);
                    conversationId = docRef.id;
                    
                    // Ouvrir le chat avec la nouvelle conversation
                    setActiveOrderChat({
                        id: conversationId,
                        restaurantId: selectedRestaurant.id,
                        clientId: user.uid,
                        clientName: currentUser.name || user.displayName || "Client",
                        clientPhone: currentUser.phone || '',
                        tableNumber: 'CONVERSATION',
                        items: [],
                        total: 0,
                        status: 'pending',
                        timestamp: Date.now(),
                        chat: newConversation.messages,
                        paymentMethod: 'cash',
                        isPaid: false
                    } as Order);
                }
            } catch (error) {
                console.error('Erreur lors de l\'ouverture de la conversation:', error);
                alert(t('error_opening_conversation') || 'Erreur lors de l\'ouverture de la conversation');
            }
        }
    };
    
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeOrderChat]);
    
    const handleSubmitRating = async (review: Review) => {
        try {
            // Ajouter la review à la base de données
            await addDoc(collection(db, "reviews"), review);
            
            // Marquer la commande comme évaluée
            if (orderToRate) {
                const orderRef = doc(db, "orders", orderToRate.id);
                await updateDoc(orderRef, { rated: true });
            }
            
            // Recalculer les ratings du restaurant
            const reviewsSnapshot = await getDocs(
                query(collection(db, "reviews"), where("restaurantId", "==", review.restaurantId))
            );
            
            if (reviewsSnapshot.docs.length > 0) {
                const reviews = reviewsSnapshot.docs.map(doc => doc.data() as Review);
                const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                
                // Mettre à jour le rating du restaurant
                const restauRef = doc(db, "restaurants", review.restaurantId);
                await updateDoc(restauRef, { 
                    rating: avgRating,
                    ratingCount: reviews.length
                });
            }
            
            setOrderToRate(null);
            setNotification('Merci pour votre évaluation !');
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du rating:', error);
        }
    };
    const activeOrders = myOrders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
    const pastOrders = myOrders.filter(o => ['completed', 'cancelled'].includes(o.status));

    // Toggle Liste Mobile
    const toggleMobileList = () => {
        setShowMobileList(true);
        setIsFilterOpen(true);
    };

    // Fonction de toggle pour les filtres (qui manquait dans la version précédente)
    const handleToggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
    };

    return (
        <div className="h-dvh flex flex-col bg-gray-50 relative overflow-hidden">
            {notification && ( <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[3000] bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-slideUp"><Bell className="text-orange-500 animate-bounce" /><span className="font-bold text-sm">{notification}</span></div> )}
            {orderPlaced && <div className="absolute inset-0 z-[2000] bg-green-600 text-white flex flex-col items-center justify-center animate-fadeIn"><div className="bg-white/20 p-6 rounded-full mb-6"><CheckCircle size={64} /></div><h2 className="text-3xl font-bold mb-2">Commande Envoyée !</h2></div>}
            <header className="bg-white shadow-sm p-4 z-[9000] flex items-center justify-between sticky top-0 shrink-0">
                <div className="flex items-center gap-3">{view === 'orders' ? <button onClick={() => setView('map')} className="p-2 hover:bg-gray-100 active:scale-95 rounded-full transition-colors cursor-pointer"><ArrowLeft size={20} /></button> : view === 'messages' ? <button onClick={() => setView('map')} className="p-2 hover:bg-gray-100 active:scale-95 rounded-full transition-colors cursor-pointer"><ArrowLeft size={20} /></button> : view === 'details' ? <button onClick={() => { setView('map'); setSelectedRestaurant(null); }} className="p-2 hover:bg-gray-100 active:scale-95 rounded-full transition-colors cursor-pointer"><ArrowLeft size={20} /></button> : <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xs">GR</span></div>}<h1 className="font-bold text-gray-800 truncate max-w-[200px]">{view === 'details' && selectedRestaurant ? selectedRestaurant.name : view === 'orders' ? 'Mes Commandes' : view === 'messages' ? 'Messages' : 'À proximité'}</h1></div>
                <div className="flex items-center gap-2">
                    {/* Client menu: groups Orders/Language/Logout */}
                    <div className="relative">
                        
                        {view === 'details' && cartCount > 0 && (
                            <button onClick={() => setIsCartOpen(true)} className="relative bg-gray-900 text-white p-2.5 rounded-xl hover:bg-gray-800 active:scale-95 cursor-pointer transition-colors">
                                <ShoppingCart size={20} />
                                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{cartCount}</span>
                            </button>
                        )}

                        {/* Menu trigger (visible on map view) */}
                        {view === 'map' && (
                            <div className="relative">
                                <button onClick={() => setShowClientMenu(prev => !prev)} aria-label={t('settings')} className={`p-2 rounded-xl hover:bg-gray-100 active:scale-95 flex items-center justify-center cursor-pointer transition-colors ${showClientMenu ? 'bg-orange-50 text-orange-600' : 'text-gray-700'}`}>
                                    <Settings size={18} />
                                </button>
                                {showClientMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#071127] border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-[9999]">
                                        <button onClick={() => { setShowProfileModal(true); setShowClientMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 flex items-center gap-2 dark:text-gray-100 cursor-pointer transition-colors">
                                            <UserIcon size={16} /> <span>{t('my_profile') || 'Mon Profil'}</span>
                                        </button>
                                        <button onClick={() => { setView('orders'); setShowClientMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 flex items-center gap-2 dark:text-gray-100 cursor-pointer transition-colors">
                                            <Receipt size={16} /> <span>{t('my_orders')}</span>
                                            {myOrders.length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{myOrders.length}</span>}
                                        </button>
                                        <button onClick={() => { navigateToView('messages'); setShowClientMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 flex items-center gap-2 dark:text-gray-100 cursor-pointer transition-colors">
                                            <MessageCircle size={16} /> <span>{t('messages') || 'Messages'}</span>
                                            {unreadMessagesCount > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{unreadMessagesCount}</span>}
                                        </button>
                                        <button onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setShowClientMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 flex items-center gap-2 dark:text-gray-100 cursor-pointer transition-colors">
                                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} <span>{theme === 'dark' ? t('theme_light') : t('theme_dark')}</span>
                                        </button>
                                        <button onClick={() => { setShowLangSelector(true); setShowClientMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 flex items-center gap-2 dark:text-gray-100 cursor-pointer transition-colors"><Globe size={16} /> <span>{t('language')}</span></button>
                                        <button onClick={() => { onLogout(); setShowClientMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer transition-colors"><X size={16} /> <span>{t('logout')}</span></button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
                {view === 'map' && (
                    <>
                        {/* LISTE & FILTRES */}
                        <div className={`bg-white shadow-xl z-[2000] flex flex-col border-r border-gray-200 transition-all duration-300 md:w-96 md:relative md:flex md:translate-x-0 ${showMobileList ? 'absolute inset-0 w-full z-[2000]' : 'hidden'}`}>
                           <RestaurantList 
                                restaurants={sortedRestaurants} 
                                isLoading={isLoadingRestaurants} 
                                onSelect={handleRestaurantSelect} 
                                showMobileList={showMobileList} 
                                onCloseMobile={() => setShowMobileList(false)} 
                                isFilterOpen={isFilterOpen} 
                                onToggleFilter={handleToggleFilter} 
                                filterType={filterType} 
                                setFilterType={setFilterType} 
                                filterDish={filterDish} 
                                setFilterDish={setFilterDish} 
                                sortOption={sortOption} 
                                setSortOption={setSortOption}
                                minRating={minRating}
                                setMinRating={setMinRating}
                                priceSort={priceSort}
                                setPriceSort={setPriceSort}
                           />
                        </div>

                        <div className="flex-1 relative h-full w-full">
                            {/* BARRE DE RECHERCHE AVEC BOUTON FILTRE MOBILE - Masquée sur mobile quand la liste de filtres est ouverte */}
                            {(!showMobileList || window.innerWidth >= 768) && (
                                <div className="absolute top-4 left-4 right-4 z-[3000] flex gap-2 max-w-md mx-auto md:left-4 md:right-auto md:ml-4 md:mr-auto pointer-events-auto translate-x-2 md:translate-x-0">
                                    <form onSubmit={handleSearchSubmit} className="flex-1 relative shadow-xl rounded-xl">
                                        <input type="text" placeholder={t('search_placeholder')} className="w-full h-12 pl-11 pr-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-xl text-gray-800" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                        <div className="absolute left-3 top-3 text-gray-400">{isSearching ? <Loader2 size={20} className="animate-spin text-orange-500"/> : <Search size={20} />}</div>
                                    </form>
                                    <button onClick={() => handleLocateMe('main')} className="w-12 h-12 bg-white rounded-xl shadow-xl flex items-center justify-center text-gray-700 hover:text-orange-600 transition-colors active:scale-95"><Crosshair size={24} /></button>
                                    {/* BOUTON FILTRE VISIBLE SUR MOBILE */}
                                    <button onClick={toggleMobileList} className="md:hidden w-12 h-12 bg-orange-600 text-white rounded-xl shadow-xl flex items-center justify-center active:scale-95"><SlidersHorizontal size={20} /></button>
                                </div>
                            )}
                            {/* ZOOM BUTTONS BELOW SEARCH BAR - Hidden on mobile, visible on desktop */}
                            <div className="absolute left-4 right-4 top-20 z-[2999] hidden md:flex gap-2 max-w-md mx-auto md:left-4 md:right-auto md:ml-4 md:mr-auto pointer-events-auto justify-center">
                                <button onClick={() => mapRef.current?.zoomIn()} className="w-12 h-12 bg-white rounded-xl shadow-xl flex items-center justify-center text-gray-700 hover:text-orange-600 transition-colors active:scale-95 font-bold text-xl">+</button>
                                <button onClick={() => mapRef.current?.zoomOut()} className="w-12 h-12 bg-white rounded-xl shadow-xl flex items-center justify-center text-gray-700 hover:text-orange-600 transition-colors active:scale-95 font-bold text-xl">-</button>
                            </div>
                            {/* MapComponent with ref for zoom control */}
                            <MapComponent ref={mapRef} center={mapCenter} interactive={true} restaurants={restaurantsForMap} onRestaurantSelect={handleRestaurantSelect} onBoundsChange={setMapBounds} selectedRestoId={selectedMarkerId} userLocation={myGpsLocation} route={routeCoords} />
                        </div>
                    </>
                )}

                {console.log('🔍 État actuel - view:', view, 'selectedRestaurant:', selectedRestaurant?.name || 'null')}
                {view === 'details' && selectedRestaurant && (
                    <>
                        {console.log('🎯 Rendu RestaurantDetail pour:', selectedRestaurant.name)}
                        <RestaurantDetail restaurant={selectedRestaurant} cart={cart} onAddToCart={addToCart} onRemoveFromCart={removeFromCart} onOpenGPS={handleOpenGPS} onOpenMessaging={handleOpenMessaging} routeInfo={routeInfo} />
                    </>
                )}

                {view === 'messages' && (
                    <ClientMessages userId={user.uid} restaurants={restaurants} />
                )}

                                {view === 'orders' && (
                                        <div className="h-full w-full overflow-y-auto bg-gray-100 p-4 space-y-6">
                                                <div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-gray-800">{t('my_orders')}</h2></div>
                                                {myOrders.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                                        <Receipt size={48} className="mb-4 opacity-50"/>
                                                        <p>{t('no_orders')}</p>
                                                        <button onClick={() => setView('map')} className="mt-4 text-orange-600 font-bold">{t('find_restaurant')}</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {activeOrders.length > 0 && (
                                                            <div>
                                                                <h3 className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> {t('in_progress')}</h3>
                                                                <div className="space-y-4">
                                                                    {activeOrders.map(order => (
                                                                        <div key={order.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200 relative overflow-hidden">
                                                                            <div className="flex justify-between items-start mb-4">
                                                                                <div>
                                                                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Commande #{order.id.slice(0, 6)}</div>
                                                                                    <h3 className="font-bold text-gray-900 text-lg">{restaurants.find(r => r.id === order.restaurantId)?.name || 'Restaurant'}</h3>
                                                                                    <p className="text-sm text-gray-500">{new Date(order.timestamp).toLocaleTimeString()}</p>
                                                                                </div>
                                                                                <div className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</div>
                                                                            </div>
                                                                            <OrderStatusStepper status={order.status} />
                                                                            
                                                                            {/* Compte à rebours de livraison - Uniquement quand en route */}
                                                                            {order.status === 'ready' && order.deliveryLocation && order.estimatedArrivalTime && (
                                                                                <DeliveryCountdown 
                                                                                    estimatedArrivalTime={order.estimatedArrivalTime} 
                                                                                    deliveryDistance={order.deliveryDistance}
                                                                                />
                                                                            )}
                                                                            
                                                                            <div className="border-t border-b border-gray-100 py-3 mb-4 space-y-2">
                                                                                {order.items.map((item, idx) => (
                                                                                    <div key={idx} className="flex justify-between text-sm"><span className="text-gray-600">{item.count}x {item.name}</span><span className="font-medium">{item.price * item.count} DH</span></div>
                                                                                ))}
                                                                                <div className="flex justify-between font-bold pt-2"><span>{t('total')}</span><span>{order.total} DH</span></div>
                                                                            </div>
                                                                            <button onClick={() => setActiveOrderChat(order)} className="w-full py-3 bg-orange-50 text-orange-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors"><MessageCircle size={18} /> {t('chat_with_restaurant')}</button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {pastOrders.length > 0 && (
                                                            <div className="pt-4">
                                                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><History size={14}/> {t('history')}</h3>
                                                                <div className="space-y-4 opacity-75 hover:opacity-100 transition-opacity">
                                                                    {pastOrders.map(order => (
                                                                        <div key={order.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <h3 className="font-bold text-gray-700">{restaurants.find(r => r.id === order.restaurantId)?.name || 'Restaurant'}</h3>
                                                                                <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded">{order.status === 'completed' ? t('delivered') : t('cancelled')}</span>
                                                                            </div>
                                                                            <p className="text-xs text-gray-500 mb-2">{new Date(order.timestamp).toLocaleDateString()} à {new Date(order.timestamp).toLocaleTimeString()}</p>
                                                                            <div className="text-sm font-medium text-gray-900 mb-3">{t('total')}: {order.total} DH</div>
                                                                            {!order.rated && order.status === 'completed' && <button onClick={() => setOrderToRate(order)} className="w-full py-2 text-xs bg-orange-50 text-orange-600 rounded-lg font-bold hover:bg-orange-100 transition-colors">{t('rate_restaurant')}</button>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                        </div>
                                )}

                {isCartOpen && (<CartModal cart={cart} onClose={() => setIsCartOpen(false)} onAddToCart={addToCart} onRemoveFromCart={removeFromCart} onFinalizeOrder={handleFinalizeOrder} defaultLocation={mapCenter} onLocateMe={() => handleLocateMe('delivery')} userLocation={myGpsLocation} />)}
                {activeOrderChat && (<div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white rounded-2xl w-full max-w-md h-[80vh] flex flex-col shadow-2xl overflow-hidden"><div className="bg-gray-50 p-4 border-b flex justify-between items-center"><div><h3 className="font-bold text-gray-800">{t('restaurant_label')}</h3><p className="text-xs text-gray-500">Commande #{activeOrderChat.id.slice(-4)}</p></div><button onClick={() => setActiveOrderChat(null)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button></div><div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">{activeOrderChat.chat.map(msg => (<div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'client' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>{msg.text}</div></div>))}<div ref={chatEndRef} /></div><form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2"><input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder={t('write_message')} className="flex-1 bg-gray-100 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500" /><button type="submit" disabled={!chatMessage.trim()} className="p-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700"><Send size={18} /></button></form></div></div>)}
                {orderToRate && <RatingModal order={orderToRate} restaurantName={restaurants.find(r => r.id === orderToRate.restaurantId)?.name || 'Restaurant'} onSubmit={handleSubmitRating} onClose={() => setOrderToRate(null)} />}
                {showLangSelector && <LanguageSelector onClose={() => setShowLangSelector(false)} />}
                <ProfileModal user={currentUser} isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} onSave={(updatedUser) => setCurrentUser(updatedUser)} />
            </div>
            <ChatbotWidget restaurants={restaurants} />
        </div>
    );
};