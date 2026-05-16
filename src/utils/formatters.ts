/**
 * Formata um valor numérico para o padrão de moeda brasileiro (BRL).
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Calcula o tempo decorrido desde uma data ISO até agora.
 * Retorna em formato amigável (ex: 23min, 1h20min).
 */
export const formatElapsedTime = (isoDate: string): string => {
  const start = new Date(isoDate).getTime();
  const now = Date.now();
  const diffInMins = Math.floor((now - start) / 60000);

  if (diffInMins < 60) {
    return `${diffInMins}min`;
  }

  const hours = Math.floor(diffInMins / 60);
  const remainingMins = diffInMins % 60;
  return `${hours}h${remainingMins}min`;
};

/**
 * Valida se um PIN possui o formato correto (4 a 6 dígitos numéricos).
 */
export const validatePin = (pin: string): boolean => {
  return /^\d{4,6}$/.test(pin);
};
