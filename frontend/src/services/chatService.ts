// chatService.ts
/**
 * Servicio de chat integrado con el backend
 */

// URL del backend - se puede configurar desde variables de entorno
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

/**
 * Obtener legajo del localStorage
 * @returns El número de legajo o null si no existe
 */
const getLegajoFromStorage = (): string | null => {
  try {
    const legajo = localStorage.getItem('legajo');
    if (!legajo) {
      console.warn('No se encontró el legajo en localStorage. Usando valor por defecto.');
    }
    return legajo;
  } catch (error) {
    console.error('Error al leer legajo del localStorage:', error);
    return null;
  }
};

/**
 * Envía un mensaje al chatbot
 * @param message - Mensaje del usuario
 * @returns Promise con la respuesta del bot
 */
export const sendMessage = async (message: string): Promise<string> => {
  const legajo = getLegajoFromStorage();

  // Validar que haya un legajo
  if (!legajo) {
    throw new Error('No se encontró el legajo. Por favor, configura tu legajo primero.');
  }

  try {
    console.log('[ChatService] Enviando mensaje al backend:', message);
    console.log('[ChatService] Legajo:', legajo);

    // Llamada al endpoint /mcp del backend
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload: {
          userPrompt: message,
          legajo: legajo,
        },
      }),
    });

    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ChatService] Error del servidor:', errorText);
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    // Parsear respuesta JSON
    const data = await response.json();
    console.log('[ChatService] Respuesta del backend:', data);

    // Extraer el texto de la respuesta
    // El backend retorna: { tool, parameters, data, summaryText }
    if (data.summaryText) {
      return data.summaryText;
    } else if (data?.data?.result) {
      // Si no hay summaryText, intentar usar el resultado crudo
      return JSON.stringify(data.data.result, null, 2);
    } else {
      throw new Error('Respuesta del servidor en formato inesperado');
    }
  } catch (error) {
    console.error('[ChatService] Error al enviar mensaje:', error);

    // Mensajes de error más amigables
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    }

    throw error;
  }
};

/**
 * Configurar el legajo en localStorage
 * Función auxiliar para testing
 * @param legajo - Número de legajo del estudiante
 */
export const setLegajo = (legajo: string): void => {
  try {
    localStorage.setItem('legajo', legajo);
    console.log('Legajo configurado:', legajo);
  } catch (error) {
    console.error('Error al guardar legajo en localStorage:', error);
  }
};

/**
 * Obtener el legajo actual
 * Función auxiliar para testing
 * @returns El número de legajo o null
 */
export const getLegajo = (): string | null => {
  return getLegajoFromStorage();
};
