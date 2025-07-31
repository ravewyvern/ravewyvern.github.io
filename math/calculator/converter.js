// This object will be accessible by script.js to pass values
const converter = {
    input: null,
    quantitySelect: null,
    fromUnitSelect: null,
    resultsList: null,
    currentValue: 1,

    // --- Unit Data ---
    // Base unit for each category is the one with a factor of 1
    units: {
        Length: {
            Meters: 1,
            Kilometers: 1000,
            Centimeters: 0.01,
            Millimeters: 0.001,
            Micrometers: 1e-6,
            Nanometers: 1e-9,
            Miles: 1609.34,
            Yards: 0.9144,
            Feet: 0.3048,
            Inches: 0.0254,
            NauticalMiles: 1852,
        },
        Mass: {
            Grams: 1,
            Kilograms: 1000,
            Milligrams: 0.001,
            Micrograms: 1e-6,
            Pounds: 453.592,
            Ounces: 28.3495,
            Tons: 1e6,
            Stone: 6350.29,
        },
        Time: {
            Seconds: 1,
            Milliseconds: 0.001,
            Microseconds: 1e-6,
            Nanoseconds: 1e-9,
            Minutes: 60,
            Hours: 3600,
            Days: 86400,
            Weeks: 604800,
            Months: 2629746, // Approx (30.44 days)
            Years: 31556952, // Approx (365.24 days)
        },
        Storage: {
            Bytes: 1,
            Kilobytes: 1024,
            Megabytes: 1024 ** 2,
            Gigabytes: 1024 ** 3,
            Terabytes: 1024 ** 4,
            Petabytes: 1024 ** 5,
            Bits: 0.125,
            Nibbles: 0.5,
        },
        Temperature: {
            // Special handling is needed for temperature in the recalculate function
            Celsius: 'celsius',
            Fahrenheit: 'fahrenheit',
            Kelvin: 'kelvin',
        },
        Area: {
            SquareMeters: 1,
            SquareKilometers: 1e6,
            SquareCentimeters: 0.0001,
            SquareMillimeters: 1e-6,
            SquareMiles: 2.59e6,
            SquareYards: 0.836127,
            SquareFeet: 0.092903,
            SquareInches: 0.00064516,
            Acres: 4046.86,
            Hectares: 10000,
        },
        Volume: {
            CubicMeters: 1,
            CubicCentimeters: 0.000001,
            CubicMillimeters: 1e-9,
            Liters: 0.001,
            Milliliters: 1e-6,
            CubicInches: 0.0000163871,
            CubicFeet: 0.0283168,
            CubicYards: 0.764555,
            Gallons: 0.00378541,
            Quarts: 0.000946353,
            Pints: 0.000473176,
            Cups: 0.00024,
            FluidOunces: 2.9574e-5,
            Tablespoons: 1.4787e-5,
            Teaspoons: 4.9289e-6,
        },
        Speed: {
            MetersPerSecond: 1,
            KilometersPerHour: 0.277778,
            MilesPerHour: 0.44704,
            FeetPerSecond: 0.3048,
            Knots: 0.514444,
        },
        Energy: {
            Joules: 1,
            Kilojoules: 1000,
            Calories: 4.184,
            Kilocalories: 4184,
            WattHours: 3600,
            KilowattHours: 3.6e6,
            BTU: 1055.06,
            Electronvolts: 1.60218e-19,
        },
        Pressure: {
            Pascals: 1,
            Kilopascals: 1000,
            Bars: 1e5,
            PSI: 6894.76,
            Atmospheres: 101325,
            Torr: 133.322,
            mmHg: 133.322,
        },
        Frequency: {
            Hertz: 1,
            Kilohertz: 1e3,
            Megahertz: 1e6,
            Gigahertz: 1e9,
            Terahertz: 1e12,
        },
    },

    /**
     * Initializes the converter, sets up DOM elements and event listeners.
     */
    init: function() {
        this.input = document.getElementById('converter-input');
        this.quantitySelect = document.getElementById('quantity-select');
        this.fromUnitSelect = document.getElementById('from-unit-select');
        this.resultsList = document.getElementById('converter-results');

        this.populateQuantitySelect();
        this.updateFromUnitSelect();
        this.recalculate();

        this.quantitySelect.addEventListener('change', () => {
            this.updateFromUnitSelect();
            this.recalculate();
        });
        this.fromUnitSelect.addEventListener('change', () => this.recalculate());
        this.input.addEventListener('input', () => this.recalculate());
    },

    /**
     * Sets the value in the converter's input field.
     * Called from script.js when switching views.
     * @param {number} value The value from the calculator.
     */
    setValue: function(value) {
        this.currentValue = parseFloat(value) || 0;
        if (this.input) {
            this.input.value = this.currentValue;
            this.recalculate();
        }
    },

    /**
     * Populates the quantity dropdown with categories from the units data.
     */
    populateQuantitySelect: function() {
        if (!this.quantitySelect) return;
        this.quantitySelect.innerHTML = '';
        for (const quantity in this.units) {
            const option = document.createElement('option');
            option.value = quantity;
            option.textContent = quantity;
            this.quantitySelect.appendChild(option);
        }
    },

    /**
     * Updates the 'from' unit dropdown based on the selected quantity.
     */
    updateFromUnitSelect: function() {
        if (!this.fromUnitSelect) return;
        this.fromUnitSelect.innerHTML = '';
        const selectedQuantity = this.quantitySelect.value;
        const units = this.units[selectedQuantity];
        for (const unit in units) {
            const option = document.createElement('option');
            option.value = unit;
            option.textContent = unit;
            this.fromUnitSelect.appendChild(option);
        }
    },

    /**
     * Core function to perform the conversion and update the results list.
     */
    recalculate: function() {
        if (!this.resultsList || !this.input) return;
        this.resultsList.innerHTML = '';
        const inputValue = parseFloat(this.input.value) || 0;
        const selectedQuantity = this.quantitySelect.value;
        const fromUnit = this.fromUnitSelect.value;

        if (!selectedQuantity || !fromUnit) return;

        const allUnits = this.units[selectedQuantity];

        // Special handling for Temperature
        if (selectedQuantity === 'Temperature') {
            let kelvin = 0;
            if (fromUnit === 'Celsius') kelvin = inputValue + 273.15;
            else if (fromUnit === 'Fahrenheit') kelvin = (inputValue - 32) * 5/9 + 273.15;
            else kelvin = inputValue; // Is already Kelvin

            for (const unit in allUnits) {
                let resultValue = 0;
                if (unit === 'Celsius') resultValue = kelvin - 273.15;
                else if (unit === 'Fahrenheit') resultValue = (kelvin - 273.15) * 9/5 + 32;
                else resultValue = kelvin;
                this.addResultToList(unit, resultValue);
            }
            return;
        }

        // Standard calculation for all other units
        const fromUnitFactor = allUnits[fromUnit];
        const valueInBaseUnit = inputValue * fromUnitFactor;

        for (const unit in allUnits) {
            const toUnitFactor = allUnits[unit];
            const resultValue = valueInBaseUnit / toUnitFactor;
            this.addResultToList(unit, resultValue);
        }
    },

    // Add this new helper function to avoid repeating code
    addResultToList: function(unit, value) {
        const li = document.createElement('li');
        const formattedResult = parseFloat(value.toPrecision(9)).toString();

        li.innerHTML = `
            <div class="result-text">
                <span class="result-value">${formattedResult}</span>
                <span class="result-unit">${unit}</span>
            </div>
            <button class="copy-btn" data-value="${formattedResult}">Copy</button>
        `;
        this.resultsList.appendChild(li);
    }
};

// Initialize the converter when the DOM is ready.
document.addEventListener('DOMContentLoaded', () => converter.init());
