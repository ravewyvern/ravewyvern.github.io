
function parse(code) {
    const lines = code.split('\n');
    let i = 0;
    const scope = new Set();

    function parseBlock(currentIndent = -1) {
        const block = { type: 'Program', body: [] };

        while (i < lines.length) {
            // ---- FIX FOR BUG #2 ----
            // Strip inline comments from the line first
            const rawLine = lines[i].split('//')[0];
            // ------------------------

            const indentMatch = rawLine.match(/^\s*/);
            const indent = indentMatch ? indentMatch[0].length : 0;
            const trimmedLine = rawLine.trim();

            if (indent < currentIndent) {
                break;
            }

            if (!trimmedLine) { // Skip empty lines
                i++;
                continue;
            }
            i++;

            let node = parseLine(trimmedLine, scope, i);
            if (node) {
                if (['IfStatement', 'WhileStatement', 'ForStatement', 'FunctionDeclaration'].includes(node.type)) {
                    node.body = parseBlock(indent + 1);
                }
                if (node.type === 'IfStatement') {
                    let currentNode = node; // Start the chain with the initial 'if'

                    while (i < lines.length && lines[i].split('#')[0].trim().startsWith('else if')) {
                        const elseIfLineRaw = lines[i].split('#')[0];
                        const elseIfLine = elseIfLineRaw.trim();
                        i++; // Consume the 'else if' line

                        // Create a new IfStatement for the 'else if' part
                        const elseIfNode = parseLine(elseIfLine, scope);
                        elseIfNode.body = parseBlock(indent + 1);

                        // Link it to the end of the current chain
                        currentNode.alternate = elseIfNode;
                        // IMPORTANT: Move the end of the chain forward
                        currentNode = elseIfNode;
                    }

                    // After all 'else if's, check for a final 'else'
                    if (i < lines.length && lines[i].split('#')[0].trim().startsWith('else:')) {
                        i++; // Consume the 'else' line
                        // Link the 'else' block to the end of the chain
                        currentNode.alternate = parseBlock(indent + 1);
                    }
                }
                // --- END OF NEW LOGIC ---
                block.body.push(node);
            }
        }
        return block;
    }

    return parseBlock();
}



function parseLine(line, scope, lineNumber) {
    let match;

    if (match = line.match(/^fun (\w+)\((.*)\):$/)) {
        const name = match[1];
        const params = match[2].split(',').map(p => p.trim()).filter(Boolean);
        // Add function name and params to the scope so they can be used
        scope.add(name);
        params.forEach(p => scope.add(p));

        return {
            type: 'FunctionDeclaration',
            name: name,
            params: params.map(p => ({ type: 'Identifier', name: p })),
            body: { type: 'Program', body: [] }
        };
    }

    if (match = line.match(/^return (.*)$/)) {
        return {
            type: 'ReturnStatement',
            argument: parseExpression(match[1])
        };
    }

    if (match = line.match(/^(println|print)\((.*)\)$/)) {
        return {
            type: match[1] === 'println' ? 'PrintLineStatement' : 'PrintStatement',
            expression: parseExpression(match[2].trim())
        };
    }

    if (line.includes('=')) {
        // Check for comparison operators first to avoid misinterpreting them as assignment
        if (line.includes('==') || line.includes('!=')) {
            // This is not an assignment, let other rules handle it.
        } else {
            // Use a more specific regex that finds the variable/member on the left,
            // and the rest of the expression on the right.
            const match = line.match(/^(.+?)\s*=\s*(.*)$/);
            if (match) {
                const left = parseExpression(match[1].trim());
                const right = parseExpression(match[2].trim());

                if (left.type === 'Identifier') {
                    const varName = left.name;
                    // This is a new declaration only if we haven't seen the variable before.
                    if (!scope.has(varName)) {
                        scope.add(varName);
                        return { type: 'VariableDeclaration', name: varName, value: right, line: lineNumber };
                    }
                }
                // For existing variables or array assignments (my_array[0] = ...)
                return { type: 'AssignmentExpression', left: left, right: right, line: lineNumber };
            }
        }
    }

    if (match = line.match(/^if (.*):$/)) {
        return {
            type: 'IfStatement',
            condition: parseExpression(match[1].trim()),
            body: { type: 'Program', body: [] },
            alternate: null
        };
    }

    if (match = line.match(/^while (.*):$/)) {
        return {
            type: 'WhileStatement',
            condition: parseExpression(match[1].trim()),
            body: { type: 'Program', body: [] }
        };
    }

    if (match = line.match(/^for (\w+) in range\((.*)\):$/)) {
        if (!scope.has(match[1])) scope.add(match[1]);
        return {
            type: 'ForStatement',
            variable: match[1],
            range: parseExpression(match[2].trim()),
            body: { type: 'Program', body: [] }
        };
    }

    if (match = line.match(/^else if (.*):$/)) {
        return {
            type: 'IfStatement',
            condition: parseExpression(match[1].trim()),
            body: { type: 'Program', body: [] },
            alternate: null,
        }
    }
    // Check for assignment
    if (line.includes('=')) {
        // Check for comparison first to avoid misinterpreting it as assignment
        if (line.includes('==') || line.includes('!=')) {
            // It's likely a condition, let parseExpression handle it.
        } else {
            match = line.match(/(.*)=\s*(.*)/);
            if (match) {
                const left = parseExpression(match[1].trim());
                const right = parseExpression(match[2].trim());

                // If the left side is a simple variable name (Identifier)
                if (left.type === 'Identifier') {
                    const varName = left.name;
                    if (!scope.has(varName)) {
                        scope.add(varName);
                        return { type: 'VariableDeclaration', name: varName, value: right, line: lineNumber };
                    }
                }
                // If the left side is an array access (MemberExpression) or a simple variable
                return { type: 'AssignmentExpression', left: left, right: right, line: lineNumber };
            }
        }
    }

    // If it's not any known statement, try to parse it as a function call on its own line
    const callMatch = line.match(/^(\w+)\((.*)\)$/);
    if(callMatch) {
        return { type: 'ExpressionStatement', expression: parseExpression(line) };
    }

    throw new Error(`Syntax Error: Unknown statement: ${line}`);
}

