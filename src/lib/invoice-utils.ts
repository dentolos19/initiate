/**
 * Utility functions for invoice operations
 */

export function validateInvoiceAmount(amount: string): { isValid: boolean; message?: string } {
  const numericAmount = parseFloat(amount);

  if (isNaN(numericAmount)) {
    return { isValid: false, message: "Please enter a valid number." };
  }

  if (numericAmount <= 0) {
    return { isValid: false, message: "Amount must be greater than 0." };
  }

  if (numericAmount > 1000000) {
    return { isValid: false, message: "Amount cannot exceed $1,000,000." };
  }

  return { isValid: true };
}

export function validateMetadata(metadata: string): { isValid: boolean; message?: string } {
  if (!metadata.trim()) {
    return { isValid: true }; // Empty metadata is valid
  }

  try {
    JSON.parse(metadata);
    return { isValid: true };
  } catch {
    // If not valid JSON, check if it's a simple string
    if (metadata.includes(":") || metadata.includes("{") || metadata.includes("}")) {
      return { isValid: false, message: "Please enter valid JSON metadata or simple text." };
    }
    return { isValid: true }; // Simple text is valid
  }
}

export function parseMetadata(metadata: string): Record<string, string> | undefined {
  if (!metadata.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(metadata);
  } catch {
    // If JSON parsing fails, treat as simple key-value pair
    return { note: metadata.trim() };
  }
}

export function formatInvoiceAmount(amount: number): string {
  return (amount / 100).toFixed(2);
}

export function parseInvoiceAmount(amount: string): number {
  return Math.round(parseFloat(amount) * 100);
}

export function validateNewInvoice(data: { description: string; amount: string; currency?: string }): {
  isValid: boolean;
  message?: string;
} {
  if (!data.description.trim()) {
    return { isValid: false, message: "Description is required." };
  }

  if (data.description.length > 500) {
    return { isValid: false, message: "Description must be less than 500 characters." };
  }

  const amountValidation = validateInvoiceAmount(data.amount);
  if (!amountValidation.isValid) {
    return amountValidation;
  }

  if (data.currency && !["sgd", "usd", "eur", "gbp", "aud", "cad", "jpy"].includes(data.currency.toLowerCase())) {
    return { isValid: false, message: "Invalid currency code." };
  }

  return { isValid: true };
}
