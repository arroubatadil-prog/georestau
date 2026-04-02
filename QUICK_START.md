# ⚡ Quick Start - GeoResto

## 🎯 En 3 Minutes Chrono !

### 1️⃣ Lancer l'Application (30 secondes)

```bash
npm run dev
```

✅ Ouvrir : **http://localhost:5174**

---

### 2️⃣ Tester le Mobile (1 minute)

**Option A : Simulateur**
1. Appuyer sur **F12** (DevTools)
2. Appuyer sur **Ctrl+Shift+M** (Mode mobile)
3. Sélectionner **"iPhone 14 Pro"**

**Option B : Vrai Téléphone**
1. Trouver votre IP : `ipconfig`
2. Lancer : `npm run dev -- --host`
3. Sur le téléphone : `http://VOTRE_IP:5174`

---

### 3️⃣ Tester le Chatbot (1 minute)

1. Cliquer sur le **bouton robot 🤖** (en bas à droite)
2. Taper : **"C'est quoi GeoResto ?"**
3. Taper : **"Comment commander ?"**
4. Taper : **"Restaurant près de moi"**

✅ Le chatbot répond instantanément !

---

## 🎨 Fonctionnalités à Tester

### Client
```
1. Cliquer sur "Je suis Client"
2. Scanner le QR code OU créer un compte
3. Voir la carte avec les restaurants
4. Cliquer sur un restaurant
5. Ajouter des plats au panier
6. Commander
7. Suivre la commande
8. Discuter avec le chatbot
```

### Chef
```
1. Cliquer sur "Je suis Chef"
2. Créer un compte restaurant
3. Ajouter des plats au menu
4. Recevoir des commandes
5. Mettre à jour le statut
6. Voir les statistiques
```

---

## 📱 Optimisations Mobile

### ✅ Vérifier

- [ ] Pas de zoom accidentel quand on clique
- [ ] Les boutons sont faciles à toucher (44px)
- [ ] La navigation est en bas de l'écran
- [ ] Le texte est lisible sans zoom
- [ ] La carte fonctionne avec les doigts
- [ ] Le chatbot s'affiche correctement

---

## 🤖 Chatbot Intelligent

### Questions à Tester

**Sur l'App**
```
"C'est quoi GeoResto ?"
"Quelles sont les fonctionnalités ?"
"Est-ce gratuit ?"
```

**Sur les Commandes**
```
"Comment commander ?"
"Où est ma commande ?"
"Puis-je annuler ?"
```

**Sur les Restaurants**
```
"Restaurant près de moi"
"Plat le moins cher"
"Numéro de [Restaurant]"
```

**Multilingue**
```
Cliquer sur EN : "What is GeoResto?"
Cliquer sur AR : "ما هو GeoResto؟"
```

---

## 🚀 Déploiement Rapide

```bash
# Build
npm run build

# Deploy Firebase
firebase deploy

# OU Deploy Vercel
vercel --prod
```

---

## 📚 Documentation Complète

- **[README_COMPLET.md](README_COMPLET.md)** - Vue d'ensemble
- **[MOBILE_OPTIMIZATIONS.md](MOBILE_OPTIMIZATIONS.md)** - Détails mobile
- **[CHATBOT_TRAINING.md](CHATBOT_TRAINING.md)** - Système chatbot
- **[DEPLOIEMENT.md](DEPLOIEMENT.md)** - Guide déploiement

---

## 🐛 Problèmes ?

### Le serveur ne démarre pas
```bash
rm -rf node_modules
npm install
npm run dev
```

### Le chatbot ne répond pas
- Vérifier la clé Gemini dans `.env.local`
- Vérifier la console (F12)

### La carte ne s'affiche pas
- Autoriser la géolocalisation
- Vérifier la connexion internet

---

## 💡 Astuces

- **Ctrl+Shift+M** : Mode mobile dans le navigateur
- **F12** : Ouvrir la console pour debug
- **Ctrl+R** : Rafraîchir la page
- **Ctrl+Shift+R** : Rafraîchir sans cache

---

## 🎉 C'est Tout !

Votre application est prête ! 🚀

**Serveur** : http://localhost:5174
**Chatbot** : Bouton 🤖 en bas à droite
**Mobile** : Ctrl+Shift+M dans le navigateur

---

**Bon développement ! 💻✨**
