const router = require('express').Router();
const auth = require('../middleware/auth');
const { User, Service, Debt, Savings, Goal } = require('../models');

router.post('/', auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ message: 'Mensaje requerido' });
    if (typeof message !== 'string' || message.trim().length === 0)
      return res.status(400).json({ message: 'Mensaje inválido' });
    if (message.length > 1000)
      return res.status(400).json({ message: 'Mensaje demasiado largo (máximo 1000 caracteres)' });

    const [user, services, debts, savings, goals] = await Promise.all([
      User.findByPk(req.userId),
      Service.findAll({ where: { user_id: req.userId } }),
      Debt.findAll({ where: { user_id: req.userId } }),
      Savings.findAll({ where: { user_id: req.userId } }),
      Goal.findAll({ where: { user_id: req.userId } }),
    ]);

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const currency = user.moneda || 'DOP';
    const lang = user.idioma || 'es';
    const nombre = user.nombre || '';
    const ingreso = Number(user.ingreso_mensual || 0);
    const totalSvc = services.reduce((s, x) => s + Number(x.monto), 0);
    const totalCuotas = debts.reduce((s, x) => s + Number(x.cuota_mensual), 0);
    const totalDebt = debts.reduce((s, x) => s + Number(x.monto_pendiente || x.monto_total || 0), 0);
    const libre = ingreso - totalSvc - totalCuotas;

    const fmt = (n) => `${currency} ${Number(n).toLocaleString()}`;

    const svcLines = services.length
      ? services.map(s => `  • ${s.nombre}: ${fmt(s.monto)}`).join('\n')
      : (lang === 'en' ? '  (none)' : lang === 'pt' ? '  (nenhum)' : '  (ninguno)');

    const debtLines = debts.length
      ? debts.map(d => `  • ${d.nombre}: ${fmt(d.monto_pendiente || d.monto_total || 0)} pendiente, cuota ${fmt(d.cuota_mensual)}/mes`).join('\n')
      : (lang === 'en' ? '  (none)' : lang === 'pt' ? '  (nenhuma)' : '  (ninguna)');

    const savLines = savings.length
      ? savings.map(s => `${s.nombre}: ${fmt(s.monto_actual || 0)}`).join(', ')
      : (lang === 'en' ? 'none' : lang === 'pt' ? 'nenhuma' : 'ninguna');

    const goalLines = goals.length
      ? goals.map(g => `${g.nombre}: objetivo ${fmt(g.monto_objetivo)}`).join(', ')
      : (lang === 'en' ? 'none' : lang === 'pt' ? 'nenhuma' : 'ninguna');

    const prompts = {
      es: `Eres Lib, el asesor financiero personal de ${nombre} en la app FinLibre.

ROL ESTRICTO: Solo puedes responder preguntas sobre finanzas personales: presupuesto, deudas, ahorro, gastos, metas financieras o cómo mejorar la situación económica de ${nombre}. Si el usuario pregunta sobre cualquier otro tema (tecnología, entretenimiento, historia, recetas, etc.), responde exactamente: "Solo puedo ayudarte con tus finanzas personales. ¿Tienes alguna pregunta sobre tu presupuesto, deudas o ahorros?" — sin excepciones.

DATOS REALES DE ${nombre.toUpperCase()} (usa estos números en tus respuestas):
- Ingreso mensual: ${fmt(ingreso)} | Moneda: ${currency}
- Servicios fijos (${services.length}): ${fmt(totalSvc)}/mes
${svcLines}
- Deudas activas (${debts.length}): Total adeudado ${fmt(totalDebt)}
${debtLines}
- Cuotas de deuda al mes: ${fmt(totalCuotas)}
- Alcancías (${savings.length}): ${savLines}
- Metas de ahorro (${goals.length}): ${goalLines}
- Dinero libre estimado: ${fmt(libre)}/mes

REGLAS DE RESPUESTA:
1. Usa los datos reales de arriba — nunca inventes cifras.
2. Da consejos concretos y accionables: qué puede hacer ${nombre} HOY para mejorar.
3. Máximo 4 oraciones por respuesta.
4. Texto plano — sin markdown, sin asteriscos, sin listas con guiones.
5. Tono cercano y motivador, como un amigo que sabe de finanzas.`,

      en: `You are Lib, the personal financial advisor of ${nombre} in the FinLibre app.

STRICT ROLE: You can ONLY answer questions about personal finance: budget, debts, savings, expenses, financial goals, or how to improve ${nombre}'s financial situation. If the user asks about any other topic (technology, entertainment, history, recipes, etc.), respond exactly: "I can only help you with your personal finances. Do you have a question about your budget, debts, or savings?" — no exceptions.

REAL DATA FOR ${nombre.toUpperCase()} (use these numbers in your answers):
- Monthly income: ${fmt(ingreso)} | Currency: ${currency}
- Fixed services (${services.length}): ${fmt(totalSvc)}/month
${svcLines}
- Active debts (${debts.length}): Total owed ${fmt(totalDebt)}
${debtLines}
- Monthly debt payments: ${fmt(totalCuotas)}
- Piggy banks (${savings.length}): ${savLines}
- Savings goals (${goals.length}): ${goalLines}
- Estimated free money: ${fmt(libre)}/month

RESPONSE RULES:
1. Use the real data above — never make up numbers.
2. Give concrete, actionable advice: what ${nombre} can do TODAY to improve.
3. Maximum 4 sentences per response.
4. Plain text — no markdown, no asterisks, no bullet lists.
5. Friendly and motivating tone, like a knowledgeable friend.`,

      pt: `Você é Lib, o consultor financeiro pessoal de ${nombre} no app FinLibre.

PAPEL ESTRITO: Você SÓ pode responder perguntas sobre finanças pessoais: orçamento, dívidas, poupança, gastos, metas financeiras ou como melhorar a situação financeira de ${nombre}. Se o usuário perguntar sobre qualquer outro assunto (tecnologia, entretenimento, história, receitas, etc.), responda exatamente: "Só posso ajudar com suas finanças pessoais. Tem alguma pergunta sobre seu orçamento, dívidas ou poupança?" — sem exceções.

DADOS REAIS DE ${nombre.toUpperCase()} (use estes números nas suas respostas):
- Renda mensal: ${fmt(ingreso)} | Moeda: ${currency}
- Serviços fixos (${services.length}): ${fmt(totalSvc)}/mês
${svcLines}
- Dívidas ativas (${debts.length}): Total devido ${fmt(totalDebt)}
${debtLines}
- Parcelas mensais: ${fmt(totalCuotas)}
- Cofrinhos (${savings.length}): ${savLines}
- Metas de poupança (${goals.length}): ${goalLines}
- Dinheiro livre estimado: ${fmt(libre)}/mês

REGRAS DE RESPOSTA:
1. Use os dados reais acima — nunca invente números.
2. Dê conselhos concretos e acionáveis: o que ${nombre} pode fazer HOJE para melhorar.
3. Máximo 4 frases por resposta.
4. Texto simples — sem markdown, sem asteriscos, sem listas.
5. Tom próximo e motivador, como um amigo que entende de finanças.`,
    };

    const greetings = {
      es: `¡Hola ${nombre}! Soy Lib. Tengo acceso a tu información financiera y estoy listo para ayudarte. ¿En qué te puedo orientar hoy?`,
      en: `Hi ${nombre}! I'm Lib. I have access to your financial information and I'm ready to help. What can I advise you on today?`,
      pt: `Olá ${nombre}! Sou Lib. Tenho acesso às suas informações financeiras e estou pronto para ajudar. Em que posso orientar você hoje?`,
    };

    const contents = [
      { role: 'user',  parts: [{ text: prompts[lang] || prompts.es }] },
      { role: 'model', parts: [{ text: greetings[lang] || greetings.es }] },
      ...history,
      { role: 'user',  parts: [{ text: message }] },
    ];

    const apiKey = process.env.GEMINI_API_KEY;
    const MODELS = [
      'gemini-flash-latest',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
    ];

    let geminiRes, data;
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      });
      if (geminiRes.ok) { data = await geminiRes.json(); break; }
      const errBody = await geminiRes.json().catch(() => ({}));
      console.warn(`Model ${model} failed:`, errBody?.error?.message);
    }

    if (!data) {
      console.error('[chat] Todos los modelos Gemini fallaron');
      return res.status(502).json({ message: 'Error al contactar con Gemini' });
    }

    let reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      || (lang === 'en' ? 'Sorry, I could not generate a response.' : lang === 'pt' ? 'Desculpe, não consegui gerar uma resposta.' : 'Lo siento, no pude generar una respuesta.');

    // Gemini sometimes prepends "text " as an artifact — strip it
    reply = reply.replace(/^text\s+/i, '');

    res.json({ reply });
  } catch (err) {
    console.error('[chat]', err.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
