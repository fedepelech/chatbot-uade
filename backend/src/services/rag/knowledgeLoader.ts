import * as fs from "node:fs";
import { Document } from "@langchain/core/documents";

export async function loadUADEKnowledge(filePath: string): Promise<Document[]> {
    console.log("📚 [RAG] Cargando base de conocimiento UADE...");
    
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const faqs = JSON.parse(content);
    
    // Simplificado: usar directamente la categoría del JSON
    const documents = faqs.map((faq: any, index: number) => {
        const combinedContent = `Pregunta: ${faq.pregunta}\n\nRespuesta: ${faq.respuesta}`;
        
        return new Document({
            pageContent: combinedContent,
            metadata: {
                id: `uade_faq_${String(index + 1).padStart(3, '0')}`,
                pregunta: faq.pregunta,
                respuesta: faq.respuesta,
                category: faq.category || faq.categoria
            }
        });
    });
    
    console.log(`✅ [RAG] Cargadas ${documents.length} FAQs institucionales`);
    return documents;
}
