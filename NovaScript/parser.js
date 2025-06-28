
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
        match = line.match(/^(\w+)\s*=\s*(.*)$/);
        if (match) {
            const varName = match[1];
            const value = parseExpression(match[2].trim());
            if (!scope.has(varName)) {
                scope.add(varName);
                return { type: 'VariableDeclaration', name: varName, value: value };
            } else {
                return { type: 'AssignmentExpression', name: varName, value: value };
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
        match = line.match(/^(\w+)\s*=\s*(.*)$/);
        // Ensure it's not a comparison operator like ==
        if (match && !line.trim().startsWith('==')) {
            const varName = match[1];
            const value = parseExpression(match[2].trim());
            if (!scope.has(varName)) {
                scope.add(varName);
                return { type: 'VariableDeclaration', name: varName, value: value };
            } else {
                return { type: 'AssignmentExpression', name: varName, value: value };
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

    if (expr.startsWith('"') && expr.endsWith('"')) {
        const strValue = expr.slice(1, -1);
        // This is the string interpolation logic that was being skipped before.
        if (strValue.includes('<') && strValue.includes('>')) {
            const regex = /<(\w+)>/g;
            // A simple trick to convert <var> to `${var}` for JS template literals
            const template = strValue.replace(regex, `\${$1}`);
            return { type: 'TemplateLiteral', value: template };
        }
        return { type: 'StringLiteral', value: strValue };
    }


    for (let i = expr.length - 1; i >= 0; i--) {
        if (expr[i] === '+' || expr[i] === '-') {
            // Basic check to not split on a negative number at the start
            if (i === 0) continue;
            return {
                type: 'BinaryExpression',
                operator: expr[i],
                left: parseExpression(expr.substring(0, i)),
                right: parseExpression(expr.substring(i + 1))
            };
        }
    }

    // Level 2: Multiplication and Division
    for (let i = expr.length - 1; i >= 0; i--) {
        if (expr[i] === '*' || expr[i] === '/') {
            return {
                type: 'BinaryExpression',
                operator: expr[i],
                left: parseExpression(expr.substring(0, i)),
                right: parseExpression(expr.substring(i + 1))
            };
        }
    }

    // Level 3: Comparison operators
    // Note: this is simplified and doesn't handle chaining like a > b > c
    const compOperators = ['==', '!=', '>=', '<='];
    for (const op of compOperators) {
        if (expr.includes(op)) {
            const parts = expr.split(op);
            return { type: 'BinaryExpression', operator: op, left: parseExpression(parts[0]), right: parseExpression(parts[1])};
        }
    }
    // Handle single > and < separately to avoid conflict with >= and <=
    if (expr.includes('>') && !expr.includes('=')) {
        const parts = expr.split('>');
        return { type: 'BinaryExpression', operator: '>', left: parseExpression(parts[0]), right: parseExpression(parts[1])};
    }
    if (expr.includes('<') && !expr.includes('=')) {
        const parts = expr.split('<');
        return { type: 'BinaryExpression', operator: '<', left: parseExpression(parts[0]), right: parseExpression(parts[1])};
    }


    // Base cases (things that are not binary expressions)
    const callMatch = expr.match(/^(\w+)\((.*)\)$/);
    if (callMatch) {
        const calleeName = callMatch[1];
        const argString = callMatch[2];
        const args = argString ? argString.split(',').map(arg => parseExpression(arg.trim())) : [];
        return { type: 'CallExpression', callee: { type: 'Identifier', name: calleeName }, arguments: args };
    }

    if (expr.startsWith('"') && expr.endsWith('"')) {
        // Same string parsing logic as before...
        return { type: 'StringLiteral', value: expr.slice(1, -1) };
    }
    if (!isNaN(parseFloat(expr)) && isFinite(expr)) {
        return { type: 'NumberLiteral', value: expr };
    }
    if (expr === 'True' || expr === 'False') {
        return { type: 'BooleanLiteral', value: expr };
    }

    return { type: 'Identifier', name: expr };
}