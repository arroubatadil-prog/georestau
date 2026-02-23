import React, { useMemo, useState } from 'react';
import { Restaurant, MenuItem, Cart } from '../../types';
import { Store, Clock, Phone, Bike, X, Plus, Minus, Navigation as NavIcon, ShoppingBag, MessageCircle, Share2, Copy, Check, Facebook, Instagram } from 'lucide-react';
import { useI18n } from '../../i18n';

interface RestaurantDetailProps {
  restaurant: Restaurant;
  cart: Cart;
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (itemId: string) => void;
  onOpenGPS: (location?: any) => void;
  onOpenMessaging?: () => void;
  routeInfo?: { distance: number; duration: number } | null;
}

export const RestaurantDetail: React.FC<RestaurantDetailProps> = ({
  restaurant,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onOpenGPS,
  onOpenMessaging,
  routeInfo
}) => {
  // État pour savoir quel plat est ouvert en grand (Le détail)
  const { t } = useI18n();
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [showNavModal, setShowNavModal] = useState(false);
  const [showPhoneMenu, setShowPhoneMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFullMenu, setShowFullMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fonctions de partage
  const getProfileLink = () => {
    return `${window.location.origin}/?restaurant=${restaurant.id}`;
  };

  const getShareText = () => {
    return `Découvrez ${restaurant.name} sur GeoResto ! 🍽️\n${restaurant.description}\n\n${getProfileLink()}`;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getProfileLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
    }
  };

  // Partage natif (utilise l'API Web Share si disponible)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${restaurant.name} - GeoResto`,
          text: `Découvrez ${restaurant.name} sur GeoResto ! 🍽️`,
          url: getProfileLink()
        });
        setShowShareModal(false);
      } catch (error) {
        console.log('Partage annulé ou erreur:', error);
      }
    }
  };

  const shareWhatsApp = () => {
    const text = getShareText();
    // Sur mobile, ouvre l'app WhatsApp directement
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
    } else {
      // Sur desktop, ouvre WhatsApp Web
      window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
    setShowShareModal(false);
  };

  const shareFacebookMessenger = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
      // Sur mobile avec Web Share API, utilise le partage natif
      try {
        await navigator.share({
          title: `${restaurant.name} - GeoResto`,
          text: `Découvrez ${restaurant.name} sur GeoResto ! 🍽️\n${restaurant.description}`,
          url: getProfileLink()
        });
        setShowShareModal(false);
        return;
      } catch (error) {
        console.log('Partage annulé:', error);
      }
    }
    
    // Fallback: copie le lien et ouvre Messenger
    copyLink();
    if (isMobile) {
      alert('📋 Lien copié ! Ouvrez Messenger et collez le lien dans une conversation.');
    } else {
      window.open('https://www.messenger.com/', '_blank');
      setTimeout(() => {
        alert('💬 Lien copié ! Messenger s\'ouvre dans un nouvel onglet.\nCollez le lien dans une conversation.');
      }, 500);
    }
    setShowShareModal(false);
  };

  const shareInstagram = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
      // Sur mobile avec Web Share API, utilise le partage natif
      try {
        await navigator.share({
          title: `${restaurant.name} - GeoResto`,
          text: `Découvrez ${restaurant.name} sur GeoResto ! 🍽️\n${restaurant.description}`,
          url: getProfileLink()
        });
        setShowShareModal(false);
        return;
      } catch (error) {
        console.log('Partage annulé:', error);
      }
    }
    
    // Fallback: copie le lien
    copyLink();
    if (isMobile) {
      alert('📋 Lien copié ! Ouvrez Instagram et collez le lien dans un message Direct.');
    } else {
      alert('📋 Lien copié ! Ouvrez Instagram sur votre téléphone et collez le lien dans un message Direct.');
    }
    setShowShareModal(false);
  };
  
  // Fermer le menu téléphone quand on clique ailleurs
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (showPhoneMenu) setShowPhoneMenu(false);
    };
    if (showPhoneMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showPhoneMenu]);

  const menuByCategory = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    if (restaurant.menu && Array.isArray(restaurant.menu)) {
        restaurant.menu.forEach((item: MenuItem) => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
        });
    }
    return groups;
  }, [restaurant]);

  return (
    <div className="h-full w-full overflow-y-auto pb-24 animate-fadeIn bg-white relative">
      
      {/* --- MODAL CHOIX NAVIGATION --- */}
      {showNavModal && (
        <div className="fixed inset-0 z-[2500] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white w-full sm:w-[400px] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col animate-slideUp">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{t('show_navigation_options')}</h3>
            </div>
            <div className="p-6 space-y-3">
              <button 
                onClick={() => {
                  setShowNavModal(false);
                  onOpenGPS(restaurant.location);
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <NavIcon size={20} />
                {t('view_on_app_map')}
              </button>
              <button 
                onClick={() => {
                  setShowNavModal(false);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`, '_blank');
                }}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <NavIcon size={20} />
                {t('open_google_maps')}
              </button>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button 
                onClick={() => setShowNavModal(false)}
                className="w-full py-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- MODALE DÉTAIL DU PLAT (Ce que vous avez demandé) --- */}
      {selectedDish && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-0 sm:p-4">
          <div className="bg-white w-full sm:w-[450px] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-slideUp relative">
            
            {/* Bouton Fermer */}
            <button 
              onClick={() => setSelectedDish(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            {/* Grande Image */}
            <div className="h-64 w-full bg-gray-100 relative shrink-0">
              <img 
                src={selectedDish.image || 'https://via.placeholder.com/400x300?text=Plat'} 
                className="w-full h-full object-cover" 
                alt={selectedDish.name}
              />
            </div>

            {/* Infos du plat */}
            <div className="p-6 flex-1 overflow-y-auto">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{selectedDish.name}</h2>
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
                  {selectedDish.category}
              </span>
              <p className="text-gray-600 text-base leading-relaxed">
                {selectedDish.description || t('no_description')}
              </p>
            </div>

            {/* Pied de page : Prix + Bouton Ajouter */}
            <div className="p-6 border-t border-gray-100 bg-white">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-medium uppercase">{t('price')}</span>
                        <span className="text-3xl font-extrabold text-gray-900">{selectedDish.price} <span className="text-base font-normal text-gray-500">DH</span></span>
                    </div>

                    <div className="flex-1">
                        {cart[selectedDish.id] ? (
                            <div className="flex items-center justify-between bg-gray-100 rounded-xl p-2 h-14">
                                <button onClick={() => onRemoveFromCart(selectedDish.id)} className="w-10 h-full bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-700"><Minus size={20}/></button>
                                <span className="font-bold text-xl">{cart[selectedDish.id].count}</span>
                                <button onClick={() => onAddToCart(selectedDish)} className="w-10 h-full bg-gray-900 text-white rounded-lg shadow-sm flex items-center justify-center"><Plus size={20}/></button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => onAddToCart(selectedDish)}
                                className="w-full h-14 bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                            >
                                <ShoppingBag size={20} /> {t('add_to_cart')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PROFIL RESTAURANT --- */}
      {restaurant.source === 'firebase' ? (
        <div className="relative mb-16">
          <div className="h-56 w-full bg-gray-200"><img src={restaurant.coverImage} className="w-full h-full object-cover" alt="Cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Cover')} /></div>
          <div className="absolute -bottom-12 left-6 p-1 bg-white rounded-full shadow-lg"><img src={restaurant.profileImage} className="w-24 h-24 rounded-full object-cover bg-gray-100" alt="Profile" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Logo')} /></div>
        </div>
      ) : (
        <div className="h-32 w-full bg-gray-100 flex items-center justify-center border-b"><Store className="text-gray-300 w-12 h-12" /></div>
      )}

      <div className="px-6 pt-6">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-extrabold text-gray-900">{restaurant.name}</h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 font-medium flex-wrap">
              <span className="uppercase bg-gray-100 px-2 py-1 rounded">{restaurant.category}</span><span>•</span><span>{restaurant.source === 'firebase' ? restaurant.description : t('public_place')}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button 
              onClick={() => setShowShareModal(true)} 
              className="flex flex-col items-center justify-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-xl shadow-lg hover:from-orange-600 hover:to-red-600 transition-all active:scale-95"
            >
              <Share2 size={20} />
              <span className="text-[10px] font-bold uppercase">Partager</span>
            </button>
            <button onClick={() => setShowNavModal(true)} className="flex flex-col items-center justify-center gap-1 bg-blue-600 text-white p-3 rounded-xl shadow-lg hover:bg-blue-700 transition-transform active:scale-95"><NavIcon size={24} /><span className="text-[10px] font-bold uppercase">{t('go_there')}</span></button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center"><Clock className="text-gray-400 dark:text-gray-300 mb-1" size={20} /><p className="text-[10px] text-gray-400 dark:text-gray-300 uppercase font-bold">{t('hours')}</p><p className="font-medium text-sm text-gray-800 dark:text-gray-100">{restaurant.openingHours || t('unknown')}</p></div>
          
          {/* Bouton téléphone interactif avec menu */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (restaurant.phone && restaurant.phone !== t('unknown')) {
                  setShowPhoneMenu(!showPhoneMenu);
                }
              }}
              disabled={!restaurant.phone || restaurant.phone === t('unknown')}
              className={`w-full flex flex-col items-center p-3 rounded-xl text-center transition-all ${
                restaurant.phone && restaurant.phone !== t('unknown')
                  ? 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer active:scale-95'
                  : 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
              }`}
            >
              <Phone className={`mb-1 ${restaurant.phone && restaurant.phone !== t('unknown') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-300'}`} size={20} />
              <p className={`text-[10px] uppercase font-bold ${restaurant.phone && restaurant.phone !== t('unknown') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-300'}`}>{t('phone')}</p>
              <p className={`font-medium text-sm ${restaurant.phone && restaurant.phone !== t('unknown') ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-100'}`}>{restaurant.phone || t('unknown')}</p>
            </button>
            
            {/* Menu déroulant - Agrandi pour mobile */}
            {showPhoneMenu && restaurant.phone && restaurant.phone !== t('unknown') && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-slideUp min-w-[280px]">
                <a
                  href={`tel:${restaurant.phone}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-b border-gray-100 dark:border-gray-700 active:bg-blue-100 dark:active:bg-blue-900/40"
                  onClick={() => setShowPhoneMenu(false)}
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-base text-gray-900 dark:text-gray-100">{t('call')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{t('call_restaurant')}</p>
                  </div>
                </a>
                <button
                  onClick={() => {
                    setShowPhoneMenu(false);
                    if (onOpenMessaging) {
                      onOpenMessaging();
                    } else {
                      alert(t('messaging_coming_soon'));
                    }
                  }}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors border-b border-gray-100 dark:border-gray-700 active:bg-green-100 dark:active:bg-green-900/40"
                >
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-base text-gray-900 dark:text-gray-100">{t('message')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{t('send_message')}</p>
                  </div>
                </button>
                <a
                  href={`https://wa.me/${restaurant.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t('whatsapp_greeting') || `Bonjour ${restaurant.name}, j'aimerais vous contacter.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-5 py-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors active:bg-emerald-100 dark:active:bg-emerald-900/40"
                  onClick={() => setShowPhoneMenu(false)}
                >
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-base text-gray-900 dark:text-gray-100">{t('whatsapp')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{t('chat_on_whatsapp')}</p>
                  </div>
                </a>
              </div>
            )}
          </div>
          
          <div className={`flex flex-col items-center p-3 rounded-xl text-center border-2 ${restaurant.delivery ? 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-800 border-transparent'}`}>{restaurant.delivery ? (<><div className="text-green-500 dark:text-green-400 mb-1"><Bike size={20}/></div><p className="text-[10px] text-green-600 dark:text-green-400 uppercase font-bold">{t('delivery')}</p><p className="font-bold text-sm text-green-700 dark:text-green-300">{t('yes')}</p></>) : (<><X className="text-gray-300 dark:text-gray-500 mb-1" size={20} /><p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase font-bold">{t('delivery')}</p><p className="font-medium text-sm text-gray-400 dark:text-gray-400">{t('no')}</p></>)}</div>
        </div>

        {/* Route info if available */}
        {routeInfo && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-600 font-bold uppercase mb-2">📍 Itinéraire</p>
            <div className="flex justify-between text-sm text-blue-900 font-semibold">
              <span>📏 {(routeInfo.distance / 1000).toFixed(1)} km</span>
              <span>⏱️ {Math.round(routeInfo.duration / 60)} min</span>
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-gray-100 my-6 mx-6"></div>

      {/* --- BOUTON VOIR MENU ORIGINAL SCANNÉ (pour les clients) --- */}
      {restaurant.source === 'firebase' && restaurant.menuImage && (
        <div className="px-6 mb-6">
          <button 
            onClick={() => setShowFullMenu(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 hover:from-purple-700 hover:to-indigo-700 transition-all active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-bold text-lg">Voir le Menu Original</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-bold">
              Image scannée
            </span>
          </button>
        </div>
      )}

      {/* --- LISTE DES PLATS --- */}
      {restaurant.source === 'firebase' ? (
        <div className="px-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">{t('the_menu')}</h2>
          {Object.entries(menuByCategory).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-bold text-lg mb-3 sticky top-0 bg-gray-50 py-2 z-10 text-orange-600">{category}</h3>
              <div className="space-y-3">
                {(items as MenuItem[]).map((item: MenuItem) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedDish(item)} // C'est ici que ça déclenche l'ouverture
                    className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <img src={item.image || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-xl object-cover bg-gray-100 flex-shrink-0" alt={item.name} />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start"><h4 className="font-bold text-gray-900 text-sm">{item.name}</h4><span className="font-bold text-orange-600 text-sm">{item.price} DH</span></div>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                      </div>
                      {/* Bouton rapide ajout (sans ouvrir le détail) */}
                      <div className="flex justify-end mt-2">
                        {cart[item.id] ? (
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1" onClick={(e) => e.stopPropagation()}><span className="text-xs font-bold text-orange-600 dark:text-orange-400">{cart[item.id].count}x</span></div>
                        ) : (
                          <button className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/50 p-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900 border-2 border-transparent dark:border-orange-700" onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}><Plus size={14} /></button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6 py-10 text-center bg-gray-50 m-6 rounded-2xl border border-dashed border-gray-200"><Store className="mx-auto text-gray-300 mb-3" size={48} /><p className="text-gray-500 font-medium">{t('not_partner_yet')}</p><p className="text-xs text-gray-400">{t('menu_not_available')}</p><div className="mt-6"><button onClick={() => setShowNavModal(true)} className="text-blue-600 font-bold text-sm hover:underline">{t('go_anyway')} ➔</button></div></div>
      )}

      {/* Modal de Partage */}
      {showShareModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Share2 size={24} />
                  Partager ce restaurant
                </h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-orange-100 text-sm">
                Recommandez {restaurant.name} à vos amis
              </p>
            </div>

            {/* Lien du profil */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Lien du restaurant
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={getProfileLink()} 
                  readOnly 
                  className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 font-mono"
                />
                <button 
                  onClick={copyLink}
                  className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                    copied 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Options de partage */}
            <div className="p-6">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">
                Partager via
              </label>
              <div className="space-y-3">
                {/* WhatsApp */}
                <button 
                  onClick={shareWhatsApp}
                  className="w-full p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl flex items-center gap-3 transition-all group"
                >
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle className="text-white" size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-800 dark:text-gray-100">WhatsApp</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Partager via message</p>
                  </div>
                </button>

                {/* Facebook Messenger */}
                <button 
                  onClick={shareFacebookMessenger}
                  className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl flex items-center gap-3 transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Facebook className="text-white" size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-800 dark:text-gray-100">Facebook Messenger</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Partager via Messenger</p>
                  </div>
                </button>

                {/* Instagram */}
                <button 
                  onClick={shareInstagram}
                  className="w-full p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-xl flex items-center gap-3 transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Instagram className="text-white" size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-800 dark:text-gray-100">Instagram Direct</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Copier le lien pour Instagram</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="px-6 pb-6">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-700">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  💡 <strong>Astuce :</strong> Vos amis pourront voir le menu et commander directement !
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL MENU ORIGINAL --- */}
      {showFullMenu && restaurant.menuImage && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Menu Original - {restaurant.name}
                </h3>
                <p className="text-purple-100 text-sm mt-1">
                  Image du menu analysée par l'IA • {restaurant.menu?.length || 0} plat{(restaurant.menu?.length || 0) > 1 ? 's' : ''} détecté{(restaurant.menu?.length || 0) > 1 ? 's' : ''}
                </p>
              </div>
              <button 
                onClick={() => setShowFullMenu(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Image du menu original */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-center">
                <img 
                  src={restaurant.menuImage} 
                  alt="Menu original du restaurant" 
                  className="max-w-full h-auto rounded-xl shadow-lg"
                  style={{ maxHeight: 'calc(95vh - 200px)' }}
                />
              </div>
            </div>

            {/* Footer avec info */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex justify-between items-center text-sm">
                <p className="text-gray-500 dark:text-gray-400">
                  📸 Menu original scanné par le restaurant • Analysé automatiquement par l'IA
                </p>
                <button 
                  onClick={() => setShowFullMenu(false)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};