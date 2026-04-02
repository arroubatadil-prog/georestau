import { GoogleGenerativeAI } from "@google/generative-ai";

// Récupération de la clé
const apiKey = import.meta.env.VITE_GEMINI_KEY || '';
console.log('🔑 Clé Gemini chargée:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MANQUANTE');
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// --- FONCTION DE NETTOYAGE JSON (C'est elle la clé !) ---
const cleanAndParseJSON = (text: string) => {
    try {
        // 1. On enlève les balises Markdown ```json et ```
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '');
        
        // 2. On cherche le début '[' et la fin ']' d'une liste
        const firstBracket = cleanText.indexOf('[');
        const lastBracket = cleanText.lastIndexOf(']');

        // 3. Si on trouve une liste, on l'extrait
        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanText = cleanText.substring(firstBracket, lastBracket + 1);
            return JSON.parse(cleanText);
        }
        
        // 4. Tentative désespérée : peut-être que l'IA a renvoyé un seul objet {} au lieu d'une liste []
        const firstCurly = cleanText.indexOf('{');
        const lastCurly = cleanText.lastIndexOf('}');
        if (firstCurly !== -1 && lastCurly !== -1) {
            const singleObj = JSON.parse(cleanText.substring(firstCurly, lastCurly + 1));
            return [singleObj]; // On le met dans une liste pour pas casser l'app
        }

        throw new Error("Aucune structure JSON trouvée");
    } catch (e) {
        console.error("Échec du nettoyage JSON. Texte reçu :", text);
        return [];
    }
};

export const generateMenuDescription = async (dishName: string, ingredients: string): Promise<string> => {
  if (!genAI) return "Description par défaut (Clé manquante).";
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`Write a short, gourmet description (max 20 words) for: ${dishName} (${ingredients}).`);
    const response = await result.response;
    return response.text()?.trim() || "Délicieux plat fait maison.";
  } catch (error) {
    console.error('Error generating description:', error);
    return "Délicieux plat fait maison.";
  }
};

export const suggestMenuCategory = async (dishName: string): Promise<string> => {
    if (!genAI) return "Mains";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Classify "${dishName}" into one word only: Starters, Mains, Desserts, or Drinks.`);
        const response = await result.response;
        return response.text()?.trim().replace('.', '') || "Mains";
    } catch (e) { 
        console.error('Error suggesting category:', e);
        return "Mains"; 
    }
}

export const parseMenuFromImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<any[]> => {
    if (!genAI) {
        alert("Clé API manquante dans .env.local");
        return [];
    }

    console.log("1. Envoi de l'image à Gemini..."); // LOG DE DEBUG

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
            You are a JSON extractor. Look at this menu image.
            Extract ALL dish names, prices, and descriptions.
            
            Output rules:
            1. Return ONLY a valid JSON Array.
            2. Do NOT speak. Do NOT add "Here is the json".
            3. Structure: [{"name": "Dish Name", "description": "Description", "price": 10, "category": "Mains"}]
            4. If price is missing, use 0.
            5. Guess the category (Starters, Mains, Desserts, Drinks).
        `;

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const rawText = response.text() || '';
        
        console.log("2. Réponse brute de l'IA :", rawText); // LOG IMPORTANT : Regardez la console !

        const items = cleanAndParseJSON(rawText);
        
        console.log("3. Plats extraits :", items); // LOG DE SUCCÈS

        return items;

    } catch (error: any) {
        console.error("ERREUR CRITIQUE GEMINI:", error);
        
        // Diagnostic détaillé
        let errorMessage = "Erreur inconnue";
        if (error.status === 404) {
            errorMessage = "❌ Erreur 404: La clé API est invalide ou le modèle n'existe pas.\n\n";
            errorMessage += "Solutions:\n";
            errorMessage += "1. Vérifiez votre clé API sur https://aistudio.google.com/app/apikey\n";
            errorMessage += "2. Créez une nouvelle clé si nécessaire\n";
            errorMessage += "3. Mettez à jour le fichier .env.local avec: VITE_GEMINI_KEY=votre_nouvelle_cle";
        } else if (error.status === 429) {
            errorMessage = "❌ Quota API dépassé. Attendez quelques minutes ou utilisez une autre clé.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        alert(`Erreur IA: ${errorMessage}`);
        return [];
    }
};

export const generateDishImage = async (dishName: string, description: string): Promise<string | null> => {
    return null; 
};

export const generateChatbotResponse = async (prompt: string): Promise<string> => {
  if (!genAI) return "L'IA n'est pas disponible.";
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text()?.trim() || "Je n'ai pas compris la question.";
  } catch (error) {
    console.error('Error generating chatbot response:', error);
    return "Je n'ai pas compris la question.";
  }
};

// Generate a response using only the provided app data (restaurants + optional user location).
// This helps keep the model grounded to the application's data and avoids hallucinations.
export const generateContextualResponse = async (
    question: string,
    restaurants: any[],
    userLocation?: { lat: number; lng: number } | null
): Promise<string> => {
    if (!genAI) return "L'IA n'est pas disponible.";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let context = `Tu es GeoResto, un assistant qui répond uniquement en utilisant les informations fournies ci-dessous. Ne fais aucune supposition en dehors des données. Réponds en français, de façon concise et précise.`;
        context += `\n\nDonnées (restaurants) :\n`;

        // Keep context compact: only relevant fields
        for (const r of restaurants.slice(0, 8)) {
            const menu = (r.menu || []).slice(0, 6).map((m: any) => ({ name: m.name, price: m.price ?? null }));
            context += `- name: ${r.name || '—'}; source: ${r.source || '—'}; phone: ${r.phone || '—'}; address: ${(r as any).address || (r as any).description || '—'}; lat:${r.location?.lat ?? '—'}; lng:${r.location?.lng ?? '—'}; delivery:${r.delivery ? 'yes' : 'no'}; menu:${JSON.stringify(menu)}\n`;
        }

        if (userLocation) {
            context += `\nPosition utilisateur: lat:${userLocation.lat}, lng:${userLocation.lng}\n`;
        }

        const prompt = `${context}\nQuestion: ${question}\n\nConsignes: Utilise uniquement les données ci-dessus. Si la donnée demandée n'est pas fournie, indique clairement que l'information n'est pas disponible. Ne pas inventer de numéro, d'adresse ou de menu. Rends la réponse courte (1-3 phrases).`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text()?.trim() || "Je n'ai pas compris la question.";
    } catch (error) {
        console.error('generateContextualResponse error', error);
        return "Je n'ai pas pu trouver la réponse avec les données disponibles.";
    }
};

// Classify whether a question is about restaurants/menus/locations.
export const classifyQuestionDomain = async (question: string): Promise<'domain' | 'other'> => {
    if (!genAI) return 'other';
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Classify the following question. If it is about restaurants, dishes, menus, prices, delivery, or location/distance, reply with the single word DOMAIN. Otherwise reply with OTHER.\n\nQuestion: ${question}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const txt = response.text().trim().toUpperCase();
        if (txt.includes('DOMAIN')) return 'domain';
        return 'other';
    } catch (e) {
        console.error('classification error', e);
        return 'other';
    }
};