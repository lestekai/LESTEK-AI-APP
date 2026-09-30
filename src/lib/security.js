/**
 * Security & Sanitization Utilities for LESTEK
 * Hardening against XSS, Protocol Injection, and Credential Exposure
 */

/**
 * Escapes characters that have special meaning in HTML to prevent injection
 * @param {any} value 
 * @returns {string}
 */
export function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Validates and sanitizes URLs to strictly prevent javascript: and dangerous pseudo-protocols
 * @param {string} url 
 * @param {string} fallback 
 * @returns {string}
 */
export function sanitizeUrl(url, fallback = '#') {
    if (!url || typeof url !== 'string') return fallback;
    const trimmed = url.trim();
    // Allow relative paths, absolute http/https, mailto and tel
    if (/^(https?:\/\/|\/|mailto:|tel:)/i.test(trimmed)) {
        // Block dangerous chars in query or payload
        if (/^(javascript|vbscript|data):/i.test(trimmed)) {
            return fallback;
        }
        return trimmed;
    }
    return fallback;
}

/**
 * Sanitizes HTML allowing only safe formatting tags with no executable scripts or event handlers
 * @param {string} dirty 
 * @returns {string}
 */
export function sanitizeHtml(dirty) {
    if (!dirty || typeof dirty !== 'string') return '';

    // First strip outright dangerous tags completely (content inside scripts/styles too)
    let clean = dirty
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

    // Strip any inline event handlers (onerror, onload, onclick, onmouseover, etc.)
    clean = clean.replace(/\s*on\w+\s*=\s*(['"]).*?\1/gi, '');
    clean = clean.replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '');

    // Strip javascript: pseudo-protocol in any attribute
    clean = clean.replace(/(href|src|action|data)\s*=\s*(['"])\s*javascript:[^'"]*?\2/gi, '$1="#"');

    // Parse and reconstruct using DOMParser if available in browser
    if (typeof window !== 'undefined' && window.DOMParser) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div>${clean}</div>`, 'text/html');
            const allowedTags = new Set(['SPAN', 'BR', 'B', 'STRONG', 'EM', 'I', 'U', 'MARK', 'SUB', 'SUP']);
            const allowedAttrs = new Set(['class']);

            function cleanNode(node) {
                const children = Array.from(node.childNodes);
                for (const child of children) {
                    if (child.nodeType === Node.ELEMENT_NODE) {
                        if (!allowedTags.has(child.tagName)) {
                            // Replace element with its text content
                            const text = document.createTextNode(child.textContent || '');
                            node.replaceChild(text, child);
                        } else {
                            // Strip all non-whitelisted attributes
                            const attrs = Array.from(child.attributes);
                            for (const attr of attrs) {
                                if (!allowedAttrs.has(attr.name.toLowerCase())) {
                                    child.removeAttribute(attr.name);
                                }
                            }
                            cleanNode(child);
                        }
                    }
                }
            }

            cleanNode(doc.body);
            return doc.body.firstElementChild ? doc.body.firstElementChild.innerHTML : clean;
        } catch {
            return clean;
        }
    }

    return clean;
}

/**
 * Computes SHA-256 hash using the Web Crypto API
 * @param {string} text 
 * @returns {Promise<string>}
 */
export async function sha256(text) {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback simple deterministic hash if Web Crypto is unavailable
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(16);
}
