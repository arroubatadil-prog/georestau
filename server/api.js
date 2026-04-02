#!/usr/bin/env node
/**
 * Simple server-side AI proxy for GeoResto
 * - Reads OPENAI_API_KEY or GEMINI_API_KEY from env
 * - Exposes POST /api/ai accepting { question, restaurants, userLocation }
 * - Calls OpenAI Chat Completions (preferred) and returns { answer }
 *
 * Note: install dependencies and run in a secure environment. This file is a minimal starting point.
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '200kb' }));

const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_KEY || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_KEY || '';

const buildPrompt = (question, restaurants = [], userLocation, conversationHistory = []) => {
  // Build conversation context from history
  let conversationContext = '';
  if (conversationHistory && conversationHistory.length > 0) {
    conversationContext = 'Historique de la conversation :\n';
    for (const msg of conversationHistory) {
      const sender = msg.sender === 'user' ? 'Utilisateur' : 'Assistant';
      conversationContext += `${sender}: ${msg.text}\n`;
    }
    conversationContext += '\n';
  }

  let context = `Tu es GeoResto, un assistant qui répond uniquement en utilisant les informations fournies ci-dessous. Ne fais aucune supposition en dehors des données. Réponds en français, de façon concise et précise.`;
  context += `\n\n${conversationContext}`;
  context += `Données (restaurants) :\n`;
  for (const r of restaurants.slice(0, 10)) {
    const menu = (r.menu || []).slice(0, 6).map(m => ({ name: m.name, price: m.price ?? null }));
    context += `- name: ${r.name || '—'}; source: ${r.source || '—'}; phone: ${r.phone || '—'}; address: ${r.address || r.description || '—'}; lat:${r.location?.lat ?? '—'}; lng:${r.location?.lng ?? '—'}; delivery:${r.delivery ? 'yes' : 'no'}; menu:${JSON.stringify(menu)}\n`;
  }
  if (userLocation) context += `\nPosition utilisateur: lat:${userLocation.lat}, lng:${userLocation.lng}\n`;
  context += `\nNouvelle question: ${question}\n\nConsignes: Utilise uniquement les données ci-dessus. Si la donnée demandée n'est pas fournie, indique clairement que l'information n'est pas disponible. Ne pas inventer de numéro, d'adresse ou de menu. Comprends le contexte des messages précédents si applicable. Rends la réponse courte (1-3 phrases).`;
  return context;
};

app.post('/api/ai', async (req, res) => {
  try {
    const { question, restaurants, userLocation, mode, language, history } = req.body || {};
    if (!question) return res.status(400).json({ error: 'Missing question' });

    const isGeneral = mode === 'general';
    const prompt = isGeneral ? question : buildPrompt(question, restaurants || [], userLocation || null, history || []);

    const systemMsg = isGeneral
      ? (language === 'en' ? 'You are a helpful assistant. Answer in English.' : language === 'ar' ? 'أنت مساعد مفيد. أجِب باللغة العربية.' : 'You are a helpful assistant. Answer in French.')
      : (language === 'en' ? 'You are GeoResto assistant. Answer in English and use only provided data.' : language === 'ar' ? 'أنت مساعد GeoResto. أجب باللغة العربية واستعمل البيانات المقدمة فقط.' : 'You are GeoResto assistant. Answer in French and use only provided data.');

    // Prefer OpenAI if available
    if (OPENAI_KEY) {
      try {
        const payload = {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemMsg },
            { role: 'user', content: prompt }
          ],
          max_tokens: 400,
          temperature: isGeneral ? 0.6 : 0.2
        };

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_KEY}`
          },
          body: JSON.stringify(payload)
        });
        const json = await resp.json();
        const answer = json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || null;
        return res.json({ answer });
      } catch (err) {
        console.error('OpenAI call failed, will try Gemini if configured', err);
      }
    }

    // Try Gemini server-side if configured
    if (GEMINI_KEY) {
      try {
        let genai;
        try { genai = require('@google/genai'); } catch (e) { console.warn('Gemini client not installed (@google/genai)'); }
        if (genai && genai.GoogleGenAI) {
          const { GoogleGenAI } = genai;
          const g = new GoogleGenAI({ apiKey: GEMINI_KEY });
          const model = isGeneral ? 'gemini-1.5' : 'gemini-1.5-flash';
          const response = await g.models.generateContent({ model, contents: { parts: [{ text: prompt }] } });
          const txt = response?.text || null;
          return res.json({ answer: txt });
        }

        // Fallback REST attempt (may require different auth in some setups)
        const restResp = await fetch('https://generativeai.googleapis.com/v1beta2/models/gemini-1.5:generateText?key=' + encodeURIComponent(GEMINI_KEY), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt, temperature: isGeneral ? 0.6 : 0.2, maxOutputTokens: 300 })
        });
        const restJson = await restResp.json();
        const txt = restJson?.candidates?.[0]?.content || restJson?.output?.[0]?.content || null;
        return res.json({ answer: txt });
      } catch (err2) {
        console.error('Gemini call failed', err2);
      }
    }

    return res.status(500).json({ error: 'No AI API key configured on server (OPENAI_API_KEY or GEMINI_API_KEY).' });
  } catch (e) {
    console.error('AI proxy error', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 5174;
app.listen(port, () => {
  console.log(`GeoResto AI proxy listening on http://localhost:${port}`);
});
