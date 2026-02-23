# 🔧 Fix : Configuration Google Auth Firebase

## ❌ **Problème**
Erreur : "Cette opération n'est pas autorisée" lors du clic sur "Se connecter avec Google"

## 🎯 **Cause**
L'authentification Google n'est pas activée dans la console Firebase.

## ✅ **Solution : Configuration Firebase**

### **Étape 1 : Accéder à Firebase Console**
1. Aller sur : https://console.firebase.google.com/
2. Sélectionner votre projet : **georestau-13490**
3. Cliquer sur **"Authentication"** dans le menu de gauche

### **Étape 2 : Activer Google Auth**
1. Cliquer sur l'onglet **"Sign-in method"**
2. Dans la liste des fournisseurs, trouver **"Google"**
3. Cliquer sur **"Google"** pour l'ouvrir
4. **Activer** le bouton en haut à droite
5. Remplir les champs requis :
   - **Nom public du projet** : GeoResto
   - **Email d'assistance** : votre-email@gmail.com
6. Cliquer sur **"Enregistrer"**

### **Étape 3 : Configurer les Domaines Autorisés**
1. Toujours dans **"Sign-in method"**
2. Descendre jusqu'à **"Domaines autorisés"**
3. Vérifier que ces domaines sont présents :
   - `localhost` ✅
   - `georestau-13490.web.app` ✅
   - `georestau-13490.firebaseapp.com` ✅
4. Si manquants, cliquer sur **"Ajouter un domaine"** et les ajouter

### **Étape 4 : Vérifier la Configuration**
Dans l'onglet **"Users"**, vous devriez voir :
- **Fournisseurs activés** : Email/Password + Google

## 🚀 **Test Après Configuration**

### **1. Redémarrer le Serveur**
```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

### **2. Tester la Connexion Google**
1. Aller sur http://localhost:5174
2. Cliquer sur "Je suis Client" ou "Je suis Chef"
3. Cliquer sur **"Se connecter avec Google"**
4. ✅ Une popup Google devrait s'ouvrir

## 🔍 **Vérifications Supplémentaires**

### **Si l'erreur persiste :**

**1. Vérifier les Clés API**
Dans `src/services/firebase.ts`, vérifier que :
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyA9bKixiHlfIdffn5gzn-I8VJGnmexmttk", // ✅ Correct
  authDomain: "georestau-13490.firebaseapp.com",     // ✅ Correct
  projectId: "georestau-13490",                      // ✅ Correct
  // ...
};
```

**2. Vider le Cache du Navigateur**
- Appuyer sur **F12** (DevTools)
- Clic droit sur le bouton **Actualiser**
- Sélectionner **"Vider le cache et actualiser"**

**3. Tester en Navigation Privée**
- Ouvrir un onglet privé/incognito
- Tester la connexion Google

## 📱 **Configuration pour Production**

### **Quand vous déployez :**
1. Ajouter votre domaine de production dans **"Domaines autorisés"**
2. Exemple : `votre-app.com`, `www.votre-app.com`

## 🐛 **Autres Erreurs Possibles**

### **"Popup fermé par l'utilisateur"**
```
Cause : L'utilisateur ferme la popup
Solution : Réessayer
```

### **"Domaine non autorisé"**
```
Cause : localhost pas dans les domaines autorisés
Solution : Ajouter localhost dans Firebase Console
```

### **"Quota dépassé"**
```
Cause : Trop de tentatives
Solution : Attendre 15 minutes
```

## 📋 **Checklist de Configuration**

- [ ] **Google Auth activé** dans Firebase Console
- [ ] **Domaines autorisés** configurés (localhost inclus)
- [ ] **Nom public** et **email support** renseignés
- [ ] **Cache navigateur** vidé
- [ ] **Serveur redémarré**
- [ ] **Test en navigation privée** effectué

## 🎯 **Résultat Attendu**

Après configuration, cliquer sur "Se connecter avec Google" devrait :
1. **Ouvrir une popup Google**
2. **Demander de choisir un compte**
3. **Demander les permissions**
4. **Connecter automatiquement**
5. **Rediriger vers l'interface appropriée**

## 📞 **Support**

Si le problème persiste après ces étapes :
1. Vérifier les **logs de la console** (F12)
2. Prendre une **capture d'écran** de l'erreur
3. Vérifier que le **projet Firebase est actif**

La configuration Google Auth devrait maintenant fonctionner ! 🎉