const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const PRIMARY_MODEL = 'gemini-3.5-flash';
const FALLBACK_MODELS = ['gemini-3.1-flash-lite'];

export const geminiService = {
  async generateAnalysis(prompt: string): Promise<string> {
    const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || `Error con el modelo ${model}`);
        }

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error("No se pudo generar contenido de la respuesta de IA");
        }

        return text.trim();
      } catch (error) {
        console.warn(`Error con el modelo ${model}, intentando el siguiente si está disponible...`, error);
        lastError = error;
      }
    }

    throw lastError || new Error("Error al conectar con Gemini AI");
  }
};
