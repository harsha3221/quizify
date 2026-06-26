import DOMPurify from 'dompurify';

/**
 * Safely sanitizes incoming HTML strings to prevent XSS.
 * Useful for rich text components or AI generated questions.
 */
export const createSafeHTML = (dirtyHTML) => {
    if (!dirtyHTML || typeof dirtyHTML !== 'string') {
        return { __html: '' };
    }

    const cleanHTML = DOMPurify.sanitize(dirtyHTML, {
        ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'code', 'pre', 'span'],
        ALLOWED_ATTR: ['href', 'target', 'class']
    });

    return { __html: cleanHTML };
};