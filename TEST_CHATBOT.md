# 🧪 Guide de Test du Chatbot - GeoResto

## 🎯 Comment Tester

### 1. Lancer l'Application
```bash
npm run dev
```
Ouvrir : http://localhost:5174

### 2. Accéder au Chatbot
- Cliquer sur le bouton **orange avec l'icône robot** 🤖 en bas à droite
- Le chat s'ouvre

### 3. Tester les Questions

## ✅ Questions à Tester (Français)

### Sur l'Application
```
C'est quoi GeoResto ?
Quelles sont les fonctionnalités ?
Est-ce gratuit ?
Comment ça marche ?
```

**Résultat attendu** : Réponse instantanée avec description de l'app et emojis

---

### Sur les Commandes
```
Comment commander ?
Comment passer une commande ?
Puis-je annuler ma commande ?
Où est ma commande ?
Comment suivre ma commande ?
```

**Résultat attendu** : Instructions étape par étape avec emojis

---

### Sur la Livraison
```
Combien coûte la livraison ?
Quels sont les frais de livraison ?
Combien de temps pour la livraison ?
Livrez-vous chez moi ?
```

**Résultat attendu** : Infos sur la livraison

---

### Sur les Restaurants
```
Quel est le restaurant le plus proche ?
Restaurant près de moi
Quel est le plat le moins cher ?
Quel est le numéro de [nom du restaurant] ?
Où se trouve [nom du restaurant] ?
Est-ce que [nom du restaurant] livre ?
```

**Résultat attendu** : 
- Pour "plus proche" : Calcul de distance avec le restaurant le plus proche
- Pour "moins cher" : Nom du plat et prix
- Pour "numéro" : Numéro cliquable (si disponible)
- Pour "adresse" : Adresse avec lien Google Maps

---

### Sur le Compte
```
Dois-je créer un compte ?
Comment utiliser le QR code ?
Comment scanner le code ?
Créer un compte
```

**Résultat attendu** : Explications sur le compte et QR code

---

### Sur le Paiement
```
Comment payer ?
Quels modes de paiement ?
Puis-je payer par carte ?
```

**Résultat attendu** : Infos sur les modes de paiement

---

### Problèmes Techniques
```
J'ai un bug
Ça ne marche pas
J'ai un problème
Pourquoi vous demandez ma position ?
```

**Résultat attendu** : Solutions de dépannage

---

## 🌍 Test Multilingue

### Changer de Langue
Cliquer sur les boutons **FR / EN / AR** en haut du chat

### Questions en Anglais
```
What is GeoResto?
How to order?
How much is delivery?
Do I need an account?
```

### Questions en Arabe
```
ما هو GeoResto؟
كيف أطلب؟
كم تكلفة التوصيل؟
هل أحتاج إلى حساب؟
```

**Résultat attendu** : Réponses dans la langue sélectionnée

---

## 🎨 Vérifications Visuelles

### ✅ Checklist
- [ ] Le bouton chatbot est visible en bas à droite
- [ ] Le chat s'ouvre en cliquant sur le bouton
- [ ] Les messages s'affichent correctement
- [ ] Les emojis sont visibles
- [ ] Les réponses sont rapides (<1 seconde pour base de connaissances)
- [ ] Les numéros de téléphone sont cliquables (format `tel:`)
- [ ] Les adresses ont un lien Google Maps
- [ ] Le scroll fonctionne dans le chat
- [ ] Les boutons de langue (FR/EN/AR) fonctionnent
- [ ] Le thème sombre est supporté
- [ ] Le chat est responsive (mobile)

---

## 🐛 Tests de Cas Limites

### Questions Vagues
```
Aide
Help
?
Bonjour
```
**Résultat attendu** : Message d'accueil avec suggestions

### Questions Complexes
```
Je veux commander une pizza pas chère près de chez moi avec livraison gratuite
```
**Résultat attendu** : Réponse intelligente combinant plusieurs critères

### Questions Hors Sujet
```
Quelle est la capitale de la France ?
Comment faire un gâteau ?
```
**Résultat attendu** : Redirection vers les fonctionnalités de l'app

### Questions avec Fautes
```
Comant comander ?
Restorant proch
```
**Résultat attendu** : Détection malgré les fautes

---

## 📊 Performance

### Temps de Réponse Attendu

| Type de Question | Temps | Source |
|------------------|-------|--------|
| Base de connaissances | <100ms | Niveau 1 |
| Logique métier | <500ms | Niveau 2 |
| IA Gemini | 1-3s | Niveau 3 |

### Test de Charge
```
Envoyer 10 questions rapidement
```
**Résultat attendu** : Toutes les réponses arrivent dans l'ordre

---

## 🔍 Debug

### Voir le Contexte AI
Le chatbot affiche "Contexte AI: ..." sous le header quand il utilise l'IA.

### Console du Navigateur
Ouvrir DevTools (F12) → Console pour voir :
- Les erreurs éventuelles
- Les logs de debug
- Les appels API

---

## 📱 Test Mobile

### Sur Téléphone
1. Lancer avec `npm run dev -- --host`
2. Ouvrir sur mobile : `http://VOTRE_IP:5174`
3. Tester le chatbot

### Vérifications Mobile
- [ ] Le bouton est accessible (pas caché)
- [ ] Le chat prend toute la largeur
- [ ] Le clavier ne cache pas l'input
- [ ] Le scroll fonctionne
- [ ] Les boutons sont assez grands (44px)

---

## 🎯 Scénarios Complets

### Scénario 1 : Nouveau Client
```
1. "C'est quoi GeoResto ?"
2. "Comment commander ?"
3. "Dois-je créer un compte ?"
4. "Quel est le restaurant le plus proche ?"
```

### Scénario 2 : Client Pressé
```
1. "Restaurant près de moi"
2. "Quel est le plat le moins cher ?"
3. "Combien de temps pour la livraison ?"
```

### Scénario 3 : Problème Technique
```
1. "Ça ne marche pas"
2. "J'ai un bug"
3. "Pourquoi vous demandez ma position ?"
```

---

## 📈 Métriques de Succès

### Objectifs
- ✅ **80%** des questions répondues par la base de connaissances (Niveau 1)
- ✅ **15%** des questions répondues par la logique métier (Niveau 2)
- ✅ **5%** des questions nécessitent l'IA (Niveau 3)
- ✅ **<1s** temps de réponse moyen
- ✅ **95%** satisfaction utilisateur

---

## 🚀 Après les Tests

### Si Tout Fonctionne
1. Déployer en production
2. Monitorer les questions réelles
3. Ajouter de nouvelles connaissances

### Si Problèmes
1. Vérifier la console (F12)
2. Vérifier les imports
3. Vérifier que Gemini API est configurée
4. Consulter `CHATBOT_TRAINING.md`

---

## 💡 Astuces

- **Tester en mode incognito** pour éviter le cache
- **Tester avec différents navigateurs** (Chrome, Firefox, Safari)
- **Tester avec et sans géolocalisation**
- **Tester avec connexion lente** (DevTools → Network → Slow 3G)

---

**Bon test ! 🎉**