// No changes needed to parseExpression
// In parser.js

function parseExpression(expr) {
    expr = expr.trim();


    if (expr.startsWith('[') && expr.endsWith(']')) {
        const content = expr.slice(1, -1);
        if (content.trim() === '') return { type: 'ArrayExpression', elements: [] };
        const elements = content.split(',').map(e => parseExpression(e.trim()));
        return { type: 'ArrayExpression', elements: elements };
    }
    if (expr.startsWith('"') && expr.endsWith('"')) {
        const strValue = expr.slice(1, -1);
        if (strValue.includes('<') && strValue.includes('>')) {
            const template = strValue.replace(/<(\w+)>/g, `\${$1}`);
            return { type: 'TemplateLiteral', value: template };
        }
        return { type: 'StringLiteral', value: strValue };
    }

    // 2. Check for member access (both dot and bracket) and function calls.
    // This now correctly distinguishes between my_list[0] and math.random()
    const arrayAccessMatch = expr.match(/^(\w+)\[(.*)\]$/);
    if (arrayAccessMatch) {
        return {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: arrayAccessMatch[1] },
            property: parseExpression(arrayAccessMatch[2]),
            computed: true // 'true' means use brackets []
        };
    }

    const memberCallMatch = expr.match(/^([a-zA-Z0-9_]+)\.(.*)$/);
    if (memberCallMatch) {
        const objectName = memberCallMatch[1];
        const propertyExpression = memberCallMatch[2];
        const callMatch = propertyExpression.match(/^(\w+)\((.*)\)$/);
        if (callMatch) { // It's a namespaced function call: math.random()
            const funcName = callMatch[1];
            const argString = callMatch[2];
            const args = argString ? argString.split(',').map(arg => parseExpression(arg.trim())) : [];
            return {
                type: 'CallExpression',
                callee: {
                    type: 'MemberExpression',
                    object: { type: 'Identifier', name: objectName },
                    property: { type: 'Identifier', name: funcName },
                    computed: false // 'false' means use a dot .
                },
                arguments: args
            };
        }
    }

    const simpleCallMatch = expr.match(/^(\w+)\((.*)\)$/);
    if (simpleCallMatch) { // It's a simple function call: tester()
        const calleeName = simpleCallMatch[1];
        const argString = simpleCallMatch[2];
        const args = argString ? argString.split(',').map(arg => parseExpression(arg.trim())) : [];
        return { type: 'CallExpression', callee: { type: 'Identifier', name: calleeName }, arguments: args };
    }

    const operatorsInOrder = [
        // Level 1: Comparison
        '==', '!=', '>=', '<=', '>', '<',
        // Level 2: Addition/Subtraction
        '+', '-',
        // Level 3: Multiplication/Division
        '*', '/'
    ];

    for (const op of operatorsInOrder) {
        // We split only on the last occurrence of the operator to help with precedence.
        const parts = expr.split(op);
        if (parts.length > 1) {
            const right = parts.pop(); // Take the last part as the right side
            const left = parts.join(op); // Join the rest back in case the operator appeared earlier
            return {
                type: 'BinaryExpression',
                operator: op,
                left: parseExpression(left),
                right: parseExpression(right)
            };
        }
    }

    // 4. If nothing else matches, it must be a simple number, boolean, or variable name.
    if (!isNaN(parseFloat(expr)) && isFinite(expr)) {
        return { type: 'NumberLiteral', value: expr };
    }
    if (expr === 'True' || expr === 'False') {
        return { type: 'BooleanLiteral', value: expr };
    }

    return { type: 'Identifier', name: expr };
}
