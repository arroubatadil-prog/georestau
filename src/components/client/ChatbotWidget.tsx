import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Bot } from 'lucide-react';
import { Restaurant } from '../../types';
import { useI18n } from '../../i18n';
import { generateChatbotResponse, classifyQuestionDomain } from '../../services/gemini';
import { searchKnowledge, generateEnrichedContext } from '../../services/chatbotKnowledge';

interface ChatbotWidgetProps {
  restaurants: Restaurant[];
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper: geocode a location name to coordinates using Nominatim
const geocodeLocation = async (locationName: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.warn('Geocoding failed:', e);
  }
  return null;
}

const getBotResponse = async (input: string, restaurants: Restaurant[], userLocation?: { lat: number; lng: number } | null, debugCb?: (s: string | null) => void, language?: string, conversationHistory?: ChatMessage[], forceUserLocation?: boolean): Promise<string> => {
  const lang = (language || 'fr').toLowerCase().startsWith('ar') ? 'ar' : (language || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';
  const text = input.toLowerCase().trim();

  // Localization helper for fixed UI messages
  const L: Record<string, Record<string, any>> = {
    greeting: {
      fr: "Bonjour ! Je suis GeoResto, votre assistant restauration. Vous pouvez me demander le restaurant le plus proche, un plat moins cher, une adresse, un numéro, ou des informations sur la livraison.",
      en: "Hello! I'm GeoResto, your restaurant assistant. Ask me for the nearest restaurant, cheapest dish, address, phone, or delivery info.",
      ar: "مرحبًا! أنا مساعد GeoResto للمطاعم. اسألني عن أقرب مطعم، أرخص طبق، العنوان، الهاتف، أو معلومات التوصيل."
    },
    not_found_location: {
      fr: (label: string) => `Je n'ai pas trouvé la location "${label}". Pouvez-vous être plus précis ?`,
      en: (label: string) => `I couldn't find the location "${label}". Can you be more specific?`,
      ar: (label: string) => `لم أتمكن من العثور على الموقع "${label}". هل يمكنك أن تكون أكثر دقة؟`
    },
    allow_geo_prompt: {
      fr: "Pour trouver le restaurant le plus proche, veuillez autoriser l'accès à votre position (géolocalisation).",
      en: "To find the nearest restaurant, please allow access to your location (geolocation).",
      ar: "للعثور على أقرب مطعم، يرجى السماح بالوصول إلى موقعك (نظام تحديد المواقع)."
    },
    no_restaurant: {
      fr: 'Aucun restaurant trouvé.',
      en: 'No restaurant found.',
      ar: 'لم يتم العثور على أي مطعم.'
    },
    ask_which: {
      fr: 'Quel restaurant ? Vous pouvez préciser le nom.',
      en: 'Which restaurant? Please specify the name.',
      ar: 'أي مطعم؟ الرجاء تحديد الاسم.'
    }
    ,
    warning_far: {
      fr: (place: string, dist: number) => `Note : Le lieu "${place}" est à environ ${dist} km; le résultat retourné est le plus proche de ce lieu. Vérifiez l'orthographe si cela vous semble incorrect.`,
      en: (place: string, dist: number) => `Note: The place "${place}" is about ${dist} km away; the returned result is the nearest to that place. Check the spelling if this seems incorrect.`,
      ar: (place: string, dist: number) => `ملاحظة: المكان "${place}" يقع على بعد حوالي ${dist} كم؛ النتيجة المعطاة هي الأقرب لذلك المكان. تحقق من تهجئة الاسم إذا بدا ذلك غير صحيح.`
    },
    suggest_use_my_location: {
      fr: (distUserPlace: number) => `Votre position actuelle est éloignée de ce lieu d'environ ${distUserPlace} km. Voulez-vous plutôt le restaurant le plus proche de votre position ?`,
      en: (distUserPlace: number) => `Your current position is about ${distUserPlace} km away from that place. Do you want the nearest restaurant to your current location instead?`,
      ar: (distUserPlace: number) => `موقعك الحالي يبعد حوالي ${distUserPlace} كم عن هذا المكان. هل تريد أقرب مطعم بالنسبة لموقعك الحالي بدلاً من ذلك؟`
    }
    ,
    no_restaurant_near: {
      fr: (place: string, km: number) => `Aucun restaurant trouvé près de ${place} dans un rayon de ${km} km. Voulez-vous élargir la recherche ?`,
      en: (place: string, km: number) => `No restaurants found near ${place} within ${km} km. Do you want to broaden the search?`,
      ar: (place: string, km: number) => `لم يتم العثور على أي مطعم بالقرب من ${place} ضمن نطاق ${km} كم. هل تريد توسيع البحث؟`
    }
  };

  const fmt = (key: string, ...args: any[]) => {
    const val = L[key];
    if (!val) return '';
    const v = val[lang] ?? val['fr'];
    if (typeof v === 'function') return v(...args);
    return v;
  };

  // Handle greetings/simple questions early
  if (/^(bonjour|bonsoir|hello|hi|salam|salut|ça va|comment|quoi de neuf|ça dit)/.test(text)) {
    return fmt('greeting');
  }

  // Helper: normalize strings for fuzzy matching (remove accents, punctuation, case)
  const normalize = (s = '') => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[\W_]+/g, ' ').trim().toLowerCase();
  
  // Helper: find restaurant by name mention in text
  const findRestaurantByMention = (txt: string) => {
    const needle = normalize(txt);
    // direct include
    let byDirect = restaurants.find(r => r.name && needle.includes(normalize(r.name)));
    if (byDirect) return byDirect;
    // token overlap: split into words and match best overlap
    const words = new Set(needle.split(/\s+/).filter(w => w.length > 2));
    let best: { r?: Restaurant; score: number } = { r: undefined, score: 0 };
    for (const r of restaurants) {
      if (!r.name) continue;
      const rn = normalize(r.name);
      const rwords = rn.split(/\s+/).filter(w => w.length > 2);
      let score = 0;
      for (const w of rwords) if (words.has(w)) score++;
      if (score > best.score) best = { r, score };
    }
    return best.r && best.score > 0 ? best.r : undefined;
  };

  // Select a small set of relevant restaurants to include in AI context
  const selectRelevantRestaurants = (txt: string, restaurantsList: Restaurant[], userLoc?: { lat: number; lng: number } | null, limit = 5) => {
    const chosen = new Map<string, Restaurant>();
    const mentioned = findRestaurantByMention(txt);
    if (mentioned) chosen.set(mentioned.name || JSON.stringify(mentioned), mentioned);

    if (userLoc) {
      const candidates = restaurantsList.filter(r => r.location && r.location.lat && r.location.lng);
      candidates.sort((a, b) => distanceKm(userLoc.lat, userLoc.lng, a.location.lat, a.location.lng) - distanceKm(userLoc.lat, userLoc.lng, b.location.lat, b.location.lng));
      for (const c of candidates) {
        if (chosen.size >= limit) break;
        if (!chosen.has(c.name || '')) chosen.set(c.name || JSON.stringify(c), c);
      }
    }

    // Fill with some registered restaurants if still empty
    if (chosen.size === 0) {
      for (const r of restaurantsList.filter(r => r.source === 'firebase').slice(0, limit)) {
        if (chosen.size >= limit) break;
        chosen.set(r.name || JSON.stringify(r), r);
      }
    }

    return Array.from(chosen.values()).slice(0, limit);
  };

  // Intent detection
  const hasNearest = /proche|près|near me|position|localisation|plus proche|closest|nearest/.test(text);
  const hasPhone = /téléphone|telephone|tel|numéro|phone|appel|contact/.test(text);
  const hasAddress = /adresse|address|où|location|localisation|chemin|trajet|distance|temps/.test(text);
  const hasCheapest = /moins cher|le moins|cheapest|prix bas|prix faible|moins|bon marché/.test(text);
  const hasDelivery = /livraison|delivery|livrer|commande|se faire/.test(text);
  const hasMenu = /menu|plat|plats|spécialité|spécialités|propose|propose|fait|cuisine/.test(text);

  // === NEAREST RESTAURANT ===
  if (hasNearest) {
    // Try to detect an explicitly mentioned place (more robust than a single regex)
    const extractMentionedPlace = (txt: string) => {
      const patterns = [
        /(?:près de|près du|près de la|autour de|à proximité de|à côté de|vers|chez|dans|à|au|à l'|du)\s+([A-Za-zÀ-ÖØ-öø-ÿ0-9'’\s\-\.,]{2,80})/i,
        /(?:de|d'|du)\s+([A-Za-zÀ-ÖØ-öø-ÿ0-9'’\s\-\.,]{2,80})/i
      ];
      for (const p of patterns) {
        const m = txt.match(p);
        if (m && m[1]) {
          let v = m[1].trim();
          v = v.replace(/\b(?:restaurant|restau|resto|le|la|les|du|de)\b\s*$/i, '').trim();
          if (v.length > 0) return v;
        }
      }
      return null;
    };

    const mentionedPlace = extractMentionedPlace(text);
    let searchLocation = userLocation;

    if (forceUserLocation) {
      // Force using user's geolocation even if a place is mentioned
      if (!userLocation) return fmt('allow_geo_prompt');
      searchLocation = userLocation;
    } else if (mentionedPlace) {
      // If user explicitly provided a place (e.g. "près de la Place X"), prefer it over user's geolocation
      const geocoded = await geocodeLocation(mentionedPlace);
      if (geocoded) {
        searchLocation = geocoded;
      } else {
        return fmt('not_found_location', mentionedPlace);
      }
    }

    if (!searchLocation) return fmt('allow_geo_prompt');
    
    // Check for dish mention (ex: "pizza", "burger", etc.)
    const dishMatch = text.match(/pizza|burger|kebab|tacos|shawarma|kabab|kabob|sandwich|poulet|chicken|frites|froid|chaud|boisson|drink/i);
    let candidates = restaurants.filter(r => r.location && r.location.lat && r.location.lng);
    if (dishMatch) {
      const dish = dishMatch[0].toLowerCase();
      candidates = candidates.filter(r => r.menu && r.menu.some(m => m.name && normalize(m.name).includes(normalize(dish))));
      if (candidates.length === 0) return `Aucun restaurant proche ne propose ${dish}.`;
    }
    if (candidates.length === 0) return fmt('no_restaurant');
    let best = candidates[0];
    let bestDist = distanceKm(searchLocation.lat, searchLocation.lng, best.location.lat, best.location.lng);
    for (const r of candidates) {
      const d = distanceKm(searchLocation.lat, searchLocation.lng, r.location.lat, r.location.lng);
      if (d < bestDist) { best = r; bestDist = d; }
    }
    const rounded = Math.round(bestDist * 10) / 10;
    // Base answer (nearest to the specified place)
    let answer = (lang === 'fr')
      ? `Le restaurant le plus proche${dishMatch ? ` qui propose ${dishMatch[0]}` : ''} est "${best.name}" à environ ${rounded} km.`
      : (lang === 'en')
        ? `The nearest restaurant${dishMatch ? ` that offers ${dishMatch[0]}` : ''} is "${best.name}" at about ${rounded} km.`
        : `أقرب مطعم${dishMatch ? ` الذي يقدم ${dishMatch[0]}` : ''} هو "${best.name}" على بعد حوالي ${rounded} كم.`;

    // If user explicitly mentioned a place and the distance is large, append a localized warning.
    const FAR_WARN_KM = 200; // warn threshold (configurable)
    if (mentionedPlace && bestDist > FAR_WARN_KM) {
      answer += '\n\n' + fmt('warning_far', mentionedPlace, Math.round(bestDist));
      // If user's position exists and is far from the mentioned place, suggest using user's location
      if (userLocation) {
        const distUserPlace = Math.round(distanceKm(userLocation.lat, userLocation.lng, searchLocation.lat, searchLocation.lng));
        if (distUserPlace > FAR_WARN_KM) {
          answer += '\n' + fmt('suggest_use_my_location', distUserPlace);
        }
      }
    }

    return answer;
  }

  // === PHONE NUMBER ===
  if (hasPhone) {
    const mentioned = findRestaurantByMention(text);
    if (mentioned) {
      if (mentioned.source !== 'firebase') {
        const name = mentioned.name || (lang === 'fr' ? 'Ce restaurant' : lang === 'en' ? 'This restaurant' : 'هذا المطعم');
        return (lang === 'fr') ? `${name} n'a pas encore de compte sur GeoResto. Nous n'avons pas son numéro pour le moment.` : (lang === 'en') ? `${name} does not yet have a GeoResto account. We don't have their phone number right now.` : `${name} لا يمتلك حسابًا على GeoResto بعد. ليس لدينا رقم هاتفه حاليًا.`;
      }
      if (mentioned.phone) return (lang === 'fr') ? `Le numéro de ${mentioned.name} est : ${mentioned.phone}` : (lang === 'en') ? `${mentioned.name}'s phone number is: ${mentioned.phone}` : `رقم هاتف ${mentioned.name} هو: ${mentioned.phone}`;
      return (lang === 'fr') ? `Désolé, le numéro de ${mentioned.name} n'est pas disponible.` : (lang === 'en') ? `Sorry, ${mentioned.name}'s number is not available.` : `عذراً، رقم ${mentioned.name} غير متوفر.`;
    }
    // If no restaurant mentioned, ask for clarification
    return fmt('ask_which');
  }

  // === ADDRESS / LOCATION ===
  if (hasAddress && !hasNearest) {
    const mentioned = findRestaurantByMention(text);
    if (mentioned) {
      if (mentioned.source !== 'firebase' && !mentioned.description) {
        return (lang === 'fr') ? `${mentioned.name} n'a pas encore de compte sur GeoResto. Nous n'avons pas son adresse complète pour le moment, mais vous pouvez le localiser sur la carte.` : (lang === 'en') ? `${mentioned.name} does not yet have a GeoResto account. We don't have their full address right now, but you can locate them on the map.` : `لا يمتلك ${mentioned.name} حسابًا على GeoResto بعد. ليس لدينا عنوانه الكامل الآن، ولكن يمكنك تحديد موقعه على الخريطة.`;
      }
      const addr = (mentioned as any).address || mentioned.description || (lang === 'fr' ? 'Adresse non renseignée' : lang === 'en' ? 'Address not provided' : 'لم يتم توفير العنوان');
      return (lang === 'fr') ? `L'adresse de ${mentioned.name} est : ${addr}` : (lang === 'en') ? `${mentioned.name}'s address is: ${addr}` : `عنوان ${mentioned.name} هو: ${addr}`;
    }
    // If no restaurant mentioned and asks for distance, use nearest
    if (/distance|temps|combien de/.test(text) && userLocation) {
      const candidates = restaurants.filter(r => r.location && r.location.lat && r.location.lng);
      if (candidates.length > 0) {
        let best = candidates[0];
        let bestDist = distanceKm(userLocation.lat, userLocation.lng, best.location.lat, best.location.lng);
        for (const r of candidates) {
          const d = distanceKm(userLocation.lat, userLocation.lng, r.location.lat, r.location.lng);
          if (d < bestDist) { best = r; bestDist = d; }
        }
        const rounded = Math.round(bestDist * 10) / 10;
        return `Le restaurant le plus proche est ${best.name} à environ ${rounded} km de votre position.`;
      }
    }
    return "Quel restaurant ? Vous pouvez préciser le nom.";
  }

  // === CHEAPEST DISH ===
  if (hasCheapest && !hasMenu) {
    const mentioned = findRestaurantByMention(text);
    // Handle "ce restau" / "ce restaurant" without explicit name
    const isCeRestau = /\bce\s+(restau|restaurant|resto)\b|\bdans\s+(ce|ce)\s+(resto|restau|restaurant)\b/.test(text);
    if (!mentioned && isCeRestau && userLocation) {
      const candidates = restaurants.filter(r => r.location && r.location.lat && r.location.lng);
      if (candidates.length === 0) return 'Aucun restaurant trouvé.';
      let best = candidates[0];
      let bestDist = distanceKm(userLocation.lat, userLocation.lng, best.location.lat, best.location.lng);
      for (const r of candidates) {
        const d = distanceKm(userLocation.lat, userLocation.lng, r.location.lat, r.location.lng);
        if (d < bestDist) { best = r; bestDist = d; }
      }
      if (best.source !== 'firebase' || !best.menu || best.menu.length === 0) {
        return `${best.name} n'a pas encore de compte sur GeoResto. Nous n'avons pas son menu pour le moment.`;
      }
      if (best && best.menu && best.menu.length > 0) {
        const cheapest = best.menu.reduce((a, b) => ((a.price || Infinity) < (b.price || Infinity) ? a : b));
        return `Le plat le moins cher chez ${best.name} est ${cheapest.name} à ${cheapest.price ?? 'prix inconnu'} DH.`;
      }
    }
    if (mentioned) {
      if (mentioned.source !== 'firebase' || !mentioned.menu || mentioned.menu.length === 0) {
        return (lang === 'fr') ? `${mentioned.name} n'a pas encore de compte sur GeoResto. Nous n'avons pas son menu pour le moment.` : (lang === 'en') ? `${mentioned.name} does not yet have a GeoResto account. We don't have their menu right now.` : `لا يمتلك ${mentioned.name} حسابًا على GeoResto بعد. ليس لدينا قائمته الآن.`;
      }
      if (mentioned.menu && mentioned.menu.length > 0) {
        const cheapest = mentioned.menu.reduce((a, b) => ((a.price || Infinity) < (b.price || Infinity) ? a : b));
        return (lang === 'fr') ? `Le plat le moins cher chez ${mentioned.name} est ${cheapest.name} à ${cheapest.price ?? 'prix inconnu'} DH.` : (lang === 'en') ? `The cheapest dish at ${mentioned.name} is ${cheapest.name} at ${cheapest.price ?? 'unknown price'} DH.` : `أرخص طبق في ${mentioned.name} هو ${cheapest.name} بسعر ${cheapest.price ?? 'سعر غير معروف'} درهم.`;
      }
    }
    // Find global cheapest (only from registered restaurants)
    let bestDish: { name: string; price?: number; resto?: string } | null = null;
    for (const r of restaurants.filter(r => r.source === 'firebase')) {
      for (const m of (r.menu || [])) {
        if (typeof m.price === 'number') {
          if (!bestDish || (m.price < (bestDish.price ?? Infinity))) bestDish = { name: m.name, price: m.price, resto: r.name };
        }
      }
    }
    if (bestDish) return `Le plat le moins cher est ${bestDish.name} chez ${bestDish.resto} à ${bestDish.price} DH.`;
    return 'Aucun plat avec prix disponible.';
  }

  // === DELIVERY ===
  if (hasDelivery) {
    const mentioned = findRestaurantByMention(text);
    if (mentioned) {
      if (mentioned.source !== 'firebase') {
        return (lang === 'fr') ? `${mentioned.name} n'a pas encore de compte sur GeoResto. Nous n'avons pas d'info sur sa livraison.` : (lang === 'en') ? `${mentioned.name} does not yet have a GeoResto account. We don't have delivery info.` : `لا يمتلك ${mentioned.name} حسابًا على GeoResto بعد. ليست لدينا معلومات عن التوصيل.`;
      }
      return mentioned.delivery ? (lang === 'fr' ? `Oui, ${mentioned.name} propose la livraison.` : lang === 'en' ? `Yes, ${mentioned.name} offers delivery.` : `نعم، ${mentioned.name} يقدم خدمة التوصيل.`) : (lang === 'fr' ? `Non, ${mentioned.name} ne propose pas la livraison.` : lang === 'en' ? `No, ${mentioned.name} does not offer delivery.` : `لا، ${mentioned.name} لا يقدم خدمة التوصيل.`);
    }
    return (lang === 'fr' ? "Quel restaurant ? Précisez le nom pour que je vous aide." : lang === 'en' ? "Which restaurant? Please specify the name so I can help." : "أي مطعم؟ الرجاء تحديد الاسم حتى أتمكن من المساعدة.");
  }

  // === MENU / DISHES ===
  if (hasMenu && !hasCheapest) {
    const mentioned = findRestaurantByMention(text);
    if (mentioned) {
      if (mentioned.source !== 'firebase' || !mentioned.menu || mentioned.menu.length === 0) {
        return `${mentioned.name} n'a pas encore de compte sur GeoResto. Nous n'avons pas son menu pour le moment.`;
      }
      const list = mentioned.menu.slice(0, 5).map(m => `${m.name} (${m.price ?? 'prix inconnu'} DH)`).join(', ');
      return `Voici quelques plats chez ${mentioned.name} : ${list}`;
    }
    // If no specific restaurant, show popular dishes from registered restaurants only
    const fallback = restaurants
      .filter(r => r.source === 'firebase')
      .slice(0, 5)
      .flatMap(r => (r.menu || []).slice(0, 2).map(m => `${m.name} (${m.price ?? 'prix inconnu'} DH) @ ${r.name}`))
      .slice(0, 8);
    if (fallback.length) return `Plats disponibles : ${fallback.join(' — ')}`;
    return "Aucun menu disponible pour le moment.";
  }

  // === RECHERCHE DANS LA BASE DE CONNAISSANCES ===
  const knowledgeAnswer = searchKnowledge(input, lang);
  if (knowledgeAnswer) {
    return knowledgeAnswer;
  }

  // === FALLBACK: Use contextual AI (Gemini) with a small set of app data ===
  try {
    const selected = selectRelevantRestaurants(input, restaurants, userLocation, 5);
    // Save a short debug summary for visibility (non-sensitive)
    if (typeof debugCb === 'function') debugCb(selected.map(s => `${s.name} [${s.source || '—'}]`).join(', '));

    // Générer un contexte enrichi avec la base de connaissances
    const enrichedContext = generateEnrichedContext(lang);

    // Call server-side AI proxy to keep API keys secure and have robust model selection
    try {
      const resp = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: input, 
          restaurants: selected, 
          userLocation, 
          mode: 'contextual', 
          language, 
          history: conversationHistory || [],
          systemContext: enrichedContext // Ajouter le contexte enrichi
        })
      });
      if (!resp.ok) {
        console.error('AI proxy error', await resp.text());
      } else {
        const data = await resp.json();
        const answer = data?.answer || data?.text || '';
        if (answer && answer.trim()) return answer;
        // If contextual mode returned empty or non-informative, ask general mode
        const resp2 = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            question: input, 
            mode: 'general', 
            language, 
            history: conversationHistory || [],
            systemContext: enrichedContext
          })
        });
        if (resp2.ok) {
          const d2 = await resp2.json();
          const ans2 = d2?.answer || '';
          if (ans2 && ans2.trim()) return ans2;
        }
      }
    } catch (err) {
      console.error('AI proxy call failed', err);
    }

    // Fallback to client-side generic generator if server unavailable
    try {
      // Utiliser le contexte enrichi de la base de connaissances
      const enrichedContext = generateEnrichedContext(lang);
      
      let prompt = enrichedContext + '\n\n';
      prompt += `Restaurants disponibles:\n`;
      
      for (const r of restaurants.slice(0, 10)) {
        prompt += `- ${r.name} (${r.category}${r.delivery ? ', livraison disponible' : ''}) : `;
        if (r.phone) prompt += `Tél: ${r.phone}. `;
        if (r.menu && r.menu.length > 0) {
          prompt += `Plats: ${r.menu.slice(0, 5).map(m => `${m.name} (${m.price ?? 'Prix inconnu'} DH)`).join(', ')}`;
        }
        if ((r as any).description) prompt += `. Description: ${((r as any).description)}`;
        prompt += '\n';
      }
      
      const questionPrompt = {
        fr: `\nQuestion du client: "${input}"\nRéponds brièvement en français, de façon utile et précise. Utilise des emojis pour rendre la réponse plus agréable.`,
        en: `\nCustomer question: "${input}"\nRespond briefly in English, in a helpful and precise way. Use emojis to make the response more pleasant.`,
        ar: `\nسؤال العميل: "${input}"\nأجب بإيجاز بالعربية، بطريقة مفيدة ودقيقة. استخدم الرموز التعبيرية لجعل الإجابة أكثر متعة.`
      };
      
      prompt += questionPrompt[lang];
      
      const response = await generateChatbotResponse(prompt);
      return response || (lang === 'fr' ? "Je n'ai pas compris. Pouvez-vous reformuler ?" : lang === 'en' ? "I didn't understand. Can you rephrase?" : "لم أفهم. هل يمكنك إعادة الصياغة؟");
    } catch (e) {
      console.error('Chatbot Gemini error:', e);
      return lang === 'fr' ? "Je n'ai pas pu trouver la réponse. Essayez de reformuler votre question." : lang === 'en' ? "I couldn't find the answer. Try rephrasing your question." : "لم أتمكن من العثور على الإجابة. حاول إعادة صياغة سؤالك.";
    }
  } catch (e) {
    console.error('Chatbot contextual AI error:', e);
    return "Je n'ai pas pu trouver la réponse. Essayez de reformuler votre question.";
  }
};

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ restaurants }) => {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [chatLang, setChatLang] = useState<'fr' | 'en' | 'ar'>(lang as 'fr' | 'en' | 'ar');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: "Bonjour ! Je suis votre assistant GeoResto. Posez-moi une question sur les restaurants ou les plats." }
  ]);
  const [debugContext, setDebugContext] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize chatLang from global language once (chat language is then independent)
  useEffect(() => {
    setChatLang(lang as 'fr' | 'en' | 'ar');
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Handler: when user clicks "Use my location" suggestion in bot message
  const handleUseMyLocation = async () => {
    // find last user question
    const lastUser = [...messages].slice().reverse().find(m => m.sender === 'user');
    const question = lastUser?.text;
    if (!question) return;
    // add a small user action message indicating the choice
    const actionText = chatLang === 'fr' ? 'Utiliser ma position' : chatLang === 'en' ? 'Use my location' : 'استخدم موقعي';
    setMessages(prev => [...prev, { sender: 'user', text: actionText }]);

    // Call the bot using the user's geolocation (force)
    const botReply = await getBotResponse(question, restaurants, userLocation, setDebugContext, chatLang, [...messages, { sender: 'user', text: actionText }], true);
    setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
  };

  // When opening the chat, try to get user geolocation for nearest queries
  useEffect(() => {
    if (!open) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    }, (err) => {
      console.warn('Geolocation error or permission denied:', err.message);
      setUserLocation(null);
    }, { enableHighAccuracy: false, maximumAge: 1000 * 60 * 5, timeout: 5000 });
  }, [open]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    setInput('');
    setTimeout(async () => {
      const botReply = await getBotResponse(input, restaurants, userLocation, setDebugContext, chatLang, messages);
      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    }, 600);
  };

  // Helper: render bot text with clickable phone and map links
  const renderBotText = (text: string) => {
    if (!text) return null;

    // Special marker to render a "Use my location" button inside bot messages
    if (text.includes('[[USE_MY_LOCATION]]')) {
      const parts = text.split('[[USE_MY_LOCATION]]');
      return (
        <span>
          {parts.map((p, i) => (
            <React.Fragment key={i}>
              {p}
              {i < parts.length - 1 && (
                <button
                  onClick={() => handleUseMyLocation()}
                  className="ml-2 px-2 py-1 text-xs rounded bg-blue-600 text-white"
                >
                  {chatLang === 'fr' ? 'Utiliser ma position' : chatLang === 'en' ? 'Use my location' : 'استخدم موقعي'}
                </button>
              )}
            </React.Fragment>
          ))}
        </span>
      );
    }

    // Phone pattern: capture sequences of digits with optional +, spaces, -, (), dots
    const phoneRegex = /(\+?\d[\d\s().\-]{6,}\d)/g;

    // Address detection: look for 'adresse' followed by ':' or 'est :' and capture after
    const addrMatch = text.match(/(?:adresse|Address|L'adresse|l'adresse)\s*(?:de[^:]*)?:\s*(.+)/i);

    // If address found, render the whole text but replace the address with a Google Maps link
    if (addrMatch && addrMatch[1]) {
      const addr = addrMatch[1].trim();
      const before = text.split(addrMatch[1])[0];
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
      return (
        <span>
          {before}
          <a className="text-blue-600 underline" href={mapsUrl} target="_blank" rel="noreferrer">{addr}</a>
        </span>
      );
    }

    // Otherwise replace phone numbers with tel: links
    const parts: any[] = [];
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = phoneRegex.exec(text)) !== null) {
      const idx = m.index;
      if (idx > lastIndex) parts.push(text.substring(lastIndex, idx));
      const phoneRaw = m[0];
      const digits = phoneRaw.replace(/[^+0-9]/g, '');
      parts.push(<a key={idx} className="text-blue-600 underline" href={`tel:${digits}`}>{phoneRaw}</a>);
      lastIndex = idx + phoneRaw.length;
    }
    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    if (parts.length === 0) return <span>{text}</span>;
    return <span>{parts.map((p, i) => typeof p === 'string' ? <span key={i}>{p}</span> : p)}</span>;
  };

  return (
    <>
      {/* Floating button */}
      <button
        className="fixed bottom-8 right-6 z-[9999] w-16 h-16 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-95 shadow-lg flex items-center justify-center cursor-pointer touch-none pointer-events-auto"
        onClick={() => setOpen(o => !o)}
        aria-label="Chatbot"
      >
        <Bot size={32} className="text-white" />
      </button>
      {/* Chat window */}
      {open && (
        <div className="fixed left-4 right-4 bottom-24 md:bottom-24 md:right-6 md:left-auto w-auto md:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#071127] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[9999] flex flex-col max-h-[60vh] md:max-h-[70vh]">
          <div className="p-4 border-b dark:border-gray-700 flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-orange-600" />
              <span className="font-bold text-gray-800 dark:text-gray-100">Assistant GeoResto</span>
            </div>
            {/* Language toggle buttons */}
            <div className="flex gap-1 items-center">
              <button
                onClick={() => { setChatLang('fr'); }}
                className={`px-2 py-1 text-xs rounded font-semibold transition ${
                  chatLang === 'fr'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                FR
              </button>
              <button
                onClick={() => { setChatLang('en'); }}
                className={`px-2 py-1 text-xs rounded font-semibold transition ${
                  chatLang === 'en'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => { setChatLang('ar'); }}
                className={`px-2 py-1 text-xs rounded font-semibold transition ${
                  chatLang === 'ar'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                AR
              </button>
            </div>
            <button className="ml-2 text-gray-400 hover:text-red-500 transition" onClick={() => setOpen(false)}><MessageCircle size={18} /></button>
          </div>
          {debugContext && (
            <div className="px-4 pb-2 text-xs text-gray-500 dark:text-gray-400">Contexte AI: {debugContext}</div>
          )}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded-2xl text-sm max-w-[80%] ${msg.sender === 'user' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}>
                  {msg.sender === 'bot' ? renderBotText(msg.text) : msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 border-t dark:border-gray-700 flex gap-2 bg-white dark:bg-[#071127] shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
            <button type="submit" className="bg-orange-600 hover:bg-orange-700 active:scale-95 text-white px-3 py-2 rounded-lg font-bold text-sm whitespace-nowrap cursor-pointer">Envoyer</button>
          </form>
        </div>
      )}
    </>
  );
}
