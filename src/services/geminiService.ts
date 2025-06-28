/**
 * Serviço para integração com a API do Google Gemini
 * Responsável por processar mensagens e gerar respostas baseadas na personalidade do agente
 */

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

interface SendToGeminiParams {
  message: string;
  context: string;
  personality: string;
  conversationHistory?: GeminiMessage[];
}

/**
 * Envia mensagem para a API do Gemini e retorna resposta formatada
 * @param params - Parâmetros da mensagem incluindo contexto e personalidade
 * @returns Promise com a resposta do agente
 */
export const sendToGemini = async ({
  message,
  context,
  personality,
  conversationHistory = []
}: SendToGeminiParams): Promise<string> => {
  try {
    // Verificar se a API key está configurada
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API key do Gemini não configurada. Configure VITE_GEMINI_API_KEY no arquivo .env');
    }

    // Construir o prompt do sistema com personalidade e contexto
    const systemPrompt = `
Você é um assistente de IA com a seguinte personalidade e contexto:

PERSONALIDADE: ${personality}

CONTEXTO: ${context}

INSTRUÇÕES:
- Responda sempre de acordo com sua personalidade definida
- Mantenha consistência com o contexto fornecido
- Seja útil, preciso e mantenha o tom apropriado
- Se não souber algo, admita de forma educada
- Mantenha as respostas concisas mas informativas

Agora responda à mensagem do usuário mantendo sua personalidade:
`;

    // Preparar histórico da conversa para o Gemini
    const messages: GeminiMessage[] = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model',
        parts: [{ text: 'Entendido! Estou pronto para conversar mantendo minha personalidade e contexto. Como posso ajudá-lo?' }]
      },
      ...conversationHistory,
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    // Fazer requisição para a API do Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erro na API do Gemini: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`);
    }

    const data: GeminiResponse = await response.json();

    // Extrair e retornar a resposta
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Resposta inválida da API do Gemini');
    }

  } catch (error) {
    console.error('Erro ao comunicar com Gemini:', error);
    
    // Retornar mensagem de erro amigável baseada no tipo de erro
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return 'Desculpe, não consigo responder no momento. A API key não está configurada corretamente.';
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        return 'Desculpe, atingimos o limite de uso da API. Tente novamente mais tarde.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'Desculpe, estou com problemas de conexão. Verifique sua internet e tente novamente.';
      }
    }
    
    return 'Desculpe, ocorreu um erro inesperado. Tente novamente em alguns instantes.';
  }
};

/**
 * Valida se a configuração da API está correta
 * @returns boolean indicando se a API está configurada
 */
export const isGeminiConfigured = (): boolean => {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
};

/**
 * Testa a conexão com a API do Gemini
 * @returns Promise<boolean> indicando se a conexão foi bem-sucedida
 */
export const testGeminiConnection = async (): Promise<boolean> => {
  try {
    const response = await sendToGemini({
      message: 'Teste de conexão',
      context: 'Sistema de teste',
      personality: 'Assistente técnico'
    });
    return response.length > 0 && !response.includes('Desculpe');
  } catch {
    return false;
  }
};