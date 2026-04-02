# 🚀 Guide de Déploiement - GeoResto

## 📋 Pré-requis

Avant de déployer, assurez-vous que :
- ✅ Tous les tests sont passés
- ✅ L'application fonctionne en local
- ✅ Firebase est configuré
- ✅ Les variables d'environnement sont définies

---

## 🔧 Préparation

### 1. Vérifier les Variables d'Environnement

Créer/vérifier `.env.local` :
```env
VITE_FIREBASE_API_KEY=votre_clé
VITE_FIREBASE_AUTH_DOMAIN=votre_domaine
VITE_FIREBASE_PROJECT_ID=votre_projet
VITE_FIREBASE_STORAGE_BUCKET=votre_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
VITE_GEMINI_API_KEY=votre_clé_gemini
```

### 2. Tester le Build

```bash
# Créer le build de production
npm run build

# Tester le build localement
npm run preview

# Ouvrir : http://localhost:4173
```

Vérifier que :
- ✅ L'application se charge correctement
- ✅ Pas d'erreurs dans la console
- ✅ Le chatbot fonctionne
- ✅ La carte s'affiche
- ✅ Les commandes fonctionnent

---

## 🔥 Déploiement sur Firebase Hosting

### Méthode 1 : Déploiement Complet

```bash
# Build + Deploy en une commande
npm run build
firebase deploy
```

### Méthode 2 : Déploiement Hosting Uniquement

```bash
# Si vous avez déjà déployé les fonctions
npm run build
firebase deploy --only hosting
```

### Méthode 3 : Preview (Test avant production)

```bash
# Créer un preview temporaire
npm run build
firebase hosting:channel:deploy preview

# Vous obtiendrez une URL temporaire pour tester
```

---

## 🌐 Déploiement sur Vercel (Alternative)

### 1. Installer Vercel CLI

```bash
npm install -g vercel
```

### 2. Déployer

```bash
# Première fois
vercel

# Déploiements suivants
vercel --prod
```

### 3. Configurer les Variables d'Environnement

Dans le dashboard Vercel :
1. Aller dans Settings → Environment Variables
2. Ajouter toutes les variables de `.env.local`
3. Redéployer

---

## 📱 Configuration PWA

### Vérifier le Manifest

Le fichier `public/manifest.json` doit contenir :
```json
{
  "name": "GeoResto",
  "short_name": "GeoResto",
  "description": "Plateforme de commande de restaurant en temps réel",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f97316",
  "icons": [...]
}
```

### Vérifier les Icônes

Assurez-vous d'avoir :
- ✅ `public/logo.png` (192x192)
- ✅ `public/pwa-192x192.png` (192x192)
- ✅ `public/512x512.png` (512x512)

### Tester la PWA

1. Déployer l'application
2. Ouvrir sur mobile
3. Cliquer sur "Ajouter à l'écran d'accueil"
4. Vérifier que l'icône et le nom sont corrects

---

## 🔒 Sécurité

### 1. Règles Firebase

Vérifier `firestore.rules` :
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Restaurants : lecture publique, écriture propriétaire
    match /restaurants/{restaurantId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == restaurantId;
    }
    
    // Commandes : lecture/écriture propriétaire
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.clientId || 
         request.auth.uid == resource.data.restaurantId);
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.restaurantId;
    }
    
    // Users : lecture/écriture propriétaire
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Déployer les règles :
```bash
firebase deploy --only firestore:rules
```

### 2. Clés API

- ✅ Ne jamais commiter `.env.local`
- ✅ Utiliser des variables d'environnement
- ✅ Restreindre les clés Firebase dans la console
- ✅ Activer App Check pour Firebase

---

## 📊 Monitoring

### 1. Firebase Analytics

Ajouter dans `src/services/firebase.ts` :
```typescript
import { getAnalytics } from 'firebase/analytics';

export const analytics = getAnalytics(app);
```

### 2. Performance Monitoring

```bash
npm install firebase
```

