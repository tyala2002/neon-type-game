/**
 * Calculates the Levenshtein distance between two strings.
 * @param {string} a - The first string (e.g., user input).
 * @param {string} b - The second string (e.g., target text).
 * @returns {number} - The edit distance.
 */
export const calculateLevenshteinDistance = (a, b) => {
    const matrix = [];

    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

/**
 * Calculates the accuracy percentage based on Levenshtein distance.
 * @param {string} input - The user's input.
 * @param {string} target - The target text.
 * @returns {number} - Accuracy percentage (0-100).
 */
export const calculateAccuracy = (input, target) => {
    if (!target) return 0;
    if (!input) return 0;

    const distance = calculateLevenshteinDistance(input, target);
    const maxLength = Math.max(input.length, target.length);

    if (maxLength === 0) return 100;

    const accuracy = ((maxLength - distance) / maxLength) * 100;
    return Math.max(0, Math.round(accuracy * 10) / 10); // Round to 1 decimal place
};
