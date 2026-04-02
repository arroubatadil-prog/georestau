import React, { useState, useRef } from 'react';
import { Restaurant } from '../../types';
import { Camera, Store, LayoutDashboard, Phone, Pencil, CheckCircle, Share2, Copy, Check, MessageCircle, Facebook, Instagram } from 'lucide-react';
import { useI18n } from '../../i18n';
import { QRCodeGenerator } from './QRCodeGenerator';

interface ChefProfileProps {
  restaurant: Restaurant;
  onUpdate: (field: string, value: any) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'profile') => void;
  onSave: () => void;
  userSettings?: {
    lang: 'fr' | 'en' | 'ar';
    theme: 'light' | 'dark';
    setLang: (lang: 'fr' | 'en' | 'ar') => void;
    setTheme: (theme: 'light' | 'dark') => void;
  };
}

export const ChefProfile: React.FC<ChefProfileProps> = ({ restaurant, onUpdate, onImageUpload, onSave }) => {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const toggleEdit = () => {
    if (isEditing) onSave(); // Sauvegarde quand on quitte le mode édition
    setIsEditing(!isEditing);
  };

  // Générer le lien du profil restaurant
  const getProfileLink = () => {
    return `${window.location.origin}/?restaurant=${restaurant.id}`;
  };

  // Copier le lien
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getProfileLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
    }
  };

  const getShareText = () => {
    return `Découvrez ${restaurant.name} sur GeoResto ! 🍽️\n${restaurant.description}\n\n${getProfileLink()}`;
  };

  // Partager sur WhatsApp
  const shareWhatsApp = () => {
    const text = getShareText();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
    } else {
      window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
    setShowShareModal(false);
  };

  // Partager sur Facebook Messenger
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

  // Partager sur Instagram (via DM - nécessite l'app)
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

  return (
    <div className="p-0 h-full bg-gray-50 dark:bg-gray-900 animate-fadeIn">
        {/* Header Images */}
        <div className="relative">
            <div className="h-64 w-full bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 relative group overflow-hidden">
                <img src={restaurant.coverImage} alt="Cover" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/800x400'} />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => coverInputRef.current?.click()} className="bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform">
                        <Camera size={18}/> {t('edit_cover_image')}
                    </button>
                    <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => onImageUpload(e, 'cover')} />
                </div>
            </div>
            <div className="absolute -bottom-16 left-8">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow-lg relative group overflow-hidden">
                    <img src={restaurant.profileImage} alt="Profile" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150'} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => profileInputRef.current?.click()} className="text-white p-2 rounded-full hover:bg-white/20"><Camera size={24}/></button>
                        <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => onImageUpload(e, 'profile')} />
                    </div>
                </div>
            </div>
        </div>

        {/* Formulaire Infos */}
        <div className="mt-20 px-8 max-w-4xl pb-10">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('restaurant_info')}</h2>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowShareModal(true)} 
                        className="px-4 py-2 rounded-xl font-bold flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
                    >
                        <Share2 size={18}/> Partager
                    </button>
                    <button onClick={toggleEdit} className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors ${isEditing ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                        {isEditing ? <><CheckCircle size={18}/> {t('save')}</> : <><Pencil size={18}/> {t('edit')}</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                
                {/* Nom */}
                <div className="relative group">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1 block">{t('restaurant_name')}</label>
                    <div className="flex items-center gap-3">
                        <Store className="text-orange-500 dark:text-orange-400" size={20}/>
                        {isEditing ? ( <input type="text" className="flex-1 p-2 border-b-2 border-orange-200 dark:border-orange-700 outline-none focus:border-orange-500 bg-orange-50/30 dark:bg-orange-900/20 font-bold text-lg text-gray-900 dark:text-gray-100" value={restaurant.name} onChange={(e) => onUpdate('name', e.target.value)} /> ) : ( <span className="font-bold text-lg text-gray-800 dark:text-gray-100 py-2">{restaurant.name}</span> )}
                    </div>
                </div>

                {/* Type */}
                <div className="relative group">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1 block">{t('type')}</label>
                    <div className="flex items-center gap-3">
                        <LayoutDashboard className="text-blue-500 dark:text-blue-400" size={20}/>
                        {isEditing ? (
                            <select className="flex-1 p-2 border-b-2 border-blue-200 dark:border-blue-700 outline-none focus:border-blue-500 bg-blue-50/30 dark:bg-blue-900/20 font-medium text-gray-900 dark:text-gray-100" value={restaurant.type || 'restaurant'} onChange={(e) => onUpdate('type', e.target.value)}>
                                <option value="restaurant">{t('restaurant')}</option>
                                <option value="snack">{t('snack')}</option>
                                <option value="cafe">{t('cafe')}</option>
                                <option value="fast_food">{t('fast_food')}</option>
                            </select>
                        ) : (
                            <span className="font-medium text-gray-800 dark:text-gray-200 py-2 capitalize">
                                {restaurant.type === 'restaurant'
                                    ? t('restaurant')
                                    : restaurant.type === 'snack'
                                    ? t('snack')
                                    : restaurant.type === 'cafe'
                                    ? t('cafe')
                                    : t('not_specified')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Téléphone */}
                <div className="relative group">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1 block">{t('phone_number')}</label>
                    <div className="flex items-center gap-3">
                        <Phone className="text-green-500 dark:text-green-400" size={20}/>
                        {isEditing ? (
                            <input
                                type="tel"
                                className="flex-1 p-2 border-b-2 border-green-200 dark:border-green-700 outline-none focus:border-green-500 bg-green-50/30 dark:bg-green-900/20 font-medium text-gray-900 dark:text-gray-100"
                                value={restaurant.phone || ''}
                                onChange={(e) => onUpdate('phone', e.target.value)}
                            />
                        ) : (
                            <span className="font-medium text-gray-800 dark:text-gray-200 py-2">{restaurant.phone || t('not_specified')}</span>
                        )}
                    </div>
                </div>

                {/* Livraison (Oui/Non) */}
                <div className="relative group">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1 block">{t('delivery')}</label>
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <div className="flex gap-4 py-2">
                                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="delivery" checked={restaurant.delivery === true} onChange={() => onUpdate('delivery', true)} className="accent-green-600 w-5 h-5" /><span className="font-bold text-green-700 dark:text-green-400">{t('yes')}</span></label>
                                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="delivery" checked={!restaurant.delivery} onChange={() => onUpdate('delivery', false)} className="accent-gray-500 w-5 h-5" /><span className="font-medium text-gray-600 dark:text-gray-300">{t('no')}</span></label>
                            </div>
                        ) : ( 
                            <span className={`font-bold py-2 ${restaurant.delivery ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-400'}`}>{restaurant.delivery ? t('available') : t('unavailable')}</span> 
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2 mt-2">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1 block">{t('description')}</label>
                    {isEditing ? ( <textarea className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500 outline-none resize-none text-gray-900 dark:text-gray-100" rows={3} value={restaurant.description} onChange={(e) => onUpdate('description', e.target.value)} /> ) : ( <p className="text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">"{restaurant.description}"</p> )}
                </div>
            </div>

            {/* Générateur de QR Codes */}
            <div className="mt-8">
                <QRCodeGenerator 
                    restaurantId={restaurant.id} 
                    restaurantName={restaurant.name} 
                />
            </div>
        </div>

        {/* Modal de Partage */}
        {showShareModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                <Share2 size={24} />
                                Partager votre profil
                            </h3>
                            <button 
                                onClick={() => setShowShareModal(false)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-orange-100 text-sm">
                            Partagez votre restaurant avec vos clients
                        </p>
                    </div>

                    {/* Lien du profil */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                            Lien de votre profil
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
                                💡 <strong>Astuce :</strong> Les clients qui cliquent sur ce lien accèdent directement à votre profil et peuvent commander !
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};