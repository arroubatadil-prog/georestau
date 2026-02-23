# 📱 Guide de Test Mobile - GeoResto

## 🎯 Comment Tester sur Téléphone

### Méthode 1 : Simulateur dans le Navigateur (Rapide)

1. **Lancer l'application**
   ```bash
   npm run dev
   ```

2. **Ouvrir dans Chrome/Edge**
   - Appuyer sur `F12` pour ouvrir DevTools
   - Appuyer sur `Ctrl+Shift+M` (ou cliquer sur l'icône téléphone)
   - Sélectionner un appareil : **iPhone 14 Pro** ou **Galaxy S21**

3. **Tester les interactions**
   - ✅ Cliquer sur les boutons (doivent être faciles à toucher)
   - ✅ Scroller la page (doit être fluide)
   - ✅ Ouvrir le menu en bas (navigation)
   - ✅ Tester le scanner QR

### Méthode 2 : Sur Votre Vrai Téléphone (Recommandé)

#### Option A : Via le Réseau Local

1. **Trouver votre IP locale**
   ```bash
   # Windows
   ipconfig
   # Chercher "Adresse IPv4" (ex: 192.168.1.10)
   ```

2. **Lancer avec l'option host**
   ```bash
   npm run dev -- --host
   ```

3. **Ouvrir sur le téléphone**
   - Connecter le téléphone au **même WiFi**
   - Ouvrir le navigateur
   - Aller sur : `http://192.168.1.10:5173` (remplacer par votre IP)

#### Option B : Via Tunnel (si WiFi différent)

1. **Installer ngrok** (gratuit)
   - Télécharger : https://ngrok.com/download
   - Extraire et placer dans le dossier du projet

2. **Lancer l'app**
   ```bash
   npm run dev
   ```

3. **Dans un autre terminal**
   ```bash
   ngrok http 5173
   ```

4. **Copier l'URL** (ex: `https://abc123.ngrok.io`)
   - Ouvrir cette URL sur votre téléphone

### Méthode 3 : Build Production (Test Final)

```bash
# Créer le build optimisé
npm run build

# Tester le build
npm run preview -- --host

# Ouvrir sur téléphone : http://VOTRE_IP:4173
```

## ✅ Checklist de Test

### Écran d'Accueil
- [ ] Les deux cartes (Client/Chef) sont bien visibles
- [ ] Le texte est lisible sans zoom
- [ ] Les boutons répondent au toucher
- [ ] L'animation est fluide

### Authentification
- [ ] Le clavier ne cache pas les champs
- [ ] Les inputs sont faciles à remplir
- [ ] Le bouton QR Scanner s'ouvre correctement
- [ ] La caméra fonctionne (si test sur vrai téléphone)

### Navigation Client
- [ ] La carte s'affiche en plein écran
- [ ] On peut zoomer/dézoomer avec les doigts
- [ ] La barre de recherche est accessible
- [ ] Le menu en bas est cliquable
- [ ] Les restaurants s'affichent correctement

### Navigation Chef
- [ ] Les 5 onglets en bas sont visibles
- [ ] On peut switcher entre les onglets
- [ ] La carte de localisation fonctionne
- [ ] Le formulaire de profil est utilisable

### Performance
- [ ] Pas de lag lors du scroll
- [ ] Les transitions sont fluides
- [ ] Pas de zoom accidentel
- [ ] La page ne "bounce" pas sur iOS

## 🐛 Problèmes Courants

### "Je ne vois pas l'app sur mon téléphone"
- Vérifier que le téléphone est sur le **même WiFi**
- Vérifier que le **firewall** n'est pas actif
- Essayer avec `ngrok` (Méthode 2B)

### "Le clavier cache les champs"
- C'est normal sur certains téléphones
- Scroller vers le haut pour voir le champ
- Ou utiliser le mode paysage

### "La caméra ne s'ouvre pas"
- Vérifier les permissions du navigateur
- Essayer avec Chrome (meilleur support)
- Sur iOS, utiliser Safari (pas Chrome)

### "L'app est trop lente"
- Tester avec le build de production (`npm run build`)
- Vérifier la connexion internet
- Fermer les autres apps

## 📊 Tailles d'Écran Testées

| Appareil | Résolution | Status |
|----------|-----------|--------|
| iPhone SE | 375x667 | ✅ Optimisé |
| iPhone 14 Pro | 393x852 | ✅ Optimisé |
| Samsung S21 | 360x800 | ✅ Optimisé |
| iPad Mini | 768x1024 | ✅ Optimisé |

## 🎨 Différences Mobile vs Desktop

| Fonctionnalité | Mobile | Desktop |
|----------------|--------|---------|
| Navigation | En bas (fixe) | À gauche (sidebar) |
| Taille texte | Plus petit | Plus grand |
| Boutons | 44px minimum | 36px minimum |
| Hover effects | Désactivés | Activés |
| Padding | Réduit (p-4) | Normal (p-6) |

## 🚀 Déploiement

Une fois satisfait des tests :

```bash
# Build final
npm run build

# Déployer sur Firebase
firebase deploy
```

L'app sera accessible sur : `https://votre-projet.web.app`

## 💡 Astuces

- **Ajouter à l'écran d'accueil** : Sur mobile, cliquer sur "Ajouter à l'écran d'accueil" pour une expérience app native
- **Mode sombre** : Tester avec le thème sombre activé
- **Rotation** : Tester en mode portrait ET paysage
- **Connexion lente** : Tester avec 3G simulé (DevTools → Network → Slow 3G)
