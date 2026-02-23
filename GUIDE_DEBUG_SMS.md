# Guide de Débogage - Envoi SMS

## 🔍 Problème: "Une erreur est survenue" lors de l'envoi SMS

### Étapes de Diagnostic

#### 1. Ouvrir la Console du Navigateur
- **Chrome/Edge**: F12 ou Ctrl+Shift+I
- **Firefox**: F12 ou Ctrl+Shift+K
- **Safari**: Cmd+Option+I

#### 2. Vérifier les Logs
Lors du clic sur "Suivant", vous devriez voir dans la console:

```
🔐 Initialisation du Recaptcha...
✅ Recaptcha initialisé
📱 Tentative d'envoi SMS...
Téléphone: 0612345678
Téléphone formaté: +212612345678
Envoi du SMS...
```

#### 3. Identifier l'Erreur

**Si vous voyez:**
```
❌ Erreur lors de l'envoi SMS: [Error]
Code erreur: auth/xxxxx
```

Consultez la section "Codes d'Erreur" ci-dessous.

## 🚨 Codes d'Erreur Courants

### 1. `auth/invalid-app-credential`
**Cause:** Configuration Firebase incorrecte ou clés API manquantes

**Solution:**
1. Vérifiez que Firebase est correctement configuré dans `.env.local`:
```env
VITE_FIREBASE_API_KEY=votre_clé
VITE_FIREBASE_AUTH_DOMAIN=votre_domaine
VITE_FIREBASE_PROJECT_ID=votre_projet
```

2. Vérifiez que l'authentification par téléphone est activée dans Firebase Console:
   - Allez sur Firebase Console
   - Authentication > Sign-in method
   - Activez "Phone" (Téléphone)

### 2. `auth/quota-exceeded`
**Cause:** Quota SMS dépassé (Firebase gratuit = 10 SMS/jour)

**Solution:**
- Attendez 24h pour que le quota se réinitialise
- OU passez à un plan payant Firebase (Blaze)
- OU utilisez un autre projet Firebase pour les tests

### 3. `auth/invalid-phone-number`
**Cause:** Format de numéro incorrect

**Solution:**
- Utilisez le format: `0612345678` (Maroc)
- OU: `+212612345678`
- Évitez les espaces et caractères spéciaux

### 4. `auth/captcha-check-failed`
**Cause:** Problème avec reCAPTCHA

**Solution:**
1. Rechargez la page (F5)
2. Vérifiez que le domaine est autorisé dans Firebase Console:
   - Authentication > Settings > Authorized domains
   - Ajoutez `localhost` pour les tests locaux

### 5. `auth/missing-phone-number`
**Cause:** Numéro de téléphone vide

**Solution:**
- Assurez-vous de remplir le champ téléphone

### 6. `auth/too-many-requests`
**Cause:** Trop de tentatives en peu de temps

**Solution:**
- Attendez quelques minutes
- Rechargez la page

## 🔧 Configuration Firebase Requise

### 1. Activer l'Authentification par Téléphone

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet
3. **Authentication** > **Sign-in method**
4. Cliquez sur **Phone** (Téléphone)
5. Activez le fournisseur
6. Sauvegardez

### 2. Configurer les Domaines Autorisés

1. **Authentication** > **Settings** > **Authorized domains**
2. Ajoutez:
   - `localhost` (pour développement)
   - Votre domaine de production

### 3. Vérifier les Quotas

1. Allez sur **Authentication** > **Usage**
2. Vérifiez le nombre de SMS envoyés aujourd'hui
3. Plan gratuit = 10 SMS/jour maximum

## 🧪 Tests Recommandés

### Test 1: Vérifier Firebase
```javascript
// Dans la console du navigateur
console.log(auth);
// Devrait afficher l'objet Firebase Auth
```

### Test 2: Vérifier Recaptcha
```javascript
// Dans la console du navigateur
console.log(window.recaptchaVerifier);
// Devrait afficher l'objet RecaptchaVerifier
```

### Test 3: Format Téléphone
Essayez différents formats:
- `0612345678` ✅
- `+212612345678` ✅
- `06 12 34 56 78` ❌ (espaces)
- `212612345678` ❌ (sans +)

## 📱 Numéros de Test Firebase

Firebase permet d'utiliser des numéros de test sans envoyer de vrais SMS:

### Configuration
1. Firebase Console > **Authentication** > **Sign-in method**
2. Cliquez sur **Phone** > **Phone numbers for testing**
3. Ajoutez un numéro de test:
   - Numéro: `+212600000000`
   - Code: `123456`

### Utilisation
- Utilisez `0600000000` dans le formulaire
- Le code sera toujours `123456`
- Aucun SMS réel n'est envoyé
- Pas de quota consommé

## 🔍 Logs Détaillés

Avec les améliorations apportées, vous verrez maintenant:

### Succès
```
🔐 Initialisation du Recaptcha...
✅ Recaptcha initialisé
📱 Tentative d'envoi SMS...
Téléphone: 0612345678
Téléphone formaté: +212612345678
Envoi du SMS...
✅ SMS envoyé avec succès
```

### Échec
```
🔐 Initialisation du Recaptcha...
✅ Recaptcha initialisé
📱 Tentative d'envoi SMS...
Téléphone: 0612345678
Téléphone formaté: +212612345678
Envoi du SMS...
❌ Erreur lors de l'envoi SMS: FirebaseError: [auth/quota-exceeded]
Code erreur: auth/quota-exceeded
Message: Quota exceeded for resource...
```

## 💡 Solutions Rapides

### Solution 1: Recharger la Page
Le plus simple - résout 80% des problèmes de Recaptcha

### Solution 2: Vider le Cache
1. Ctrl+Shift+Delete
2. Cochez "Cached images and files"
3. Cliquez sur "Clear data"

### Solution 3: Mode Incognito
Testez en mode navigation privée pour éliminer les problèmes de cache

### Solution 4: Numéro de Test
Utilisez un numéro de test Firebase (voir section ci-dessus)

### Solution 5: Vérifier .env.local
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 🆘 Besoin d'Aide?

Si le problème persiste:

1. **Copiez les logs de la console** (tout le texte rouge)
2. **Notez le code d'erreur** (auth/xxxxx)
3. **Vérifiez votre configuration Firebase**
4. **Essayez avec un numéro de test**

## 📊 Checklist de Vérification

- [ ] Firebase Authentication activé
- [ ] Méthode "Phone" activée dans Firebase
- [ ] Domaine autorisé dans Firebase
- [ ] Fichier .env.local configuré
- [ ] Quota SMS non dépassé
- [ ] Format de téléphone correct
- [ ] Console du navigateur ouverte pour voir les logs
- [ ] Page rechargée récemment
- [ ] Recaptcha initialisé (voir console)

## 🎯 Prochaines Étapes

1. Ouvrez la console du navigateur (F12)
2. Remplissez le formulaire de création de compte restaurant
3. Cliquez sur "Suivant"
4. Regardez les logs dans la console
5. Identifiez le code d'erreur
6. Consultez la section correspondante ci-dessus
