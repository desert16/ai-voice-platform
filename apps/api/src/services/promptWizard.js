const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const sessions = new Map(); // sessionId -> { res, stream, history: [] }

class PromptWizard {
  
  startWizardStream(req, res) {
    const sessionId = Date.now().toString();
    
    const initialPrompt = "Merhaba! AI Sesli Ajanınızın mükemmel çalışması için birkaç soruya ihtiyacım var. Öncelikle, firma adınız nedir ve hangi sektörde hizmet veriyorsunuz?";

    sessions.set(sessionId, {
      res,
      history: [
        { role: 'model', parts: [{text: initialPrompt}] }
      ]
    });

    res.write(`data: ${JSON.stringify({ type: 'session_id', sessionId })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'question', text: initialPrompt })}\n\n`);

    return {
      destroy: () => sessions.delete(sessionId)
    };
  }

  async handleMessage(sessionId, message) {
    const session = sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    session.res.write(`data: ${JSON.stringify({ type: 'thinking' })}\n\n`);

    session.history.push({ role: 'user', parts: [{text: message}] });

    const systemInstruction = `
    Sen "VoiceCore Prompt Wizard" adlı uzman bir AI mühendisisin. 
    Amacın, bir şirketin çağrı merkezi AI ajanı için kusursuz bir 'System Prompt' hazırlamak.
    Adım adım şu bilgileri toplamalısın (eğer eksikse sor, fazlaysa bir sonrakine geç):
    1) Firma adı ve sektör
    2) Çalışma saatleri ve lokasyon
    3) Sunulan temel hizmetler / ürünler
    4) Müşterilerin en sık sorduğu sorular (SSS)
    5) İstenen ses tonu (Kurumsal, samimi, enerjik vb.)

    Eğer tüm bilgiler toplandıysa, aşağıdaki formatta (Markdown olmadan) optimize edilmiş bir Türkçe sistem promptu oluştur ve başına [PROMPT_READY] yaz:
    [PROMPT_READY]
    Senin adın [Ajan Adı]. Sen [Firma] için çalışan bir müşteri temsilcisisin...
    (Detaylı, kısıtlamaları olan, webhook kullanımına uygun mükemmel bir prompt yaz)

    Eğer bilgiler eksikse, bir sonraki eksik bilgiyi kibarca sor.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: session.history,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.4
        }
      });

      const responseText = response.text;
      session.history.push({ role: 'model', parts: [{text: responseText}] });

      if (responseText.includes('[PROMPT_READY]')) {
        const prompt = responseText.replace('[PROMPT_READY]', '').trim();
        session.res.write(`data: ${JSON.stringify({ type: 'prompt_ready', systemPrompt: prompt })}\n\n`);
      } else {
        session.res.write(`data: ${JSON.stringify({ type: 'question', text: responseText })}\n\n`);
      }

    } catch (err) {
      console.error(err);
      session.res.write(`data: ${JSON.stringify({ type: 'error', text: 'AI yaniti alinirken hata olustu.' })}\n\n`);
    }
  }
}

module.exports = new PromptWizard();
