import React, { useState, useEffect } from 'react';
import { useI18n } from './i18n';
import LanguageSelector from './components/LanguageSelector';
import { AuthScreen } from './components/AuthScreen';
import { ChefDashboard } from './components/ChefDashboard';
import { ClientApp } from './components/ClientApp';
import { UserRole, User } from './types';
import { Utensils, Navigation, Loader2 } from 'lucide-react';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useUserSettings } from './hooks/useUserSettings';
import { doc, getDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(() => {
    // Récupérer le rôle sélectionné depuis localStorage au démarrage
    try {
      const savedRole = localStorage.getItem('selected_role');
      console.log('🔍 Rôle sauvegardé au démarrage:', savedRole);
      if (savedRole === 'client') return UserRole.CLIENT;
      if (savedRole === 'chef') return UserRole.CHEF;
    } catch (e) {
      console.error('❌ Erreur lecture localStorage:', e);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [pendingRestaurantId, setPendingRestaurantId] = useState<string | null>(null);

  // Charger les paramètres indépendants par rôle
  const userSettings = useUserSettings(role);
  const { t } = useI18n();

  // Détecter les paramètres de partage dans l'URL au chargement
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const restaurantId = urlParams.get('restaurant');

    if (restaurantId) {
      console.log('🔗 Lien de partage détecté pour restaurant:', restaurantId);
      // Sauvegarder l'ID du restaurant pour après la connexion
      setPendingRestaurantId(restaurantId);
      try {
        localStorage.setItem('pending_restaurant_id', restaurantId);
      } catch { }

      // Si l'utilisateur n'est pas encore connecté ou n'a pas choisi de rôle,
      // on force le rôle CLIENT
      if (!selectedRole) {
        console.log('👤 Redirection vers connexion client');
        setSelectedRole(UserRole.CLIENT);
      }
    }
  }, [selectedRole]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const newUser: User = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || undefined,
          isDemo: firebaseUser.isAnonymous,
          photoURL: firebaseUser.photoURL || undefined,
          emailVerified: firebaseUser.emailVerified
        };
        setUser(newUser);

        // Récupérer le rôle depuis le document users dans Firestore
        try {
          console.log('🔍 Recherche du rôle pour UID:', firebaseUser.uid);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('📄 Document utilisateur trouvé:', userData);
            const userRole = userData.role === 'chef' ? UserRole.CHEF : UserRole.CLIENT;
            console.log('✅ Rôle déterminé:', userRole);
            setRole(userRole);
            setSelectedRole(userRole);
          } else {
            console.log('⚠️ Aucun document utilisateur trouvé');
            // Si pas de document, mais qu'un rôle était déjà sélectionné, le conserver
            if (selectedRole) {
              console.log('🔄 Utilisation du rôle sélectionné:', selectedRole);
              setRole(selectedRole);
            } else {
              setRole(null);
            }
          }
        } catch (error) {
          console.error('❌ Erreur récupération rôle:', error);
          // En cas d'erreur, utiliser le rôle sélectionné si disponible
          if (selectedRole) {
            console.log('🔄 Fallback vers le rôle sélectionné:', selectedRole);
            setRole(selectedRole);
          } else {
            setRole(null);
          }
        }

      } else {
        setUser(null);
        setRole(null);
        // NE PAS remettre selectedRole à null ici - l'utilisateur peut avoir sélectionné un rôle
        // setSelectedRole(null); // ← Commenté pour éviter d'annuler la sélection de rôle

        // Nettoyer le localStorage lors de la déconnexion SEULEMENT si c'est une vraie déconnexion
        // (pas quand l'utilisateur sélectionne un rôle)
        // try {
        //   localStorage.removeItem('clientApp_view');
        //   localStorage.removeItem('clientApp_selectedRestaurant');
        //   localStorage.removeItem('clientApp_viewHistory');
        //   localStorage.removeItem('chefDashboard_activeTab');
        //   localStorage.removeItem('chefDashboard_statsPeriod');
        //   localStorage.removeItem('chefDashboard_tabHistory');
        // } catch {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedRole]);

  const handleLogout = async () => {
    try {
      console.log('🚪 Déconnexion complète');
      await signOut(auth);
      setUser(null);
      setRole(null);
      setSelectedRole(null);
      // Nettoyer le localStorage lors d'une vraie déconnexion
      try {
        localStorage.removeItem('selected_role');
        localStorage.removeItem('clientApp_view');
        localStorage.removeItem('clientApp_selectedRestaurant');
        localStorage.removeItem('clientApp_viewHistory');
        localStorage.removeItem('chefDashboard_activeTab');
        localStorage.removeItem('chefDashboard_statsPeriod');
        localStorage.removeItem('chefDashboard_tabHistory');
      } catch { }
    }
    catch (error) { console.error("Logout failed", error); }
  };

  const [showLangSelector, setShowLangSelector] = useState<boolean>(() => {
    try { return !localStorage.getItem('lang'); } catch { return false; }
  });

  // Appliquer les paramètres indépendants (langue et thème) par rôle
  useEffect(() => {
    // Appliquer la langue
    try {
      document.documentElement.lang = userSettings.lang;
      document.documentElement.dir = userSettings.lang === 'ar' ? 'rtl' : 'ltr';
    } catch { }

    // Appliquer le thème
    try {
      if (userSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch { }
  }, [userSettings.lang, userSettings.theme, role]);

  // Debug effect pour surveiller les changements de selectedRole
  useEffect(() => {
    console.log('🔄 selectedRole a changé:', selectedRole);
  }, [selectedRole]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-red-500">
        <div className="relative mb-8">
          {/* Animated Halo */}
          <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse"></div>
          {/* Logo */}
          <img
            src="/unnamed.png"
            alt="Loading..."
            className="w-32 h-32 object-contain relative z-10 animate-bounce"
            style={{ animationDuration: '2s' }}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="text-white animate-spin" size={32} />
          <p className="text-white/90 text-sm font-bold tracking-widest animate-pulse">CHARGEMENT...</p>
        </div>
      </div>
    );
  }



  // Debug logs
  console.log('🔍 État actuel:', {
    user: user ? 'connecté' : 'non connecté',
    role: role,
    selectedRole: selectedRole,
    loading: loading
  });

  // ÉCRAN D'ACCUEIL (DESIGN ORANGE RESTAURÉ - OPTIMISÉ MOBILE)
  if (!selectedRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 p-4 sm:p-6 font-sans text-white overflow-y-auto">

        {/* Message pour lien de partage */}
        {pendingRestaurantId && (
          <div className="mb-6 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-2xl p-4 max-w-md animate-fadeIn">
            <p className="text-center text-white font-bold text-sm">
              🍽️ Un restaurant vous a été partagé !<br />
              <span className="text-orange-100 font-normal text-xs">Connectez-vous en tant que client pour le découvrir</span>
            </p>
          </div>
        )}

        {/* Logo et Titre */}
        <div className="mb-4 sm:mb-6 animate-fadeIn relative group">
          {/* Halos multiples pour effet de profondeur */}
          <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl"></div>

          {/* Logo avec effet de lueur - fond transparent */}
          <div className="relative">
            <img
              src="/unnamed.png"
              alt="GeoResto Logo"
              className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain shadow-[0_0_40px_rgba(251,146,60,0.4)] hover:shadow-[0_0_60px_rgba(251,146,60,0.6)] hover:scale-110 transition-all duration-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 sm:mb-4 drop-shadow-md tracking-tight text-center animate-fadeIn px-2">
          {t('title')}
        </h1>
        <p className="text-orange-50 text-base sm:text-lg mb-8 sm:mb-12 max-w-lg text-center font-medium opacity-90 animate-fadeIn px-4">
          {t('subtitle')}
        </p>

        {/* Les deux cartes de choix */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 w-full max-w-4xl justify-center items-stretch animate-slideUp px-2">

          {/* Carte Client (Blanche) */}
          <button
            onClick={async () => {
              console.log('🔘 Clic sur "Je suis client"');

              // Si un utilisateur est connecté, le déconnecter d'abord
              if (user) {
                console.log('👤 Déconnexion de l\'utilisateur actuel');
                await signOut(auth);
              }

              setSelectedRole(UserRole.CLIENT);
              try {
                localStorage.setItem('selected_role', 'client');
                console.log('💾 Rôle client sauvegardé dans localStorage');
              } catch (e) {
                console.error('❌ Erreur sauvegarde localStorage:', e);
              }
            }}
            className="group flex-1 bg-white text-gray-800 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl active:scale-95 md:hover:shadow-orange-900/20 md:hover:scale-105 transition-all duration-300 flex flex-col items-center text-center min-h-[180px] sm:min-h-[200px]"
          >
            <div className="bg-orange-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-active:bg-orange-500 group-active:text-white md:group-hover:bg-orange-500 md:group-hover:text-white transition-colors">
              <Navigation size={28} className="sm:w-8 sm:h-8 text-orange-600 group-active:text-white md:group-hover:text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{t('i_am_client')}</h2>
            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
              {t('i_am_client_desc')}
            </p>
          </button>

          {/* Carte Chef (Noire/Bleu Nuit) */}
          <button
            onClick={async () => {
              console.log('🔘 Clic sur "Je suis chef"');

              // Si un utilisateur est connecté, le déconnecter d'abord
              if (user) {
                console.log('👤 Déconnexion de l\'utilisateur actuel');
                await signOut(auth);
              }

              setSelectedRole(UserRole.CHEF);
              try {
                localStorage.setItem('selected_role', 'chef');
                console.log('💾 Rôle chef sauvegardé dans localStorage');
              } catch (e) {
                console.error('❌ Erreur sauvegarde localStorage:', e);
              }
            }}
            className="group flex-1 bg-slate-900 text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl active:scale-95 md:hover:shadow-slate-900/50 md:hover:scale-105 transition-all duration-300 flex flex-col items-center text-center min-h-[180px] sm:min-h-[200px]"
          >
            <div className="bg-slate-800 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-active:bg-white group-active:text-slate-900 md:group-hover:bg-white md:group-hover:text-slate-900 transition-colors">
              <Utensils size={28} className="sm:w-8 sm:h-8 text-white group-active:text-slate-900 md:group-hover:text-slate-900" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{t('i_am_chef')}</h2>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
              {t('i_am_chef_desc')}
            </p>
          </button>

        </div>

        {/* Bouton de débogage temporaire */}
        <button
          onClick={() => {
            console.log('🧹 Nettoyage localStorage');
            localStorage.clear();
            window.location.reload();
          }}
          className="mt-4 px-4 py-2 bg-red-500/20 text-white text-xs rounded-lg border border-red-300/30"
        >
          🧹 Debug: Nettoyer localStorage
        </button>

        <div className="mt-8 sm:mt-12 text-xs text-white/60 pb-4">
          {t('copyright')}
        </div>
        {showLangSelector && <LanguageSelector onClose={() => setShowLangSelector(false)} />}
      </div>
    );
  }

  // Si un rôle est sélectionné mais aucun utilisateur connecté, afficher l'écran d'authentification
  if (selectedRole && !user) {
    console.log('🔐 Affichage écran d\'authentification pour rôle:', selectedRole);
    return (
      <AuthScreen
        role={selectedRole}
        onBack={() => {
          console.log('🔙 Retour à la sélection de rôle');
          setSelectedRole(null);
          try {
            localStorage.removeItem('selected_role');
          } catch { }
        }}
      />
    );
  }

  // Si l'utilisateur est connecté, déterminer le rôle actif
  if (user) {
    const activeRole = role || selectedRole;

    if (!activeRole) {
      console.log('👤 Utilisateur connecté sans rôle, retour à la sélection');
      handleLogout();
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-red-500">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse"></div>
            <img
              src="/unnamed.png"
              alt="Loading..."
              className="w-32 h-32 object-contain relative z-10 animate-bounce"
              style={{ animationDuration: '2s' }}
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="text-white animate-spin" size={32} />
            <p className="text-white/90 text-sm font-bold tracking-widest animate-pulse">REDIRECTION...</p>
          </div>
        </div>
      );
    }

    // Afficher l'interface appropriée
    // FIX: Empêcher le "flash" du dashboard pendant l'inscription (avant que le signOut ne se déclenche)
    // MAIS permettre l'accès aux utilisateurs sans email (ex: Téléphone)
    if (user.email && !user.emailVerified) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-red-500">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse"></div>
            <img
              src="/unnamed.png"
              alt="Loading..."
              className="w-32 h-32 object-contain relative z-10 animate-bounce"
              style={{ animationDuration: '2s' }}
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="text-white animate-spin" size={32} />
            <p className="text-white/90 text-sm font-bold tracking-widest animate-pulse">VÉRIFICATION...</p>
          </div>
        </div>
      );
    }

    return activeRole === UserRole.CHEF ? (
      <ChefDashboard user={user} onLogout={handleLogout} userSettings={userSettings} />
    ) : (
      <ClientApp user={user} onLogout={handleLogout} userSettings={userSettings} />
    );
  }

  // Fallback - ne devrait jamais arriver
  console.log('⚠️ État inattendu, retour à l\'écran d\'accueil');
  return null;
};

export default App;