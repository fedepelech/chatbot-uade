import type { QueryIntent } from "../../types/index.js";

export function detectIntentByKeywords(userPrompt: string): QueryIntent {
    const lowerPrompt = userPrompt.toLowerCase();
    
    // Patrones MCP (consultas personales)
    const mcpPatterns = [
        /\b(mi|mis)\s+(nota|promedio|materia|examen|deuda|cuenta|dato|beca|historial)/,
        /cu[aá]nto\s+(debo|adeudo)/,
        /tengo\s+(pendiente|aprobad|cursand)/,
        /mostr[aá](me|rme)\s+(mi|mis)/
    ];
    
    // Patrones RAG (consultas institucionales)
    const ragPatterns = [
        /horario\s+de\s+atenci[oó]n/,
        /\b(sede|campus|ubicaci[oó]n)\b/,
        /c[oó]mo\s+(me\s+)?(inscribo|hago|solicito|tramito)/,
        /qu[eé]\s+(es|son|ofrece|significa)/,
        /\b(preuade|minor|equivalencia|intercambio|beca)\b/
    ];
    
    // Verificar MCP
    for (const pattern of mcpPatterns) {
        if (pattern.test(lowerPrompt)) {
            return {
                type: 'mcp',
                confidence: 0.8,
                reasoning: 'Detectado patrón de consulta personal (keyword matching)'
            };
        }
    }
    
    // Verificar RAG
    for (const pattern of ragPatterns) {
        if (pattern.test(lowerPrompt)) {
            return {
                type: 'rag',
                confidence: 0.8,
                reasoning: 'Detectado patrón de consulta institucional (keyword matching)'
            };
        }
    }
    
    // Default: si contiene "mi/mis" -> MCP, sino -> RAG
    if (/\b(mi|mis)\b/.test(lowerPrompt)) {
        return {
            type: 'mcp',
            confidence: 0.6,
            reasoning: 'Posesivos detectados, probablemente consulta personal'
        };
    }
    
    return {
        type: 'rag',
        confidence: 0.5,
        reasoning: 'No se detectaron patrones claros, asumiendo consulta general'
    };
}
