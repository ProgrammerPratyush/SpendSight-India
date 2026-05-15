// Always display as Indian rupees with proper formatting
export function formatCurrency(paise: number): string {
    const rupees = paise / 100;
    return `Rs ${rupees.toLocaleString('en-IN', {
        maximumFractionDigits: 0,
    })}`;
}

// Short format for cards — Rs 1.2L instead of Rs 1,20,000
export function formatCurrencyShort(paise: number): string {
    const rupees = paise / 100;
    if (rupees >= 100000) return `Rs ${(rupees / 100000).toFixed(1)}L`;
    if (rupees >= 1000) return `Rs ${(rupees / 1000).toFixed(1)}K`;
    return `Rs ${rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// Convert rupees (from user input) to paise for API
export function rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
}

// Convert paise (from API) to rupees for display
export function paiseToRupees(paise: number): number {
    return paise / 100;
}