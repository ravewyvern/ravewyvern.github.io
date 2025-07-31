/**
 * This file defines the scientific functions and constants
 * used by the main calculator script.
 */
const scientific = {
    functions: {
        'sin': Math.sin,
        'cos': Math.cos,
        'tan': Math.tan,
        'asin': Math.asin, // sin⁻¹
        'acos': Math.acos, // cos⁻¹
        'atan': Math.atan, // tan⁻¹
        'log': Math.log10,
        'ln': Math.log,
        'abs': Math.abs,
        'exp': Math.exp,   // e^x
    },

    constants: {
        'e': Math.E,
        'π': Math.PI,
        // The imaginary unit 'i' is handled as a special case in the evaluation engine
    },
};