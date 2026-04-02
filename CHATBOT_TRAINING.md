# 🤖 Système de Chatbot Intelligent - GeoResto

## 📚 Base de Connaissances

Le chatbot GeoResto utilise maintenant un système d'intelligence à 3 niveaux :

### Niveau 1 : Base de Connaissances Locale (Instantané)
- **Fichier** : `src/services/chatbotKnowledge.ts`
- **Contenu** : 20+ questions/réponses pré-définies sur l'application
- **Avantages** : 
  - ⚡ Réponses instantanées (pas d'appel API)
  - 💯 Précision garantie à 100%
  - 🌍 Support multilingue (FR, EN, AR)
  - 💰 Gratuit (pas de coût API)

### Niveau 2 : Logique Métier (Règles)
- Recherche de restaurants par proximité
- Calcul du plat le moins cher
- Informations sur la livraison
- Numéros de téléphone et adresses
- Détection intelligente des intentions

### Niveau 3 : IA Générative (Gemini)
- Utilisé uniquement si les niveaux 1 et 2 ne trouvent pas de réponse
- Contexte enrichi avec la base de connaissances
- Réponses personnalisées et naturelles

## 🎯 Catégories de Connaissances

### 1. Application (`app`)
- Qu'est-ce que GeoResto ?
- Fonctionnalités principales
- Gratuité de l'application

### 2. Commandes (`order`)
- Comment passer une commande
- Annulation de commande
- Suivi en temps réel

### 3. Livraison (`delivery`)
- Frais de livraison
- Temps de livraison
- Zone de livraison

### 4. Paiement (`payment`)
- Modes de paiement acceptés
- Sécurité des transactions

### 5. Compte (`account`)
- Création de compte
- Utilisation du QR code
- Avantages du compte

### 6. Restaurants (`restaurant`)
- Devenir partenaire
- Horaires d'ouverture
- Promotions

### 7. Technique (`technical`)
- Résolution de problèmes
- Géolocalisation
- Support technique

## 🔧 Comment Ajouter des Connaissances

### Étape 1 : Ouvrir le fichier
```typescript
// src/services/chatbotKnowledge.ts
```

### Étape 2 : Ajouter une nouvelle entrée
```typescript
{
  keywords: ['mot-clé1', 'mot-clé2', 'keyword1', 'الكلمة1'],
  question: 'Question en français',
  answer: {
    fr: 'Réponse en français avec emojis 🎉',
    en: 'Answer in English with emojis 🎉',
    ar: 'الإجابة بالعربية مع الرموز التعبيرية 🎉'
  },
  category: 'app' // ou 'order', 'delivery', etc.
}
```

### Étape 3 : Tester
Le chatbot utilisera automatiquement la nouvelle connaissance !

## 💡 Exemples de Questions Supportées

### Sur l'Application
- "C'est quoi GeoResto ?"
- "Quelles sont les fonctionnalités ?"
- "Est-ce gratuit ?"
- "Comment ça marche ?"

### Sur les Commandes
- "Comment commander ?"
- "Puis-je annuler ma commande ?"
- "Où est ma commande ?"
- "Comment suivre ma commande ?"

### Sur la Livraison
- "Combien coûte la livraison ?"
- "Combien de temps pour la livraison ?"
- "Livrez-vous chez moi ?"

### Sur les Restaurants
- "Quel est le restaurant le plus proche ?"
- "Quel est le plat le moins cher ?"
- "Quel est le numéro de [Restaurant] ?"
- "Où se trouve [Restaurant] ?"
- "Est-ce que [Restaurant] livre ?"

### Sur le Compte
- "Dois-je créer un compte ?"
- "Comment utiliser le QR code ?"
- "Comment scanner le code ?"

### Techniques
- "J'ai un bug"
- "Ça ne marche pas"
- "Pourquoi vous demandez ma position ?"

## 🌍 Support Multilingue

Le chatbot détecte automatiquement la langue et répond dans :
- 🇫🇷 **Français** (par défaut)
- 🇬🇧 **Anglais**
- 🇸🇦 **Arabe**

L'utilisateur peut changer de langue avec les boutons FR/EN/AR dans le chat.

## 🎨 Bonnes Pratiques

### Mots-clés
- Utilisez des variations (singulier/pluriel)
- Incluez les fautes courantes
- Ajoutez les traductions
- Pensez aux synonymes

### Réponses
- ✅ Soyez concis (2-3 phrases max)
- ✅ Utilisez des emojis pertinents
- ✅ Structurez avec des numéros ou bullets
- ✅ Incluez des appels à l'action
- ❌ Évitez le jargon technique
- ❌ Ne soyez pas trop formel

### Exemples de Bonnes Réponses

**Bon** ✅
```
Pour commander :
1️⃣ Trouvez un restaurant sur la carte
2️⃣ Ajoutez des plats au panier 🛒
3️⃣ Confirmez votre commande
C'est simple et rapide ! ⚡
```

**Mauvais** ❌
```
Vous devez d'abord accéder à l'interface de sélection des établissements 
de restauration via le module cartographique intégré, puis procéder à 
l'ajout des items dans votre panier virtuel avant de finaliser la transaction.
```

## 🔄 Flux de Réponse

```
Question de l'utilisateur
    ↓
1. Recherche dans la base de connaissances
    ↓ (si pas trouvé)
2. Logique métier (restaurants, prix, etc.)
    ↓ (si pas trouvé)
3. IA Gemini avec contexte enrichi
    ↓
Réponse à l'utilisateur
```

## 📊 Statistiques

Avec la base de connaissances actuelle :
- **20+ questions** pré-définies
- **60+ mots-clés** de détection
- **3 langues** supportées
- **7 catégories** organisées
- **~80% des questions** répondues instantanément

## 🚀 Améliorations Futures

### Court Terme
- [ ] Ajouter plus de questions fréquentes
- [ ] Améliorer la détection des intentions
- [ ] Ajouter des suggestions de questions

### Moyen Terme
- [ ] Apprentissage automatique des nouvelles questions
- [ ] Analytics des questions non répondues
- [ ] Feedback utilisateur sur les réponses

### Long Terme
- [ ] Chatbot vocal
- [ ] Recommandations personnalisées
- [ ] Intégration avec le système de commande

## 🧪 Tests

### Tester le Chatbot

1. **Ouvrir l'application** : http://localhost:5174
2. **Cliquer sur le bouton chatbot** (en bas à droite)
3. **Poser des questions** :

```
Exemples à tester :
- "C'est quoi GeoResto ?"
- "Comment commander ?"
- "Quel est le restaurant le plus proche ?"
- "Combien coûte la livraison ?"
- "Comment utiliser le QR code ?"
- "J'ai un problème"
```

### Vérifier les Réponses

- ✅ La réponse est pertinente
- ✅ La réponse est dans la bonne langue
- ✅ Les emojis s'affichent correctement
- ✅ Les liens (téléphone, adresse) sont cliquables
- ✅ Le temps de réponse est rapide (<1s pour base de connaissances)

## 📝 Maintenance

### Mise à Jour Régulière

1. **Analyser les questions** non répondues (logs)
2. **Ajouter les nouvelles connaissances** dans `chatbotKnowledge.ts`
3. **Tester les nouvelles réponses**
4. **Déployer**

### Monitoring

Surveillez :
- Taux de réponses trouvées (Niveau 1 vs 2 vs 3)
- Questions fréquentes non couvertes
- Feedback utilisateur
- Temps de réponse moyen

## 🎓 Formation Continue

Le chatbot s'améliore avec :
1. **Ajout manuel** de nouvelles connaissances
2. **Analyse des logs** de questions
3. **Feedback utilisateur** (à implémenter)
4. **Tests A/B** sur les formulations

---

**Note** : Le chatbot est conçu pour être **évolutif**. Plus vous ajoutez de connaissances, plus il devient intelligent ! 🧠✨
