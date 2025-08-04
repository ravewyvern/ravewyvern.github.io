document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selectors ---
    const equationDisplay = document.getElementById('equation-display');
    const resultDisplay = document.getElementById('result-display');
    const buttonsContainer = document.querySelector('.calculator-body');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const historyList = document.getElementById('history-list');
    const viewSwitcher = document.querySelector('.view-switcher');
    const settingsToggles = document.querySelectorAll('.toggle-switch input');

    // --- State Variables ---
    let currentEquation = '';
    let history = [];
    let parenthesesOpen = 0;

    // --- Calculation Engine ---
    /**
     * Formats a complex number object for display.
     * @param {object} c The complex number { re, im }.
     * @returns {string} The formatted string.
     */
    const formatComplexResult = (c) => {
        const re = parseFloat(c.re.toPrecision(10));
        const im = parseFloat(c.im.toPrecision(10));

        if (im === 0) return re.toString();
        if (re === 0) {
            if (im === 1) return 'i';
            if (im === -1) return '-i';
            return `${im}i`;
        }
        if (im > 0) {
            if (im === 1) return `${re} + i`;
            return `${re} + ${im}i`;
        }
        if (im < 0) {
            if (im === -1) return `${re} - i`;
            return `${re} - ${Math.abs(im)}i`;
        }
    };

    const factorial = (n) => {
        if (n < 0 || n % 1 !== 0) return NaN;
        if (n === 0) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    };

    /**
     * A more robust implementation of the Shunting-yard algorithm and RPN evaluation.
     * This version correctly handles operator precedence, associativity, and functions.
     * @param {string} infix The mathematical expression to evaluate.
     * @returns {number} The result of the calculation.
     */
    const evaluateExpression = (infix) => {
        // --- Complex Number Helpers ---
        const C = (re, im = 0) => ({ re, im });
        const add = (a, b) => C(a.re + b.re, a.im + b.im);
        const sub = (a, b) => C(a.re - b.re, a.im - b.im);
        const mul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
        const div = (a, b) => {
            const d = b.re * b.re + b.im * b.im;
            return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
        };
        const pow = (a, b) => { // Only supports real exponents for now
            if (b.im !== 0) return C(NaN, NaN);
            const r = Math.sqrt(a.re * a.re + a.im * a.im);
            const theta = Math.atan2(a.im, a.re);
            const newR = Math.pow(r, b.re);
            const newTheta = theta * b.re;
            return C(newR * Math.cos(newTheta), newR * Math.sin(newTheta));
        };
        const sqrt = (a) => pow(a, C(0.5));

        // --- Shunting-Yard Implementation ---
        const precedence = { '+': 1, '-': 1, '×': 2, '÷': 2, '^': 3 };
        const associativity = { '^': 'Right' };
        const output = [];
        const operators = [];
        const tokens = infix.match(/sin|cos|tan|asin|acos|atan|abs|exp|log|ln|√|π|!|%|e|i|\d+(\.\d+)?|[+\-×÷\^\(\)]/g) || [];

        tokens.forEach((token, index) => {
            if (!isNaN(parseFloat(token))) {
                output.push(C(parseFloat(token)));
            } else if (token === '-' && (index === 0 || tokens[index-1] === '(' || /[+\-×÷\^]/.test(tokens[index-1]))) {
                // Handle unary minus - push -1 and prepare for multiplication
                output.push(C(-1));
                operators.push('×');
            } else if (token === '-') {
                // This is a binary subtraction
                operators.push(token);
            } else if (token === 'i') {
                output.push(C(0, 1));
            } else if (scientific.constants[token]) {
                output.push(C(scientific.constants[token]));
            } else if (scientific.functions[token] || token === '√') {
                operators.push(token);
            } else if (token === '(') {
                operators.push(token);
            } else if (token === ')') {
                while (operators.length && operators[operators.length - 1] !== '(') output.push(operators.pop());
                if (operators[operators.length - 1] === '(') operators.pop();
                const lastOp = operators[operators.length - 1];
                if (scientific.functions[lastOp] || lastOp === '√') output.push(operators.pop());
            } else {
                const op1 = token;
                while (operators.length && operators[operators.length - 1] !== '(') {
                    const op2 = operators[operators.length - 1];
                    if ((associativity[op1] !== 'Right' && precedence[op1] <= precedence[op2]) || (associativity[op1] === 'Right' && precedence[op1] < precedence[op2])) {
                        output.push(operators.pop());
                    } else break;
                }
                operators.push(op1);
            }
        });

        while (operators.length) output.push(operators.pop());

        // --- RPN Evaluation on Complex Numbers ---
        const stack = [];
        output.forEach(token => {
            if (typeof token === 'object') { // It's a complex number
                stack.push(token);
            } else { // It's an operator/function
                if (scientific.functions[token] || token === '√' || token === '!' || token === '%') {
                    if (stack.length < 1) throw new Error("Syntax Error");
                    const a = stack.pop();
                    if (a.im !== 0) { // Most trig/log funcs are complex for complex inputs
                        stack.push(C(NaN, NaN)); // Placeholder for full complex library
                        return;
                    }
                    if (scientific.functions[token]) stack.push(C(scientific.functions[token](a.re)));
                    else if (token === '√') stack.push(sqrt(a));
                    else if (token === '!') stack.push(C(factorial(a.re)));
                    else if (token === '%') stack.push(C(a.re / 100));
                } else {
                    if (stack.length < 2) throw new Error("Syntax Error");
                    const b = stack.pop();
                    const a = stack.pop();
                    switch (token) {
                        case '+': stack.push(add(a, b)); break;
                        case '-': stack.push(sub(a, b)); break;
                        case '×': stack.push(mul(a, b)); break;
                        case '÷': stack.push(div(a, b)); break;
                        case '^': stack.push(pow(a, b)); break;
                    }
                }
            }
        });
        if (stack.length !== 1) throw new Error("Syntax Error");
        return stack[0]; // Return the complex result object
    };

    // --- Display and Input Functions ---

    const formatResult = (num) => parseFloat(num.toPrecision(12)).toString();

    const updateLiveResult = () => {
        if (!currentEquation) {
            resultDisplay.textContent = '';
            return;
        }
        try {
            const lastChar = currentEquation.slice(-1);
            if (/[+\-×÷\^\(]$/.test(lastChar)) {
                resultDisplay.textContent = '';
                return;
            }
            const result = evaluateExpression(currentEquation); // result is {re, im}
            if (!isNaN(result.re) && isFinite(result.re)) {
                if (result.im === 0) {
                    resultDisplay.textContent = result.re.toLocaleString('en-US', { maximumFractionDigits: 10 });
                } else {
                    // Otherwise, show the full complex string from our helper
                    resultDisplay.textContent = formatComplexResult(result);
                }
            } else {
                resultDisplay.textContent = '';
            }
        } catch (e) {
            resultDisplay.textContent = '';
        }
    };

    const calculateFinalResult = () => {
        if (!currentEquation) return;
        try {
            const result = evaluateExpression(currentEquation); // result is a complex object
            if (isNaN(result.re) || !isFinite(result.re)) throw new Error("Invalid");

            const formattedResult = formatComplexResult(result);
            addToHistory(currentEquation, formattedResult);
            currentEquation = formattedResult;
            equationDisplay.value = currentEquation;
            resultDisplay.textContent = '';
            parenthesesOpen = 0;
        } catch (error) {
            equationDisplay.value = 'Error';
            currentEquation = '';
            parenthesesOpen = 0;
        }
    };

    const handleInput = (value) => {
        if (equationDisplay.value === 'Error') currentEquation = '';

        // Special case for starting with a negative number
        if (currentEquation === '' && value === '-') {
            currentEquation = '-';
            equationDisplay.value = currentEquation;
            return;
        }

        // Smart Negative & Operator Blocking Logic
        const lastChar = currentEquation.slice(-1);
        const isLastCharOperator = /[×÷\+\^\-]$/.test(lastChar);
        const isValueOperator = /[×÷\+\^\-]$/.test(value);

        if (isLastCharOperator && value === '-') {
            currentEquation += '(-';
            parenthesesOpen++;
            equationDisplay.value = currentEquation;
            return;
        }

        if (isLastCharOperator && isValueOperator) {
            return; // Block consecutive operators
        }

        // Standard Input Handling
        if (value.endsWith('(')) {
            currentEquation += value;
            parenthesesOpen++;
        } else {
            switch (value) {
                case 'C': currentEquation = ''; parenthesesOpen = 0; break;
                case '=': case 'Enter': calculateFinalResult(); return;
                case 'Backspace':
                    if (currentEquation.slice(-1) === '(') parenthesesOpen--;
                    if (currentEquation.slice(-1) === ')') parenthesesOpen++;
                    if (currentEquation.endsWith('(-')) {
                        currentEquation = currentEquation.slice(0, -2);
                        parenthesesOpen--;
                    } else {
                        currentEquation = currentEquation.slice(0, -1);
                    }
                    break;
                case '()':
                    if (parenthesesOpen > 0 && (lastChar === '(' || !isNaN(parseInt(lastChar)))) {
                        currentEquation += ')';
                        parenthesesOpen--;
                    } else {
                        currentEquation += '(';
                        parenthesesOpen++;
                    }
                    break;
                // New function handlers
                case 'sqrt': currentEquation += '√('; parenthesesOpen++; break;
                case 'sin-inv': currentEquation += 'asin('; parenthesesOpen++; break;
                case 'cos-inv': currentEquation += 'acos('; parenthesesOpen++; break;
                case 'tan-inv': currentEquation += 'atan('; parenthesesOpen++; break;
                case 'abs': currentEquation += 'abs('; parenthesesOpen++; break;
                case 'e-power': currentEquation += 'exp('; parenthesesOpen++; break;

                default: currentEquation += value.replace('*', '×').replace('/', '÷');
            }
        }
        equationDisplay.value = currentEquation;
        updateLiveResult();
    };

    // --- View & Settings Management ---
    const checkScientificModeVisibility = () => {
        const isEnabledBySetting = document.body.classList.contains('scientific-setting-enabled');
        const isWideEnough = window.innerWidth >= 560;

        if (isEnabledBySetting && isWideEnough) {
            document.body.classList.add('scientific-mode-active');
        } else {
            document.body.classList.remove('scientific-mode-active');
        }
    };

    const applySettings = (settings) => {
        // Handle tab visibility toggles
        document.querySelectorAll('.toggle-switch input[data-setting]').forEach(toggle => {
            const settingName = toggle.dataset.setting;
            const viewName = toggle.dataset.view; // may be undefined

            // Only process if we have a valid setting name
            if (settingName) {
                const isEnabled = settings[settingName] !== false;
                toggle.checked = isEnabled;

                // If the toggle controls a view tab, show/hide the nav button
                if (viewName) {
                    const navButton = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
                    if (navButton) {
                        navButton.style.display = isEnabled ? 'flex' : 'none';
                    }
                }
            }
        });

        // Handle scientific mode setting
        const scientificEnabled = settings.scientific !== false; // Default to true
        const scientificToggle = document.getElementById('toggle-scientific');
        if (scientificToggle) scientificToggle.checked = scientificEnabled;

        if (scientificEnabled) {
            document.body.classList.add('scientific-setting-enabled');
        } else {
            document.body.classList.remove('scientific-setting-enabled');
        }
        checkScientificModeVisibility();
    };

    const saveSettings = () => {
        // Read existing settings (or use empty object)
        const raw = localStorage.getItem('calculatorSettings');
        const settings = raw ? JSON.parse(raw) : {};

        // Update with current toggles
        settingsToggles.forEach(toggle => {
            const name = toggle.dataset.setting;
            if (name) {
                settings[name] = toggle.checked;
            }
        });

        // Persist and apply
        localStorage.setItem('calculatorSettings', JSON.stringify(settings));
        applySettings(settings);
    };

    settingsToggles.forEach(toggle => {
        toggle.addEventListener('change', saveSettings);
    });

    viewSwitcher.addEventListener('click', (e) => {
        const button = e.target.closest('.nav-btn');
        if (!button) return;
        const viewToShow = button.dataset.view;

        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(`${viewToShow}-view`).classList.add('active');

        if (viewToShow === 'converter') {
            const valueToPass = resultDisplay.textContent.replace(/,/g, '') || equationDisplay.value || 1;
            converter.setValue(valueToPass);
        }
    });

    // --- History Management ---
    const renderHistory = () => {
        if (!historyList) return;
        historyList.innerHTML = '';
        history.slice().reverse().forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="history-equation">${item.equation}</span><span class="history-result">${item.result}</span>`;
            li.addEventListener('click', () => {
                currentEquation = item.result;
                equationDisplay.value = currentEquation;
                updateLiveResult();
                viewSwitcher.querySelector('[data-view="calculator"]').click();
            });
            historyList.appendChild(li);
        });
    };
    const addToHistory = (equation, result) => {
        history.push({ equation, result });
        if (history.length > 50) history.shift();
        saveHistory();
        renderHistory();
    };
    const saveHistory = () => {
        localStorage.setItem('calculatorHistory', JSON.stringify(history));
    };

    const loadHistory = () => {
        const raw = localStorage.getItem('calculatorHistory');
        if (raw) {
            history = JSON.parse(raw);
            renderHistory();
        }
    };
    const clearHistory = () => {
        history = [];
        saveHistory();
        renderHistory();
    };

    // --- Event Listeners ---
    buttonsContainer.addEventListener('click', (e) => {
        if (e.target.closest('button')) handleInput(e.target.closest('button').dataset.value);
    });
    const allowedInputIds = ['converter-input', 'equation-display']; // replace with your allowed IDs

    document.addEventListener('keydown', (e) => {
        const target = e.target;

        // If the event target is an input AND its ID is NOT in the list, skip handling
        if (target.tagName === 'INPUT' && !allowedInputIds.includes(target.id)) {
            return; // Let the key event go through normally
        }

        // Otherwise, prevent default and process keys
        e.preventDefault();
        const key = e.key;
        if ('0123456789./*-+^%'.includes(key)) handleInput(key);
        else if (key === 'Enter' || key === '=') handleInput('Enter');
        else if (key === 'Backspace') handleInput('Backspace');
        else if (key.toLowerCase() === 'c') handleInput('C');
        else if (key === '(' || key === ')') handleInput('()');
    });
    if(clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);

    // --- Theme Color Management ---
    const themeColorPicker = document.getElementById('theme-color-picker');

// Convert hex to HSL
    const hexToHSL = (hex) => {
        // Remove the # if present
        hex = hex.replace(/^#/, '');

        // Parse the hex values
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    };

// Convert HSL to hex
    const hslToHex = (h, s, l) => {
        h /= 360;
        s /= 100;
        l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

// Generate a Material You palette from a base color
    const generateMaterialPalette = (baseColor) => {
        const hsl = hexToHSL(baseColor);

        return {
            primary: hslToHex(hsl.h, hsl.s, 80), // Light primary for accents
            secondary: hslToHex((hsl.h + 60) % 360, hsl.s - 10, 75), // Complementary hue
            action: hslToHex((hsl.h + 180) % 360, hsl.s, 75), // Opposite hue
            surface: hslToHex(hsl.h, hsl.s * 0.2, 15), // Dark surface with a hint of color
            btnNumber: hslToHex(hsl.h, hsl.s * 0.3, 23), // Slightly lighter than surface
            btnOperator: hslToHex(hsl.h, hsl.s * 0.25, 18) // Between surface and btnNumber
        };
    };

// Apply the generated palette to CSS variables
    const applyColorTheme = (colorHex) => {
        const palette = generateMaterialPalette(colorHex);

        document.documentElement.style.setProperty('--primary-accent', palette.primary);
        document.documentElement.style.setProperty('--secondary-accent', palette.secondary);
        document.documentElement.style.setProperty('--action-accent', palette.action);
        document.documentElement.style.setProperty('--surface-color', palette.surface);
        document.documentElement.style.setProperty('--btn-bg-number', palette.btnNumber);
        document.documentElement.style.setProperty('--btn-bg-operator', palette.btnOperator);
    };

// Save the selected color to storage
    const saveColorTheme = (color) => {
        const raw = localStorage.getItem('calculatorSettings');
        const settings = raw ? JSON.parse(raw) : {};
        settings.themeColor = color;
        localStorage.setItem('calculatorSettings', JSON.stringify(settings));
    };

// ——— Load Settings on Startup ———
    const loadSettings = () => {
        const raw = localStorage.getItem('calculatorSettings');
        const settings = raw ? JSON.parse(raw) : {};

        applySettings(settings);

        if (settings.themeColor) {
            themeColorPicker.value = settings.themeColor;
            applyColorTheme(settings.themeColor);
        }
    };

// Add event listener for color picker
    if (themeColorPicker) {
        themeColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            applyColorTheme(color);
        });

        themeColorPicker.addEventListener('change', (e) => {
            const color = e.target.value;
            saveColorTheme(color);
        });
    }

    const resizeObserver = new ResizeObserver(checkScientificModeVisibility);
    resizeObserver.observe(document.body);

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-btn')) {
            const resultContainer = e.target.previousElementSibling;
            if (resultContainer) {
                const valueToCopy = resultContainer.textContent;
                navigator.clipboard.writeText(valueToCopy).then(() => {
                    e.target.textContent = 'Copied!';
                    setTimeout(() => {
                        e.target.textContent = 'Copy';
                    }, 1200);
                });
            }
        }
    });

    // --- Initialization ---
    loadHistory();
    loadSettings();


});

