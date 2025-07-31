const proofs = {
    // --- Data: A list of common postulates, theorems, and definitions ---
    reasons: [
        { name: "Addition Property of Equality", def: "If two expressions are equal, adding the same value to both sides preserves the equality. For example, if a = b, then a + c = b + c." },
        { name: "Subtraction Property of Equality", def: "If two expressions are equal, subtracting the same value from both sides preserves the equality. If a = b, then a - c = b - c." },
        { name: "Multiplication Property of Equality", def: "If two expressions are equal, multiplying both sides by the same non-zero value preserves the equality. If a = b, then ac = bc." },
        { name: "Division Property of Equality", def: "If two expressions are equal and you're dividing by a non-zero number, the results remain equal. If a = b and c ≠ 0, then a/c = b/c." },
        { name: "Reflexive Property", def: "Any quantity is equal to itself. This is used to show that a segment, angle, or expression equals itself (e.g., a = a or ∠A ≅ ∠A)." },
        { name: "Symmetric Property", def: "If one quantity equals another, then the second equals the first. If a = b, then b = a. Useful for reversing an equation or congruence." },
        { name: "Transitive Property", def: "If two values are each equal to a third value, then they are equal to each other. If a = b and b = c, then a = c." },
        { name: "Substitution Property", def: "If two quantities are equal, one can be substituted for the other in any expression or equation. If a = b, you can replace a with b." },
        { name: "Segment Addition Postulate", def: "If a point lies between two others on a segment, the total length is the sum of the parts. If B is between A and C, then AB + BC = AC." },
        { name: "Angle Addition Postulate", def: "If a point lies in the interior of an angle, the angle is the sum of the two smaller angles. If B is in the interior of ∠AOC, then m∠AOB + m∠BOC = m∠AOC." },
        { name: "Definition of Congruent Segments", def: "Two segments are congruent if they have the same length, meaning they are equal in measurement." },
        { name: "Definition of Congruent Angles", def: "Two angles are congruent if they have the same degree measure." },
        { name: "Definition of Midpoint", def: "A midpoint divides a segment into two segments of equal length, making the segments congruent." },
        { name: "Definition of Angle Bisector", def: "An angle bisector divides an angle into two congruent angles, each with half the original measure." },
        { name: "Definition of Perpendicular Lines", def: "Two lines are perpendicular if they intersect to form four right angles, each measuring 90 degrees." },
        { name: "All Right Angles Are Congruent", def: "Any two right angles are always congruent because they each measure exactly 90 degrees." },
        { name: "Vertical Angles Theorem", def: "When two lines intersect, they form opposite (vertical) angles that are always congruent." },
        { name: "Linear Pair Postulate", def: "If two angles form a linear pair (adjacent angles on a straight line), then they are supplementary (add up to 180°)." },
        { name: "Definition of Supplementary Angles", def: "Two angles are supplementary if the sum of their measures is 180°." },
        { name: "Definition of Complementary Angles", def: "Two angles are complementary if the sum of their measures is 90°." },
        { name: "SSS Postulate", def: "Side-Side-Side Congruence: If all three sides of one triangle are congruent to the three sides of another triangle, then the triangles are congruent." },
        { name: "SAS Postulate", def: "Side-Angle-Side Congruence: If two sides and the included angle of one triangle are congruent to two sides and the included angle of another, the triangles are congruent." },
        { name: "ASA Postulate", def: "Angle-Side-Angle Congruence: If two angles and the included side of one triangle are congruent to those of another, the triangles are congruent." },
        { name: "AAS Theorem", def: "Angle-Angle-Side Congruence: If two angles and a non-included side of one triangle are congruent to those in another triangle, then the triangles are congruent." },
        { name: "HL Theorem", def: "Hypotenuse-Leg Theorem: In right triangles, if the hypotenuse and one leg of one triangle are congruent to those of another, then the triangles are congruent." },
        { name: "CPCTC", def: "Corresponding Parts of Congruent Triangles are Congruent: After proving triangles congruent, all matching parts are congruent too." },
        { name: "Definition of Congruent Triangles", def: "Two triangles are congruent if all three pairs of corresponding sides and all three pairs of corresponding angles are congruent." },
        { name: "Definition of a Linear Pair", def: "Two adjacent angles that form a straight line. The angles in a linear pair are always supplementary." },
        { name: "Distributive property", def: "a (b + c) = ab + ac" },
        { name: "Given", def: "Just the given information" }
    ],

    // --- DOM Elements ---
    searchBox: null,
    resultsList: null,
    proofTableBody: null,
    addRowBtn: null,
    focusedReasonCell: null,

    init: function() {
        this.searchBox = document.getElementById('proof-search');
        this.resultsList = document.getElementById('proof-results-list');
        this.proofTableBody = document.querySelector('#proof-table tbody');
        this.addRowBtn = document.getElementById('add-proof-row-btn');

        if (this.searchBox) {
            this.searchBox.addEventListener('input', () => this.filterReasons());
            this.addRowBtn.addEventListener('click', () => this.addProofRow());
            this.resultsList.addEventListener('click', (e) => this.handleReasonClick(e));

            // Add initial rows to the proof table
            this.addProofRow();
            this.addProofRow();
        }
    },

    /**
     * Filters the reasons list based on the search input.
     */
    filterReasons: function() {
        const query = this.searchBox.value.toLowerCase();
        this.resultsList.innerHTML = ''; // Clear previous results

        const filtered = this.reasons.filter(reason =>
            reason.name.toLowerCase().includes(query) ||
            reason.def.toLowerCase().includes(query)
        );

        filtered.forEach(reason => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${reason.name}</strong><p>${reason.def}</p>`;
            li.dataset.reason = reason.name;
            this.resultsList.appendChild(li);
        });
    },

    /**
     * Adds a new, empty row to the two-column proof table.
     */
    addProofRow: function() {
        const row = this.proofTableBody.insertRow();
        row.innerHTML = `
            <td><input type="text" placeholder="Statement..."></td>
            <td><input type="text" class="reason-input" placeholder="Reason..."></td>
            <td><button class="remove-row-btn">-</button></td>
        `;

        // Add listener for focusing on the new reason input
        row.querySelector('.reason-input').addEventListener('focus', (e) => {
            this.focusedReasonCell = e.target;
        });

        // Add listener for the remove button
        row.querySelector('.remove-row-btn').addEventListener('click', (e) => {
            e.target.closest('tr').remove();
        });
    },

    /**
     * Handles clicking a reason from the reference list.
     * @param {Event} e The click event.
     */
    handleReasonClick: function(e) {
        const reasonItem = e.target.closest('li');
        if (reasonItem && this.focusedReasonCell) {
            this.focusedReasonCell.value = reasonItem.dataset.reason;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => proofs.init());