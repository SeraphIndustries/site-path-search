// Configuration for API endpoints and environment variables

// API base URL - can be configured via environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Screenshot service configuration
export const SCREENSHOT_CONFIG = {
	defaultWidth: 200,
	defaultHeight: 150,
	defaultQuality: 85,
	timeout: 10000, // 10 seconds
	// Full page screenshot configuration
	fullPageWidth: 800,
	fullPageHeight: 600
};

// Build the screenshot URL
export function getScreenshotUrl() {
	return `${API_BASE_URL}/screenshot`;
}

// Health check URL
export function getHealthUrl() {
	return `${API_BASE_URL}/health`;
}

// Links analysis URL
export function getLinksUrl(url: string) {
	return `${API_BASE_URL}/links?url=${encodeURIComponent(url)}`;
}

// Kagi search URL
export function getKagiSearchUrl() {
	return `${API_BASE_URL}/kagi-search`;
}
