import React, { useState } from 'react';
import { UserRole, User, Location } from '../types';
import { MapComponent } from './MapComponent';
import { ArrowLeft, Mail, Lock, User as UserIcon, Phone, MapPin, Store, UtensilsCrossed, AlertTriangle, Loader2, X, QrCode } from 'lucide-react';
import { auth, db, getUserRole } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Scanner } from '@yudiel/react-qr-scanner';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null | undefined;
  }
}

interface AuthScreenProps {
  role: UserRole;
  onBack: () => void;
  pendingUser?: User;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ role, onBack }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'qr' | 'google-confirm' | 'email-verification' | 'phone-login' | 'phone-otp'>(() => {
    // Vérifier si on revient d'une inscription
    if (localStorage.getItem('verification_email_sent') === 'true') {
      localStorage.removeItem('verification_email_sent');
      return 'email-verification';
    }
    return 'form';
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(() => {
    return localStorage.getItem('verification_email_sent') === 'true'; // Fallback logic matched with step
  });

  // États pour Auth Téléphone
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  // États pour la confirmation Google
  const [googleUserData, setGoogleUserData] = useState<any>(null);
  const [googleName, setGoogleName] = useState('');
  const [googlePhone, setGooglePhone] = useState('');
  const [googleRestoName, setGoogleRestoName] = useState('');
  const [googleRestoType, setGoogleRestoType] = useState('restaurant');

  // Champs Communs
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('pending_email') || '';
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // NOMS SÉPARÉS
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Champs Chef
  const [restoName, setRestoName] = useState('');
  const [phone, setPhone] = useState('');
  const [restoType, setRestoType] = useState('restaurant');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // États Map
  const [showMapModal, setShowMapModal] = useState(false);

  // --- NOUVELLE LOGIQUE SCANNER ---
  // --- LOGIQUE SCANNER (AMÉLIORÉE) ---
  const handleQrScan = async (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const rawValue = detectedCodes[0].rawValue;

      if (rawValue) {
        // On évite de lancer 2 fois si déjà en cours
        if (loading) return;

        setLoading(true);
        try {
          console.log("QR Lu :", rawValue);

          let data;

          // ESSAI 1 : Format JSON strict
          try {
            data = JSON.parse(rawValue);
          } catch (e) {
            // ESSAI 2 : Format simple "ID_RESTO:TABLE"
            // Exemple : "Hk89sLmn2:12"
            if (rawValue.includes(':')) {
              const parts = rawValue.split(':');
              // On prend la dernière partie comme table, le reste comme ID
              const table = parts.pop();
              const restoId = parts.join(':');
              data = { restoId: restoId?.trim(), table: table?.trim() };
            } else {
              throw new Error(`Format non reconnu. Texte lu : "${rawValue}"`);
            }
          }

          if (!data?.restoId || !data?.table) {
            throw new Error("Données incomplètes (ID ou Table manquants).");
          }

          // Connexion Anonyme
          const userCredential = await signInAnonymously(auth);
          const user = userCredential.user;

          // Sauvegarde Session
          localStorage.setItem('geo_guest_resto', data.restoId);
          localStorage.setItem('geo_guest_table', data.table);

          // Création Profil Invité
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            displayName: `Client Table ${data.table}`,
            role: 'guest',
            currentRestoId: data.restoId,
            currentTable: data.table,
            createdAt: new Date().toISOString()
          });

          window.location.reload();

        } catch (err: any) {
          // On affiche l'erreur exacte pour vous aider à débugger
          alert("Erreur Lecture QR : " + err.message);
          setLoading(false);
        }
      }
    }
  };

  // Fonction simplifiée pour créer un compte client
  const handleRegisterClient = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('👤 Début création du compte client...');
      console.log('📧 Email:', email);
      console.log('👤 Nom:', lastName, 'Prénom:', firstName);

      const fullName = `${firstName} ${lastName}`.trim();

      // ÉTAPE 1: Créer le compte Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Compte Firebase créé:', userCredential.user.uid);

      // ÉTAPE 2: Mettre à jour le profil
      await updateProfile(userCredential.user, { displayName: fullName });
      console.log('✅ Profil mis à jour');

      // ÉTAPE 3: Créer le document Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        displayName: fullName,
        email: email,
        role: 'client',
        emailVerified: false,
        createdAt: new Date().toISOString()
      });
      console.log('✅ Document utilisateur créé dans Firestore');

      // ÉTAPE 4: Envoyer l'email de vérification
      try {
        await sendEmailVerification(userCredential.user);
        console.log('📧 Email de vérification envoyé à:', userCredential.user.email);
      } catch (emailError) {
        console.warn('⚠️ Erreur envoi email (on continue quand même):', emailError);
        // On continue même si l'email ne peut pas être envoyé
      }

      // ÉTAPE 5: Déconnecter et afficher l'écran de vérification
      localStorage.setItem('verification_email_sent', 'true');
      localStorage.setItem('pending_email', email);
      await signOut(auth);
      console.log('🚪 Utilisateur déconnecté');

      // ÉTAPE 6: Changer l'écran
      setVerificationEmailSent(true);
      console.log('📱 Changement vers écran de vérification...');
      setStep('email-verification');
      console.log('📱 Step changé vers:', 'email-verification');
      setLoading(false);
      console.log('✅ Processus terminé avec succès');

    } catch (err: any) {
      console.error('❌ Erreur création compte client:', err);
      console.error('❌ Code erreur:', err.code);
      console.error('❌ Message erreur:', err.message);
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };
  // Fonction pour l'authentification Google
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      console.log('✅ Connexion Google réussie pour:', user.email);
      console.log('🎯 Rôle sélectionné:', role);

      // Vérifier si le profil existe déjà dans Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const isNewUser = !userDoc.exists();

      if (isNewUser) {
        // Nouveau compte : afficher l'écran de confirmation des données
        setGoogleUserData(user);
        setGoogleName(user.displayName || '');
        setGooglePhone(''); // Pas de téléphone dans Google
        setGoogleRestoName(''); // Vide par défaut pour les chefs
        setStep('google-confirm');
        setLoading(false);
      } else {
        // Compte existant : connexion directe
        const userData = userDoc.data();

        // Validation role stricte même pour Google
        if (userData.role && userData.role !== role) {
          await signOut(auth);
          setError(role === UserRole.CLIENT
            ? "Ce compte est un compte restaurant. Veuillez utiliser l'interface restaurant."
            : "Ce compte est un compte client. Veuillez utiliser l'interface client.");
          setLoading(false);
          return;
        }

        try {
          localStorage.setItem('selected_role', role);
        } catch { }

        setLoading(false);
        window.location.reload();
      }

    } catch (err: any) {
      console.error('❌ Erreur connexion Google:', err);
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };



  // Nettoyage du Recaptcha au démontage
  React.useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) {
          console.error("Erreur nettoyage Recaptcha:", e);
        }
      }
    };
  }, []);

  // Configuration Recaptcha - Version Robuste
  const setupRecaptcha = () => {
    // Si un verifier existe déjà, on le nettoie d'abord pour être sûr
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.error("Erreur clear ancien verifier:", e);
      }
      window.recaptchaVerifier = null;
    }

    // On attend un peu que le DOM soit prêt si nécessaire (rare mais utile)
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          console.log("Recaptcha résolu");
        },
        'expired-callback': () => {
          console.log("Recaptcha expiré");
          // On ne nullifie pas tout de suite, on laisse l'utilisateur réessayer
        }
      });
    } catch (err) {
      console.error("Erreur init Recaptcha:", err);
    }
  };
  // Envoi du code SMS
  const handleSendCode = async () => {
    if (!googlePhone) { // On réutilise googlePhone pour le numéro de téléphone temporaire
      setError("Veuillez entrer votre numéro de téléphone.");
      return;
    }

    setLoading(true);
    setError('');
    setupRecaptcha();

    const appVerifier = window.recaptchaVerifier;

    // Formatter le numéro (supposer +212 si commence par 0, sinon tel quel)
    const formattedPhone = googlePhone.startsWith('0')
      ? '+212' + googlePhone.substring(1)
      : googlePhone;

    try {
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('phone-otp');
      setLoading(false);
    } catch (err: any) {
      console.error("Erreur SMS détaillée:", err);
      // AFFICHER L'ERREUR EXACTE POUR LE DEBUG
      const specificError = `Erreur: ${err.code} - ${err.message}`;
      setError(specificError);
      setLoading(false);

      // En cas d'erreur, on détruit le verifier pour forcer une ré-initialisation propre au prochain essai
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch { }
        window.recaptchaVerifier = null;
      }
    }
  };

  // Vérification du code OTP
  const handleVerifyCode = async () => {
    if (!verificationCode || !confirmationResult) return;

    setLoading(true);
    setError('');

    try {
      const result = await confirmationResult.confirm(verificationCode);
      const user = result.user;

      console.log('✅ Téléphone vérifié:', user.phoneNumber);

      // Vérifier si l'utilisateur existe déjà
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        // NOUVEAU USER -> Redirection vers confirmation profil
        setGoogleUserData(user);
        setGoogleName(''); // À remplir
        setGooglePhone(user.phoneNumber || '');
        setStep('google-confirm'); // On réutilise l'écran de confirmation
      } else {
        // USER EXISTANT -> Connexion
        const userData = userDoc.data();

        // Vérif role
        if (userData.role && userData.role !== role) {
          await signOut(auth);
          setError(role === UserRole.CLIENT
            ? "Ce compte est un compte restaurant. Veuillez utiliser l'interface restaurant."
            : "Ce compte est un compte client. Veuillez utiliser l'interface client.");
          setLoading(false);
          return;
        }

        try { localStorage.setItem('selected_role', role); } catch { }
        window.location.reload();
      }
      setLoading(false);

    } catch (err: any) {
      console.error("Erreur Code:", err);
      setError("Code incorrect ou expiré.");
      setLoading(false);
    }
  };

  const handleGoogleAccountCreation = async () => {
    if (!googleUserData) return;

    setLoading(true);
    setError('');

    try {
      const user = googleUserData;

      // Créer le profil utilisateur
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: googleName,
        email: user.email,
        photoURL: user.photoURL,
        phone: googlePhone,
        role: role,
        emailVerified: true, // Google vérifie déjà les emails
        createdAt: new Date().toISOString(),
        provider: 'google'
      });

      // Si c'est un chef, créer le document restaurant
      if (role === UserRole.CHEF) {
        if (!googleRestoName || !selectedLocation) {
          setError("Veuillez remplir le nom du restaurant et choisir sa position.");
          setLoading(false);
          return;
        }

        await setDoc(doc(db, "restaurants", user.uid), {
          ownerId: user.uid,
          ownerName: googleName,
          restaurantName: googleRestoName,
          phone: googlePhone,
          type: googleRestoType,
          email: user.email,
          location: selectedLocation,
          createdAt: new Date().toISOString(),
          source: 'firebase'
        });
      }

      // Sauvegarder le rôle sélectionné
      try {
        localStorage.setItem('selected_role', role);
      } catch { }

      setLoading(false);

      // Recharger la page pour que App.tsx détecte l'utilisateur
      window.location.reload();

    } catch (err: any) {
      console.error('❌ Erreur création compte Google:', err);
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };
  const getErrorMessage = (error: any): string => {
    const errorCode = error.code || '';

    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Adresse email invalide.';
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé.';
      case 'auth/user-not-found':
        return 'Aucun compte trouvé avec cet email.';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect. Voulez-vous le réinitialiser ?';
      case 'auth/invalid-credential':
        return 'Email ou mot de passe incorrect.';
      case 'auth/email-already-in-use':
        return 'Cet email est déjà utilisé.';
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères.';
      case 'auth/operation-not-allowed':
        return 'Cette opération n\'est pas autorisée.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Veuillez réessayer plus tard.';
      case 'auth/network-request-failed':
        return 'Erreur de connexion. Vérifiez votre internet.';
      case 'auth/popup-closed-by-user':
        return 'Connexion annulée.';
      case 'auth/cancelled-popup-request':
        return 'Connexion annulée.';
      case 'auth/invalid-phone-number':
        return 'Numéro de téléphone invalide.';
      case 'auth/missing-phone-number':
        return 'Numéro de téléphone requis.';
      case 'auth/quota-exceeded':
        return 'Quota SMS dépassé. Réessayez plus tard.';
      case 'auth/invalid-verification-code':
        return 'Code de vérification incorrect.';
      case 'auth/invalid-verification-id':
        return 'Session expirée. Veuillez recommencer.';
      case 'auth/invalid-app-credential':
        return 'Configuration incorrecte. Vérifiez que "localhost" est bien dans les domaines autorisés Firebase (Authentication > Settings).';
      default:
        // Si c'est une erreur inconnue, afficher un message générique
        return 'Une erreur est survenue. Veuillez réessayer.';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Connexion simple avec Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Vérifier si l'email est vérifié
      if (!userCredential.user.emailVerified) {
        await signOut(auth); // Déconnecter immédiatement
        setError('Veuillez vérifier votre email avant de vous connecter. Consultez votre boîte de réception.');
        setLoading(false);
        return;
      }

      // Validation stricte du rôle
      const userRole = await getUserRole(userCredential.user.uid);
      if (userRole && userRole !== role) {
        await signOut(auth);
        setError(role === UserRole.CLIENT
          ? "Ce compte est un compte restaurant. Veuillez utiliser l'interface restaurant."
          : "Ce compte est un compte client. Veuillez utiliser l'interface client.");
        setLoading(false);
        return;
      }

      console.log('✅ Connexion réussie pour:', userCredential.user.email);
      console.log('🎯 Rôle sélectionné:', role);

      // Sauvegarder le rôle sélectionné dans localStorage pour éviter la perte
      try {
        localStorage.setItem('selected_role', role);
      } catch { }

      setLoading(false);

      // Recharger la page pour que App.tsx détecte l'utilisateur
      window.location.reload();

    } catch (err: any) {
      console.error('❌ Erreur de connexion:', err);
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };
  const handlePasswordReset = async () => {
    if (!email) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setLoading(false);
    } catch (err: any) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  // Fonction pour renvoyer l'email de vérification
  const handleResendVerification = async () => {
    if (!email) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Se connecter temporairement pour renvoyer l'email
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth); // Se déconnecter immédiatement

      setVerificationEmailSent(true);
      setLoading(false);
    } catch (err: any) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  // Fonction simplifiée pour créer un compte restaurant
  const handleRegisterChef = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('👨‍🍳 Création du compte restaurant...');

      const fullName = `${firstName} ${lastName}`.trim();

      // Créer le compte avec email/mot de passe
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Mettre à jour le profil
      await updateProfile(user, { displayName: fullName });

      // Envoyer l'email de vérification
      await sendEmailVerification(user);
      console.log('📧 Email de vérification envoyé');

      // Créer le document utilisateur
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: fullName,
        email: email,
        role: 'chef',
        emailVerified: false,
        createdAt: new Date().toISOString()
      });

      // Créer le document restaurant
      await setDoc(doc(db, "restaurants", user.uid), {
        ownerId: user.uid,
        ownerName: fullName,
        restaurantName: restoName,
        phone: phone,
        type: restoType,
        email: email,
        location: selectedLocation,
        createdAt: new Date().toISOString(),
        source: 'firebase'
      });

      console.log('✅ Compte restaurant créé avec succès!');

      // Déconnecter l'utilisateur et afficher l'écran de vérification
      await auth.signOut();
      setVerificationEmailSent(true);
      setStep('email-verification');
      setLoading(false);

    } catch (err: any) {
      console.error('❌ Erreur création compte restaurant:', err);
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegistering) {
      // Vérifier que les mots de passe correspondent
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }

      // Vérifier la longueur minimale du mot de passe
      if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }

      if (role === UserRole.CHEF) {
        if (!restoName || !selectedLocation || !phone) {
          setError("Veuillez remplir tous les champs du restaurant et la position.");
          return;
        }
        // Créer directement le compte sans SMS
        handleRegisterChef();
      } else {
        handleRegisterClient();
      }
    } else {
      handleLogin(e);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 sm:p-6 py-8">
      <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl max-w-md w-full relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center mb-4 sm:mb-6">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"><ArrowLeft size={20} className="text-gray-600" /></button>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800">{isRegistering ? 'Création Compte' : 'Connexion'}</h2>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 p-3 rounded-lg mb-4 text-sm flex items-start border border-red-200 dark:border-red-700"><AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" /><span>{error}</span></div>}

        {/* VUE SCANNER QR (Nouvelle Librairie) */}
        {step === 'qr' ? (
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Scannez le code sur la table</h3>

            <div className="w-full aspect-square bg-black rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 relative shadow-inner max-h-[60vh]">
              {/* Le composant Scanner gère tout tout seul */}
              <Scanner
                onScan={handleQrScan}
                onError={(error) => console.log(error)}
                components={{ onOff: true, torch: true }}
              />
            </div>

            <p className="text-xs text-gray-500 text-center mb-4 px-4">Placez le QR code bien au centre</p>
            <button onClick={() => setStep('form')} className="text-gray-500 underline font-bold min-h-[44px] px-4">Annuler</button>
          </div>
        ) : step === 'google-confirm' ? (
          /* VUE CONFIRMATION GOOGLE */
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {googleUserData?.photoURL ? (
                  <img src={googleUserData.photoURL} alt="Photo Google" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={32} className="text-gray-400" />
                )}
              </div>
              <h3 className="font-bold text-lg text-gray-800">Finaliser votre profil</h3>
              <p className="text-sm text-gray-500 mt-1">
                Vérifiez et complétez vos informations
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-start border border-red-200">
                <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Informations de base */}
            <div className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Votre nom complet"
                  value={googleName}
                  onChange={e => setGoogleName(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="tel"
                  className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Numéro de téléphone"
                  value={googlePhone}
                  onChange={e => setGooglePhone(e.target.value)}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="email"
                  className="w-full pl-10 p-3 bg-gray-100 border border-gray-200 rounded-xl outline-none text-gray-500"
                  value={googleUserData?.email || ''}
                  disabled
                />
                <p className="text-xs text-gray-400 mt-1 ml-1">Email Google (non modifiable)</p>
              </div>
            </div>

            {/* Informations restaurant pour les chefs */}
            {role === UserRole.CHEF && (
              <div className="space-y-4 border-t border-gray-100 pt-4 mt-4">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Informations Restaurant</p>

                <div className="relative">
                  <Store className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Nom du restaurant"
                    value={googleRestoName}
                    onChange={e => setGoogleRestoName(e.target.value)}
                    required
                  />
                </div>

                <div className="relative">
                  <UtensilsCrossed className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <select
                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                    value={googleRestoType}
                    onChange={e => setGoogleRestoType(e.target.value)}
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="snack">Snack</option>
                    <option value="cafe">Café</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  className={`w-full py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${selectedLocation
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-dashed border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <MapPin size={18} />
                  {selectedLocation ? "Position validée ✓" : "Choisir la position du restaurant"}
                </button>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setStep('form');
                  setGoogleUserData(null);
                  setError('');
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleGoogleAccountCreation}
                disabled={loading || !googleName || (role === UserRole.CHEF && (!googleRestoName || !selectedLocation))}
                className="flex-2 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            </div>

            {/* Info sur les données Google */}
            <div className="bg-blue-50 p-4 rounded-xl mt-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                🔒 Données récupérées de Google
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Email :</strong> {googleUserData?.email}</li>
                <li>• <strong>Nom :</strong> {googleUserData?.displayName || 'Non renseigné'}</li>
                <li>• <strong>Photo :</strong> {googleUserData?.photoURL ? 'Oui' : 'Non'}</li>
                <li>• <strong>Téléphone :</strong> À compléter</li>
              </ul>
            </div>
          </div>
        ) : step === 'phone-login' ? (
          /* VUE LOGIN TÉLÉPHONE */
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                <Phone size={28} className="text-orange-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-800">Connexion par Téléphone</h3>
              <p className="text-sm text-gray-500">Nous allons vous envoyer un code SMS</p>
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="tel"
                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="06 00 00 00 00"
                value={googlePhone}
                onChange={e => setGooglePhone(e.target.value)}
              />
            </div>

            {/* recaptcha-container moved to bottom */}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('form')} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">Retour</button>
              <button
                onClick={handleSendCode}
                disabled={loading || !googlePhone}
                className="flex-2 py-3 bg-orange-600 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin inline mr-2" /> : null}
                Envoyer Code
              </button>
            </div>
          </div>
        ) : step === 'phone-otp' ? (
          /* VUE OTP TÉLÉPHONE */
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="font-bold text-lg text-gray-800">Code de Vérification</h3>
              <p className="text-sm text-gray-500">Envoyé au {googlePhone}</p>
            </div>

            <input
              type="text"
              className="w-full text-center text-2xl tracking-widest p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="123456"
              maxLength={6}
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
            />

            <button
              onClick={handleVerifyCode}
              disabled={loading || verificationCode.length < 6}
              className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Confirmer'}
            </button>

            <button onClick={() => setStep('phone-login')} className="w-full text-sm text-gray-500 underline">Changer de numéro</button>
          </div>
        ) : step === 'email-verification' ? (
          /* VUE VÉRIFICATION EMAIL - VERSION TEST SIMPLE */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500 flex items-center justify-center">
              <Mail size={24} className="text-white" />
            </div>

            <h3 className="font-bold text-xl text-gray-800">Email envoyé !</h3>
            <p className="text-sm text-gray-600">
              Vérifiez votre boîte email : <strong>{email}</strong>
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {verificationEmailSent && (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
                ✅ Email renvoyé !
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => {
                  setStep('form');
                  setIsRegistering(false);
                  setError('');
                }}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold"
              >
                Se connecter
              </button>

              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-bold"
              >
                {loading ? 'Envoi...' : 'Renvoyer email'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {role === UserRole.CLIENT && !isRegistering && (
              <button type="button" onClick={() => setStep('qr')} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:bg-black md:hover:bg-black transition-transform active:scale-95 mb-4 sm:mb-6 min-h-[52px] text-sm sm:text-base">
                <QrCode size={20} className="text-orange-500" /> Commander sans compte (QR)
              </button>
            )}

            {/* Bouton Google Auth - Disponible pour tous SAUF Restaurant */}
            {role !== UserRole.CHEF && (
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all active:scale-95 mb-4 min-h-[52px] text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin text-gray-500" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {loading ? 'Connexion...' : 'Se connecter avec Google'}
              </button>
            )}

            {/* Bouton Téléphone (Client uniquement) */}
            {role === UserRole.CLIENT && !isRegistering && (
              <button
                type="button"
                onClick={() => setStep('phone-login')}
                className="w-full py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all active:scale-95 mb-4 min-h-[52px] text-sm sm:text-base"
              >
                <Phone size={20} className="text-gray-600" />
                Se connecter avec Téléphone
              </button>
            )}

            {/* Séparateur pour les options alternatives (pas affiché pour Chef qui n'a que email) */}
            {((role === UserRole.CLIENT && !isRegistering) || (isRegistering && role !== UserRole.CHEF)) ? (
              <div className="flex items-center justify-center gap-2 my-4">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs text-gray-400 uppercase font-bold">OU</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
            ) : null}

            {isRegistering && (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <UserIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Prénom"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="relative flex-1">
                  <UserIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Nom"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            {isRegistering && role === UserRole.CHEF && (<div className="space-y-4 border-t border-b border-gray-100 py-4 my-4"><p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Infos Restaurant</p><div className="relative"><Store className="absolute left-3 top-3.5 text-gray-400" size={18} /><input type="text" className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="Nom du Restaurant" value={restoName} onChange={e => setRestoName(e.target.value)} required /></div><div className="relative"><UtensilsCrossed className="absolute left-3 top-3.5 text-gray-400" size={18} /><select className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 appearance-none" value={restoType} onChange={e => setRestoType(e.target.value)}><option value="restaurant">Restaurant</option><option value="snack">Snack</option><option value="cafe">Café</option></select></div><div className="relative"><Phone className="absolute left-3 top-3.5 text-gray-400" size={18} /><input type="tel" className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="Téléphone" value={phone} onChange={e => setPhone(e.target.value)} required /></div><button type="button" onClick={() => setShowMapModal(true)} className={`w-full py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${selectedLocation ? 'border-green-500 bg-green-50 text-green-700' : 'border-dashed border-gray-300 text-gray-500 hover:bg-gray-50'}`}><MapPin size={18} />{selectedLocation ? "Position validée ✓" : "Choisir sur la carte"}</button></div>)}

            <div className="relative"><Mail className="absolute left-3 top-4 text-gray-400" size={18} /><input type="email" className="w-full pl-10 p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-base min-h-[48px]" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div className="relative"><Lock className="absolute left-3 top-4 text-gray-400" size={18} /><input type="password" className="w-full pl-10 p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-base min-h-[48px]" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required /></div>

            {isRegistering && (
              <div className="relative">
                <Lock className="absolute left-3 top-4 text-gray-400" size={18} />
                <input
                  type="password"
                  className={`w-full pl-10 p-3.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 text-base min-h-[48px] ${confirmPassword && password !== confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-orange-500'
                    }`}
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 ml-1">Les mots de passe ne correspondent pas</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-green-500 text-xs mt-1 ml-1 flex items-center gap-1">
                    <span>✓</span> Les mots de passe correspondent
                  </p>
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold active:bg-orange-700 md:hover:bg-orange-700 shadow-lg flex items-center justify-center gap-2 min-h-[52px] text-base">{loading && <Loader2 size={18} className="animate-spin" />}{isRegistering ? "S'inscrire" : "Se connecter"}</button>

            {!isRegistering && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 text-sm hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <div className="text-center mt-4"><button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-orange-600 font-bold hover:underline text-sm">{isRegistering ? 'J\'ai déjà un compte' : "Créer un compte"}</button></div>
          </form>
        )}

        {showMapModal && (
          <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative animate-fadeIn">
              <div className="p-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <MapPin size={20} />
                  Position du Restaurant
                </h3>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 relative">
                <MapComponent
                  center={{ lat: 33.5731, lng: -7.5898 }} // Casablanca par défaut
                  zoom={12}
                  interactive={true}
                  showSearchBar={true}
                  showLocationButton={true}
                  showConfirmButton={true}
                  confirmButtonText="Confirmer la position du restaurant"
                  onLocationSelect={(loc) => setSelectedLocation(loc)}
                  onConfirm={() => setShowMapModal(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Mot de passe oublié */}
        {showForgotPassword && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Réinitialiser le mot de passe</h3>
              </div>

              {resetEmailSent ? (
                <div className="p-6">
                  <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 p-4 rounded-xl mb-4 border border-green-200 dark:border-green-700">
                    <p className="font-bold mb-2">✅ Email envoyé !</p>
                    <p className="text-sm">
                      Un email de réinitialisation a été envoyé à <strong>{email}</strong>.
                      Vérifiez votre boîte de réception et suivez les instructions.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                    }}
                    className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                  </p>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 p-3 rounded-lg mb-4 text-sm border border-red-200 dark:border-red-700">
                      {error}
                    </div>
                  )}

                  <div className="relative mb-4">
                    <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      type="email"
                      className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 border dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Votre email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowForgotPassword(false);
                        setError('');
                      }}
                      className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handlePasswordReset}
                      disabled={loading || !email}
                      className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 size={18} className="animate-spin" />}
                      Envoyer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Container Recaptcha persistant pour éviter les erreurs de DOM */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};