Ajouter dans `src/main.tsx` :
```typescript
import { getPerformance } from 'firebase/performance';

const perf = getPerformance();
```

### 3. Crashlytics (Optionnel)

Pour suivre les erreurs en production.

---

## 🧪 Tests Post-Déploiement

### Checklist Complète

#### Fonctionnalités de Base
- [ ] Page d'accueil se charge
- [ ] Sélection Client/Chef fonctionne
- [ ] Authentification fonctionne
- [ ] Carte interactive s'affiche
- [ ] Restaurants sont visibles

#### Client
- [ ] Recherche de restaurants
- [ ] Consultation des menus
- [ ] Ajout au panier
- [ ] Passage de commande
- [ ] Suivi de commande
- [ ] Chat avec restaurant
- [ ] Chatbot fonctionne

#### Chef
- [ ] Création de profil
- [ ] Ajout de plats au menu
- [ ] Réception de commandes
- [ ] Mise à jour du statut
- [ ] Chat avec clients
- [ ] Statistiques

#### Mobile
- [ ] Responsive sur iPhone
- [ ] Responsive sur Android
- [ ] Pas de zoom accidentel
- [ ] Navigation tactile fluide
- [ ] PWA installable

#### Performance
- [ ] Temps de chargement < 3s
- [ ] Score Lighthouse > 90
- [ ] Pas d'erreurs console
- [ ] Images optimisées

---

## 🐛 Dépannage

### Problème : Build échoue

```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problème : Variables d'environnement non trouvées

Vérifier que :
1. Le fichier `.env.local` existe
2. Les variables commencent par `VITE_`
3. Le serveur a été redémarré après modification

### Problème : Firebase deploy échoue

```bash
# Se reconnecter
firebase logout
firebase login

# Vérifier le projet
firebase projects:list
firebase use votre-projet-id
```

### Problème : PWA ne s'installe pas

1. Vérifier que le site est en HTTPS
2. Vérifier le manifest.json
3. Vérifier les icônes
4. Vider le cache du navigateur

---

## 📈 Optimisations Post-Déploiement

### 1. CDN et Cache

Firebase Hosting active automatiquement :
- ✅ CDN global
- ✅ Cache des assets statiques
- ✅ Compression gzip/brotli

### 2. Images

Optimiser les images :
```bash
# Installer sharp
npm install -g sharp-cli

# Optimiser
sharp -i public/logo.png -o public/logo-optimized.png --quality 80
```

### 3. Code Splitting

Vite fait déjà du code splitting automatique, mais vous pouvez améliorer :
```typescript
// Lazy loading des composants
const ChefDashboard = lazy(() => import('./components/ChefDashboard'));
```

---

## 🔄 Mises à Jour

### Déploiement d'une Mise à Jour

```bash
# 1. Tester localement
npm run dev

# 2. Créer le build
npm run build

# 3. Tester le build
npm run preview

# 4. Déployer
firebase deploy

# 5. Vérifier en production
```

### Rollback (Retour en Arrière)

```bash
# Voir l'historique des déploiements
firebase hosting:releases:list

# Rollback vers une version précédente
firebase hosting:rollback
```

---

## 📱 App Stores (Optionnel)

### Transformer en App Native

Utiliser **Capacitor** pour créer des apps iOS/Android :

```bash
# Installer Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init

# Ajouter les plateformes
npx cap add ios
npx cap add android

# Build et sync
npm run build
npx cap sync

# Ouvrir dans Xcode/Android Studio
npx cap open ios
npx cap open android
```

---

## 🎉 Félicitations !

Votre application GeoResto est maintenant déployée ! 🚀

### URLs Importantes

- **Production** : https://votre-projet.web.app
- **Firebase Console** : https://console.firebase.google.com
- **Analytics** : https://analytics.google.com

### Support

- **Documentation** : Voir les fichiers `.md` du projet
- **Issues** : Créer un ticket sur GitHub
- **Email** : support@georesto.com

---

**Bon déploiement ! 🎊**
