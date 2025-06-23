
export function canAskToday(max = 20): boolean {
    const key = 'inovus-daily-usage';
    const now = Date.now();
    let stamps: number[] = [];

    try {
        stamps = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        stamps = [];
    }

    // Keep only timestamps from the last 24 hours
    stamps = stamps.filter(ts => now - ts < 24 * 60 * 60 * 1000);

    if (stamps.length >= max) return false;

    stamps.push(now);
    localStorage.setItem(key, JSON.stringify(stamps));
    return true;
}
