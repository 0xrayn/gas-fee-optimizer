"use client";

export function getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getUserTimezoneAbbr(): string {
    const tz = getUserTimezone();
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "short",
    }).formatToParts(now);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? tz;
}

export function getUserUTCOffset(): string {
    const offset = -new Date().getTimezoneOffset();
    const h = Math.floor(Math.abs(offset) / 60);
    const m = Math.abs(offset) % 60;
    const sign = offset >= 0 ? "+" : "-";
    return `UTC${sign}${h}${m > 0 ? `:${String(m).padStart(2, "0")}` : ""}`;
}

export function formatLocalTime(date: Date): string {
    return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

export function formatLocalDateTime(date: Date): string {
    return date.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}

export function getHourLocal(date: Date): number {
    return parseInt(
        date.toLocaleString(undefined, { hour: "2-digit", hour12: false })
    );
}

export function getBestWindowHint(hourLocal: number): string {
    if (hourLocal >= 0 && hourLocal < 6) {
        return "Late night / early morning  typically the cheapest gas window globally.";
    } else if (hourLocal >= 6 && hourLocal < 10) {
        return "Early morning  US market not yet active, moderate fees expected.";
    } else if (hourLocal >= 10 && hourLocal < 14) {
        return "Midday  Asian markets active. Keep an eye on avg gas.";
    } else if (hourLocal >= 14 && hourLocal < 20) {
        return "Afternoon / evening  EU + US markets overlap. Gas tends to spike.";
    } else {
        return "Late evening  US market winding down. Fees may start dropping.";
    }
}
