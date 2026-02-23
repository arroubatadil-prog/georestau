# 🤖 Guide de Test - IA d'Analyse de Menu

## Changements effectués

### 1. Remplacement de la bibliothèque Gemini
- ❌ Ancienne : `@google/genai` (v1.30.0) - API obsolète
- ✅ Nouvelle : `@google/generative-ai` - API officielle Google

### 2. Corrections apportées
- Mise à jour de toutes les fonctions pour utiliser la nouvelle API
- Correction du format des requêtes
- Ajout de meilleurs logs d'erreur
- Création du fichier de types TypeScript pour les variables d'environnement

## Comment tester

### 1. Vérifier la clé API
La clé Gemini est configurée dans `.env.local` :
```
VITE_GEMINI_KEY=AIzaSyALi0nC1k_3XH75vN3C3Ed3pOkig83Ywoc
```

### 2. Redémarrer le serveur de développement
```bash
# Arrêter le serveur actuel (Ctrl+C)
npm run dev
```

### 3. Tester l'analyse d'image de menu

#### Étapes :
1. Connectez-vous en tant que restaurant
2. Allez dans l'onglet **Menu**
3. Cliquez sur le bouton **Scanner** (avec l'icône caméra)
4. Sélectionnez une photo de menu (menu papier, carte de restaurant, etc.)
5. L'IA devrait analyser l'image et extraire :
   - Noms des plats
   - Prix
   - Descriptions
   - Catégories (Starters, Mains, Desserts, Drinks)

### 4. Tester la génération de description

#### Étapes :
1. Dans l'onglet Menu, remplissez :
   - **Nom** : ex. "Burger Maison"
   - **Ingrédients** : ex. "Boeuf, Fromage, Salade, Tomate"
2. Cliquez sur l'icône ✨ (Sparkles) à côté du champ Ingrédients
3. Une description gastronomique devrait être générée automatiquement

### 5. Tester la génération d'image

#### Étapes :
1. Entrez un nom de plat
2. Cliquez sur **Photo AI**
3. Une image du plat devrait être générée

## Messages d'erreur possibles

### ❌ "Clé API manquante dans .env.local"
**Solution** : Vérifiez que le fichier `.env.local` existe à la racine du projet avec la clé VITE_GEMINI_KEY

### ❌ "NetworkError when attempting to fetch resource"
**Causes possibles** :
1. Pas de connexion Internet
2. Clé API invalide ou expirée
3. Quota API dépassé
4. Firewall/Proxy bloquant l'accès à l'API Google

**Solutions** :
- Vérifier la connexion Internet
- Vérifier que la clé API est valide sur https://makersuite.google.com/app/apikey
- Vérifier les quotas sur Google Cloud Console

### ❌ "Aucun plat détecté"
**Causes** :
- Image de menu floue ou illisible
- Menu dans une langue non supportée
- Format d'image non standard

**Solutions** :
- Utiliser une photo claire et bien éclairée
- S'assurer que le texte est lisible
- Essayer avec un menu en français ou anglais

## Fonctionnalités IA disponibles

### 1. Analyse d'image de menu (parseMenuFromImage)
- Extrait automatiquement les plats d'une photo
- Détecte les prix
- Génère des descriptions
- Catégorise automatiquement

### 2. Génération de description (generateMenuDescription)
- Crée des descriptions gastronomiques
- Basé sur le nom et les ingrédients
- Maximum 20 mots

### 3. Suggestion de catégorie (suggestMenuCategory)
- Classifie automatiquement : Starters, Mains, Desserts, Drinks
- Basé sur le nom du plat

### 4. Chatbot contextuel (generateContextualResponse)
- Répond aux questions sur les restaurants
- Utilise uniquement les données de l'application
- Évite les hallucinations

### 5. Classification de questions (classifyQuestionDomain)
- Détermine si une question concerne les restaurants
- Utilisé pour filtrer les questions du chatbot

## Logs de débogage

Ouvrez la console du navigateur (F12) pour voir :
- "1. Envoi de l'image à Gemini..." - Début de l'analyse
- "2. Réponse brute de l'IA : ..." - Réponse JSON de Gemini
- "3. Plats extraits : ..." - Plats parsés avec succès

## Limites de l'API Gemini

### Quotas gratuits (par jour) :
- 60 requêtes par minute
- 1500 requêtes par jour
- 1 million de tokens par jour

### Taille des images :
- Maximum : 4 MB
- Formats supportés : JPEG, PNG, WebP, HEIC, HEIF

## Dépannage avancé

### Tester manuellement l'API dans la console :
```javascript
// Ouvrir la console (F12) et taper :
const { GoogleGenerativeAI } = await import("@google/generative-ai");
const genAI = new GoogleGenerativeAI("VOTRE_CLE_API");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const result = await model.generateContent("Hello!");
const response = await result.response;
console.log(response.text());
```

Si cela fonctionne, l'API est opérationnelle.

## Support

Si les problèmes persistent :
1. Vérifier les logs de la console
2. Vérifier la clé API sur Google AI Studio
3. Vérifier les quotas sur Google Cloud Console
4. Essayer avec une autre image de menu

---

**Note** : L'analyse d'image fonctionne mieux avec :
- Photos claires et bien éclairées
- Texte lisible (pas de reflets)
- Menus en français ou anglais
- Format standard (liste de plats avec prix)
