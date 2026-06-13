const router = require('express').Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { User } = require('../models');

// Keep file in memory — never touch disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Solo se aceptan archivos PDF'));
  },
});

const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: 'application/json' },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    }
    const err = await res.json().catch(() => ({}));
    console.warn(`[analysis] Model ${model} failed:`, err?.error?.message);
  }
  return null;
}

router.post('/', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió ningún PDF' });

    // Extract text from PDF using pdfjs-dist v6 (ESM via dynamic import)
    let pdfText;
    try {
      const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const uint8Array = new Uint8Array(req.file.buffer);
      const doc = await getDocument({ data: uint8Array }).promise;

      const pages = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        pages.push(content.items.map((item) => item.str).join(' '));
      }
      pdfText = pages.join('\n').trim();
    } catch (e) {
      console.error('[analysis] pdf parse error:', e.message);
      return res.status(422).json({ message: 'No se pudo leer el PDF. Asegúrate de que no esté protegido.' });
    }

    if (!pdfText || pdfText.length < 50) {
      return res.status(422).json({ message: 'El PDF no contiene texto legible. ¿Es un escáner?' });
    }

    // Truncate to avoid exceeding Gemini token limits
    const text = pdfText.slice(0, 12000);

    const user = await User.findByPk(req.userId);
    const lang = user?.idioma || 'es';
    const currency = user?.moneda || 'DOP';

    const jsonSchema = `{"resumen":"...","categorias":[{"nombre":"...","total":0,"porcentaje":0,"emoji":"..."}],"recomendaciones":[{"titulo":"...","detalle":"..."}],"alerta":null}`;

    const prompts = {
      es: `Eres un parser de estados de cuenta bancarios. Tu ÚNICA tarea es producir JSON válido. No escribas ningún texto fuera del JSON. No uses markdown. No expliques nada.

Esquema obligatorio (respeta los nombres de campo exactos):
${jsonSchema}

Reglas:
- "categorias": máximo 7, agrupa gastos similares, porcentajes suman ~100, totales en ${currency}
- "recomendaciones": exactamente 4 consejos concretos y personalizados
- "alerta": string solo si hay un patrón preocupante, si no → null
- Idioma de los valores: español

Estado de cuenta a analizar:
${text}

Responde SOLO con el objeto JSON. Primera línea de tu respuesta: {`,

      en: `You are a bank statement parser. Your ONLY task is to output valid JSON. Write nothing outside the JSON. No markdown. No explanations.

Required schema (exact field names):
${jsonSchema}

Rules:
- "categorias": max 7, group similar expenses, percentages sum ~100, totals in ${currency}
- "recomendaciones": exactly 4 concrete personalized tips
- "alerta": string only if concerning pattern found, otherwise → null
- Language of values: English

Bank statement to analyze:
${text}

Respond ONLY with the JSON object. First line of your response: {`,

      pt: `Você é um parser de extratos bancários. Sua ÚNICA tarefa é produzir JSON válido. Não escreva nada fora do JSON. Sem markdown. Sem explicações.

Esquema obrigatório (nomes de campo exatos):
${jsonSchema}

Regras:
- "categorias": máximo 7, agrupe gastos similares, percentuais somam ~100, totais em ${currency}
- "recomendaciones": exatamente 4 dicas concretas e personalizadas
- "alerta": string só se houver padrão preocupante, senão → null
- Idioma dos valores: português

Extrato a analisar:
${text}

Responda SOMENTE com o objeto JSON. Primeira linha da sua resposta: {`,
    };

    const raw = await callGemini(prompts[lang] || prompts.es);
    if (!raw) return res.status(502).json({ message: 'Error al contactar con la IA. Intenta de nuevo.' });

    // Strip potential markdown fences Gemini sometimes adds
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      console.error('[analysis] JSON parse failed. Raw:', raw.slice(0, 300));
      return res.status(502).json({ message: 'La IA devolvió una respuesta inesperada. Intenta de nuevo.' });
    }

    res.json(result);
  } catch (err) {
    console.error('[analysis]', err.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
