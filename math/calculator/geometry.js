const geometry = {
    // --- DOM Elements ---
    inputs: {},
    outputs: {
        distance: null,
        midpoint: null,
        equation: null,
        relationship: null,
        parallelEq: null,
        perpEq: null,
    },
// Replace the entire init function
    init: function() {
        // Coordinate Points Tool
        this.inputs.x1 = document.getElementById('x1');
        this.inputs.y1 = document.getElementById('y1');
        this.inputs.x2 = document.getElementById('x2');
        this.inputs.y2 = document.getElementById('y2');
        this.outputs.distance = document.getElementById('geo-distance');
        this.outputs.midpoint = document.getElementById('geo-midpoint');
        this.outputs.equation = document.getElementById('geo-equation');

        // Line Relationship Tool
        this.inputs.line1Eq = document.getElementById('line1-eq');
        this.inputs.line2Eq = document.getElementById('line2-eq');
        this.outputs.relationship = document.getElementById('geo-relationship');

        // New Line Generator Tool
        this.inputs.pointInput = document.getElementById('point-input');
        this.inputs.lineEqInput = document.getElementById('line-eq-input');
        this.outputs.parallelEq = document.getElementById('geo-parallel-eq');
        this.outputs.perpEq = document.getElementById('geo-perp-eq');

        // Attach a single listener to all inputs
        for (const key in this.inputs) {
            if (this.inputs[key]) {
                this.inputs[key].addEventListener('input', () => this.updateCalculations());
            }
        }

        // Initial calculation
        this.updateCalculations();
    },

    // Replace the entire updateCalculations function
    updateCalculations: function() {
        // Tool 1: Coordinate Points
        const p1 = { x: parseFloat(this.inputs.x1.value), y: parseFloat(this.inputs.y1.value) };
        const p2 = { x: parseFloat(this.inputs.x2.value), y: parseFloat(this.inputs.y2.value) };
        if (!Object.values(p1).some(isNaN) && !Object.values(p2).some(isNaN)) {
            this.calculateDistance(p1, p2);
            this.calculateMidpoint(p1, p2);
            this.calculateEquation(p1, p2);
        }

        // Tool 2: Line Relationship
        this.calculateLineRelationship();

        // Tool 3: New Line Generator
        this.generateNewLines();
    },

    clearOutputs: function() {
        for (const key in this.outputs) {
            if (this.outputs[key]) this.outputs[key].textContent = '...';
        }
    },

    /**
     * Parses a slope-intercept equation string (y = mx + b) to get m and b.
     * @param {string} eq The equation string.
     * @returns {object|null} An object { m, b } or null if parsing fails.
     */
    parseEquation: function(eq) {
        try {
            // Normalize the equation string
            const normalizedEq = eq.replace(/\s/g, '').replace('y=', '');

            let m, b;

            // Find slope (m)
            if (normalizedEq.includes('x')) {
                const mPart = normalizedEq.split('x')[0];
                if (mPart === '' || mPart === '+') m = 1;
                else if (mPart === '-') m = -1;
                else m = parseFloat(mPart);
            } else {
                m = 0; // Horizontal line
            }

            // Find y-intercept (b)
            const bMatch = normalizedEq.match(/[+\-]\d+(\.\d+)?$/);
            if (bMatch) {
                b = parseFloat(bMatch[0]);
            } else if (!normalizedEq.includes('x')) {
                b = parseFloat(normalizedEq); // Case like "y=5"
            } else {
                b = 0; // Passes through origin
            }

            if (isNaN(m) || isNaN(b)) return null;
            return { m, b };

        } catch (error) {
            return null;
        }
    },

    calculateLineRelationship: function() {
        const eq1Str = this.inputs.line1Eq.value;
        const eq2Str = this.inputs.line2Eq.value;

        const line1 = this.parseEquation(eq1Str);
        const line2 = this.parseEquation(eq2Str);

        let relationshipText = 'Invalid Input';
        if (line1 && line2) {
            // Check for parallel lines
            if (line1.m === line2.m) {
                relationshipText = 'Parallel';
                // Check for perpendicular lines with a tolerance for floating point errors
            } else if (Math.abs(line1.m * line2.m + 1) < 0.001) {
                relationshipText = 'Perpendicular';
            } else {
                relationshipText = 'Neither';
            }
        }
        this.outputs.relationship.textContent = relationshipText;
    },

    generateNewLines: function() {
        const pointStr = this.inputs.pointInput.value.replace(/[\(\)\s]/g, '');
        const [x, y] = pointStr.split(',').map(parseFloat);

        const line = this.parseEquation(this.inputs.lineEqInput.value);

        if (isNaN(x) || isNaN(y) || !line) {
            this.outputs.parallelEq.textContent = 'Invalid Input';
            this.outputs.perpEq.textContent = '...';
            return;
        }

        // Parallel line (same slope, new y-intercept)
        const parallelSlope = line.m;
        const parallelB = y - parallelSlope * x;
        this.outputs.parallelEq.textContent = `y = ${parallelSlope}x ${parallelB >= 0 ? '+' : '-'} ${Math.abs(parallelB).toFixed(2)}`;

        // Perpendicular line (opposite reciprocal slope, new y-intercept)
        if (line.m === 0) { // Original is horizontal
            this.outputs.perpEq.textContent = `x = ${x}`;
        } else {
            const perpSlope = -1 / line.m;
            const perpB = y - perpSlope * x;
            this.outputs.perpEq.textContent = `y = ${perpSlope.toFixed(2)}x ${perpB >= 0 ? '+' : '-'} ${Math.abs(perpB).toFixed(2)}`;
        }
    },

    calculateDistance: function(p1, p2) {
        const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        this.outputs.distance.textContent = dist.toLocaleString(undefined, { maximumFractionDigits: 4 });
    },

    calculateMidpoint: function(p1, p2) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        this.outputs.midpoint.textContent = `(${midX.toLocaleString()}, ${midY.toLocaleString()})`;
    },

    calculateEquation: function(p1, p2) {
        if (p1.x === p2.x) { // Vertical line
            this.outputs.equation.textContent = `x = ${p1.x}`;
            return;
        }
        if (p1.y === p2.y) { // Horizontal line
            this.outputs.equation.textContent = `y = ${p1.y}`;
            return;
        }

        const slope = (p2.y - p1.y) / (p2.x - p1.x);
        const yIntercept = p1.y - slope * p1.x;

        const slopeStr = slope.toLocaleString(undefined, { maximumFractionDigits: 2 });
        const yIntStr = yIntercept.toLocaleString(undefined, { maximumFractionDigits: 2 });
        const operator = yIntercept >= 0 ? '+' : '-';
        const absYIntStr = Math.abs(yIntercept).toLocaleString(undefined, { maximumFractionDigits: 2 });

        this.outputs.equation.textContent = `y = ${slopeStr}x ${operator} ${absYIntStr}`;
    }
};

document.addEventListener('DOMContentLoaded', () => geometry.init());