// transpiler.js

function generate(node) {
    if (!node) return '';

    const wrap = (code, line) => {
        // Only wrap if we have a valid line number
        if (line !== undefined) {
            // We pass the JS error 'e' and the original line number to our handler.
            // We also re-throw the error to stop script execution.
            return `try { ${code} } catch (e) { _handleRuntimeError(e, ${line + 1}); throw e; }`;
        }
        return code;
    };

    switch (node.type) {
        case 'Program':
            return node.body.map(generate).filter(Boolean).join('\n');

        case 'ExpressionStatement':
            return `${generate(node.expression)};`;

        case 'FunctionDeclaration': {
            const name = node.name;
            const params = node.params.map(p => generate(p)).join(', ');
            const body = generate(node.body);
            // We use 'function' instead of 'let' to allow hoisting, which is how Python/JS behave.
            return `function ${name}(${params}) {\n${body}\n}`;
        }

        case 'CallExpression': {
            const calleeName = node.callee.name;
            const args = node.arguments.map(arg => generate(arg)).join(', ');

            if (window._extensionExists(calleeName)) {
                return `_callExtension("${calleeName}", [${args}])`;
            }

            if (calleeName === 'print' || calleeName === 'println') {
                return `_${calleeName}(${args})`;
            }

            return `${calleeName}(${args})`;
        }

        case 'ReturnStatement': {
            return `return ${generate(node.argument)};`;
        }

        case 'PrintLineStatement':
            return `_println(${generate(node.expression)});`;
        case 'PrintStatement':
            return `_print(${generate(node.expression)});`;

        case 'VariableDeclaration':
            return `let ${node.name} = ${generate(node.value)};`;

        // NEW: Handles updating an existing variable
        case 'AssignmentExpression':
            return `${node.name} = ${generate(node.value)};`;

        case 'IfStatement':
            const condition = generate(node.condition);
            const consequent = generate(node.body);
            const alternate = node.alternate ? ` else ${generate(node.alternate)}` : '';
            // If the body is empty, we don't need curly braces.
            const bodyBlock = consequent ? `{\n${consequent}\n}` : '';
            return `if (${condition}) ${bodyBlock}${alternate}`;

        case 'WhileStatement':
            const whileCondition = generate(node.condition);
            const whileBody = generate(node.body);
            return `while (${whileCondition}) {\n${whileBody}\n}`;

        case 'ForStatement':
            const forVar = node.variable;
            const forRange = generate(node.range);
            const forBody = generate(node.body);
            return `for (let ${forVar} = 0; ${forVar} < ${forRange}; ${forVar}++) {\n${forBody}\n}`;

        case 'BinaryExpression':
            const left = generate(node.left);
            const right = generate(node.right);
            return `(${left} ${node.operator} ${right})`;

        case 'TemplateLiteral':
            return `\`${node.value}\``; // Just wrap the value in backticks.

        case 'Identifier':
            return node.name;
        case 'NumberLiteral':
            return node.value;
        case 'StringLiteral':
            return JSON.stringify(node.value);
        case 'BooleanLiteral':
            return node.value.toLowerCase();

        default:
            throw new TypeError(`Unknown node type: ${node.type}`);
    }
}

function transpile(ast) {
    return generate(ast);
}