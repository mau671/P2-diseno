import { ApiError } from "@/api/jikan";

/**
 * Translates API error messages to user-friendly translated messages
 * @param error - The error object (can be ApiError, Error, or unknown)
 * @param defaultKey - The default translation key to use if error doesn't match known patterns
 * @returns Translated error message
 */
export function getTranslatedErrorMessage(
  error: unknown,
  defaultKey: string
): string {
  // If it's not an Error instance, return the default message
  if (!(error instanceof Error)) {
    return defaultKey;
  }

  // Handle ApiError with known messages
  if (error instanceof ApiError) {
    const message = error.message.toLowerCase();
    
    // Map known Spanish error messages to translation keys
    if (message.includes("sin conexión") || message.includes("conexión")) {
      return "common.noInternet";
    }
    
    if (message.includes("demasiadas solicitudes") || message.includes("429")) {
      return "common.tooManyRequests";
    }
    
    if (message.includes("error al cargar")) {
      return "common.loadError";
    }
  }

  // For other errors, check if message matches known patterns
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return "common.noInternet";
  }
  
  if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
    return "common.tooManyRequests";
  }

  // Return default key for unknown errors
  return defaultKey;
}

