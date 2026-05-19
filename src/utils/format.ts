export function getCurrency(): 'BRL' | 'USD' {
  return (localStorage.getItem('app_currency') as 'BRL' | 'USD') || 'BRL'
}

export function setCurrency(currency: 'BRL' | 'USD') {
  localStorage.setItem('app_currency', currency)
  // Despachar evento para notificar componentes se necessário
  window.dispatchEvent(new Event('currency_changed'))
}

export function formatCurrency(value: number): string {
  const currency = getCurrency()
  if (currency === 'USD') {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatCurrencyCompact(value: number): string {
  const currency = getCurrency()
  const formatted = value.toLocaleString(currency === 'USD' ? 'en-US' : 'pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
  return currency === 'USD' ? `$ ${formatted}` : `R$ ${formatted}`
}

export function getCurrencySymbol(): string {
  return getCurrency() === 'USD' ? '$' : 'R$'
}
