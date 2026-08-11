import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";
import { enUS, vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateString: string, language: "vi" | "en" = "vi"): string {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return language === "vi" ? "Không rõ thời điểm" : "Time unavailable";
    }
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    // If less than 24 hours, show relative time
    if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true, locale: language === "vi" ? vi : enUS });
    }

    // Otherwise show formatted date
    return format(date, "MMM d, yyyy", { locale: language === "vi" ? vi : enUS });
}

export function extractDomain(url: string): string {
    try {
        const domain = new URL(url).hostname;
        // Remove 'www.' prefix if present
        return domain.replace(/^www\./, "");
    } catch {
        return url;
    }
}

export function getSourceName(url: string): string {
    const domain = extractDomain(url);

    if (domain.includes("coindesk")) return "Coindesk";
    if (domain.includes("cointelegraph")) return "Cointelegraph";

    return domain;
}

export function getErrorMessage(error: unknown, fallback: string): string {
    const candidate = error as { response?: { data?: { message?: unknown; request_id?: unknown } } };
    const message = typeof candidate?.response?.data?.message === "string" && candidate.response.data.message.trim()
        ? candidate.response.data.message
        : fallback;
    const requestID = candidate?.response?.data?.request_id;
    return typeof requestID === "string" && requestID.trim()
        ? `${message} (Request ID: ${requestID.trim()})`
        : message;
}

export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
}

/**
 * Extract first image URL from markdown content
 * Matches: ![alt](url) or ![](url)
 */
export function extractImageUrl(content: string): string | null {
    if (!content) return null;
    const match = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
    return match ? match[1] : null;
}
