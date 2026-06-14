const router = require('express').Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { User, AnalysisHistory } = require('../models');

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
        generationConfig: { temperature: 0.2, maxOutputTokens: 65536, responseMimeType: 'application/json' },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const candidate = data.candidates?.[0];
      const finishReason = candidate?.finishReason;
      // MAX_TOKENS significa que Gemini cortó el output antes de terminar → JSON incompleto
      if (finishReason && finishReason !== 'STOP') {
        console.warn(`[analysis] Model ${model} finishReason=${finishReason} — trying next model`);
        continue;
      }
      return candidate?.content?.parts?.[0]?.text?.trim() || null;
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
- "resumen": máximo 3 oraciones, conciso
- "categorias": máximo 7, agrupa gastos similares, porcentajes suman ~100, totales en ${currency}
- "recomendaciones": exactamente 4, título corto (máx 6 palabras) + detalle de 1 oración
- "alerta": máximo 1 oración si hay patrón preocupante, si no → null
- Idioma de los valores: español

Estado de cuenta a analizar:
${text}

Responde SOLO con el objeto JSON. Primera línea de tu respuesta: {`,

      en: `You are a bank statement parser. Your ONLY task is to output valid JSON. Write nothing outside the JSON. No markdown. No explanations.

Required schema (exact field names):
${jsonSchema}

Rules:
- "resumen": max 3 sentences, concise
- "categorias": max 7, group similar expenses, percentages sum ~100, totals in ${currency}
- "recomendaciones": exactly 4, short title (max 6 words) + 1-sentence detail
- "alerta": max 1 sentence if concerning pattern, otherwise → null
- Language of values: English

Bank statement to analyze:
${text}

Respond ONLY with the JSON object. First line of your response: {`,

      pt: `Você é um parser de extratos bancários. Sua ÚNICA tarefa é produzir JSON válido. Não escreva nada fora do JSON. Sem markdown. Sem explicações.

Esquema obrigatório (nomes de campo exatos):
${jsonSchema}

Regras:
- "resumen": máximo 3 frases, conciso
- "categorias": máximo 7, agrupe gastos similares, percentuais somam ~100, totais em ${currency}
- "recomendaciones": exatamente 4, título curto (máx 6 palavras) + detalhe de 1 frase
- "alerta": máximo 1 frase se houver padrão preocupante, senão → null
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

    // Guardar en historial (sin bloquear la respuesta si falla)
    AnalysisHistory.create({
      user_id: req.userId,
      filename: req.file.originalname || null,
      resumen: result.resumen || '',
      categorias: result.categorias || [],
      recomendaciones: result.recomendaciones || [],
      alerta: result.alerta || null,
    }).catch((e) => console.warn('[analysis] history save failed:', e.message));

    res.json(result);
  } catch (err) {
    console.error('[analysis]', err.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/analysis/history — últimos 20 análisis del usuario
router.get('/history', auth, async (req, res) => {
  try {
    const items = await AnalysisHistory.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']],
      limit: 20,
      attributes: ['id', 'filename', 'resumen', 'categorias', 'recomendaciones', 'alerta', 'createdAt'],
    });
    res.json(items);
  } catch (err) {
    console.error('[analysis/history]', err.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/analysis/compare — comparar 2 o 3 análisis del historial con IA
router.post('/compare', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length < 2 || ids.length > 3) {
      return res.status(400).json({ message: 'Selecciona entre 2 y 3 análisis para comparar.' });
    }

    const items = await AnalysisHistory.findAll({
      where: { id: ids, user_id: req.userId },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'filename', 'resumen', 'categorias', 'alerta', 'createdAt'],
    });

    if (items.length < 2) {
      return res.status(400).json({ message: 'No se encontraron análisis suficientes.' });
    }

    // Detectar documentos idénticos o muy similares antes de llamar a Gemini
    const normalize = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const sameFilename = items[0].filename && items[0].filename === items[1].filename;
    const sameResumen  = normalize(items[0].resumen).slice(0, 120) === normalize(items[1].resumen).slice(0, 120);

    if (sameFilename || sameResumen) {
      return res.json({
        same_document: true,
        tendencia: 'estable',
        resumen: 'Los análisis seleccionados parecen provenir del mismo estado de cuenta o del mismo período. No hay diferencias significativas que comparar.',
        cambios_categorias: [],
        recomendaciones: [
          'Sube estados de cuenta de meses distintos para obtener una comparación real.',
          'Para ver tu progreso, selecciona al menos dos períodos diferentes (ej. enero vs. marzo).',
          'Cada análisis nuevo se guarda automáticamente en el historial para que puedas compararlo después.',
        ],
        items: items.map(it => ({ id: it.id, createdAt: it.createdAt, filename: it.filename })),
      });
    }

    const user = await User.findByPk(req.userId);
    const lang = user?.idioma || 'es';
    const currency = user?.moneda || 'DOP';

    const statementsText = items.map((item, i) => {
      const date = new Date(item.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
      const rawCats = typeof item.categorias === 'string' ? JSON.parse(item.categorias) : (item.categorias || []);
      const cats = rawCats.map(c => `${c.emoji} ${c.nombre}: ${c.total} ${currency} (${c.porcentaje}%)`).join(', ');
      return `Período ${i + 1} (${date}):\nResumen: ${item.resumen}\nGastos: ${cats}`;
    }).join('\n\n---\n\n');

    const schema = `{"tendencia":"mejora|deterioro|estable","resumen":"...","cambios_categorias":[{"nombre":"...","emoji":"...","antes":0,"despues":0,"cambio_pct":0}],"recomendaciones":["...","...","..."]}`;

    const prompts = {
      es: `Compara estos estados de cuenta cronológicamente. Produce SOLO JSON válido sin markdown.

Esquema obligatorio:
${schema}

Reglas:
- "tendencia": "mejora" si los gastos bajaron o la salud financiera mejoró, "deterioro" si empeoró, "estable" si hay poca variación (menos del 10%)
- "resumen": máximo 3 oraciones comparando los períodos
- "cambios_categorias": categorías que aparecen en ambos períodos, "cambio_pct" negativo = gasto bajó (bueno), positivo = gasto subió
- "recomendaciones": exactamente 3 consejos basados en los cambios observados
- Idioma: español, moneda: ${currency}

${statementsText}

Responde SOLO con el JSON:`,

      en: `Compare these bank statements chronologically. Output ONLY valid JSON without markdown.

Required schema:
${schema}

Rules:
- "tendencia": "mejora" if expenses decreased or financial health improved, "deterioro" if it worsened, "estable" if little variation (less than 10%)
- "resumen": max 3 sentences comparing the periods
- "cambios_categorias": categories appearing in both periods, "cambio_pct" negative = spending dropped (good), positive = spending increased
- "recomendaciones": exactly 3 tips based on observed changes
- Language: English, currency: ${currency}

${statementsText}

Respond ONLY with the JSON:`,

      pt: `Compare esses extratos cronologicamente. Produza SOMENTE JSON válido sem markdown.

Esquema obrigatório:
${schema}

Regras:
- "tendencia": "mejora" se gastos caíram ou saúde financeira melhorou, "deterioro" se piorou, "estable" se pouca variação (menos de 10%)
- "resumen": máximo 3 frases comparando os períodos
- "cambios_categorias": categorias em ambos os períodos, "cambio_pct" negativo = gasto caiu (bom), positivo = gasto subiu
- "recomendaciones": exatamente 3 dicas baseadas nas mudanças
- Idioma: português, moeda: ${currency}

${statementsText}

Responda SOMENTE com o JSON:`,
    };

    const raw = await callGemini(prompts[lang] || prompts.es);
    if (!raw) return res.status(502).json({ message: 'Error al contactar con la IA. Intenta de nuevo.' });

    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      console.error('[analysis/compare] JSON parse failed. Raw:', raw.slice(0, 300));
      return res.status(502).json({ message: 'La IA devolvió una respuesta inesperada. Intenta de nuevo.' });
    }

    res.json({
      ...result,
      items: items.map(it => ({ id: it.id, createdAt: it.createdAt, filename: it.filename })),
    });
  } catch (err) {
    console.error('[analysis/compare]', err.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /api/analysis/history/:id — eliminar un análisis del historial
router.delete('/history/:id', auth, async (req, res) => {
  try {
    const item = await AnalysisHistory.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    await item.destroy();
    res.json({ ok: true });
  } catch (err) {
    console.error('[analysis/history delete]', err.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
