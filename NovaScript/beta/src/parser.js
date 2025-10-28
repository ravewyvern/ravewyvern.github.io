import { NovaRuntime } from './runtime.js';

/*
 Very small line-oriented interpreter for NovaLang v0.1.
 Supported statements:
  - var [type] name = expr
  - const [type] name = expr
  - print(expr)
  - println(expr)
Expressions:
  - numbers (integers)
  - strings "..." with simple variable interpolation: <name> inside string
  - boolean: true / false
  - variable references: <name>
  - binary ops: left-to-right: ++ (concat), + (numeric add), -, *, /.
Rules:
  - '+' requires both operands to be numeric (coerce strings that look like numbers).
  - '++' concatenates: if both operands are numbers -> numeric concatenation (e.g. 4 ++ 4 => 44), else string concatenation.
*/

function isIntString(s) {
  if (typeof s !== 'string') return false;
  return /^-?\d+$/.test(s);
}

function toNumberIfPossible(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && isIntString(v)) return Number(v);
  return NaN;
}

export function interpret(code) {
    // environment: { name: { value, const, type } }
    const env = {};
    // expose environment globally for interpolation helpers (v0.1 convenience)
    globalThis.__nova_env__ = env;

    const lines = code.split(/\n/);
    try {
        for (let raw of lines) {
            let line = raw.trim();
            if (!line) continue;
            // remove single-line comments
            const commentIdx = line.indexOf('//');
            if (commentIdx === 0) continue;
            if (commentIdx > 0) line = line.slice(0, commentIdx).trim();
            // handle statements
            if (line.startsWith('var ') || line.startsWith('const ')) {
                handleVar(line, env);
                // keep global env in sync
                globalThis.__nova_env__ = env;
                continue;
            }
            if (line.startsWith('print(') && line.endsWith(')')) {
                const inner = line.slice(6, -1).trim();
                const val = evalExpr(inner, env);
                NovaRuntime.print(String(val));
                continue;
            }
            if (line.startsWith('println(') && line.endsWith(')')) {
                const inner = line.slice(8, -1).trim();
                const val = evalExpr(inner, env);
                NovaRuntime.println(String(val));
                continue;
            }
            if (line.length === 0) continue;
            // If we reach here it's an unknown statement
            throw new Error('Unknown or unsupported statement: ' + line);
        }
    } catch (e) {
        NovaRuntime.error(e.message);
    }
}


function handleVar(line, env) {
    // var [type]? name = expr
    // const [type]? name = expr
    const isConst = line.startsWith('const ');
    line = line.replace(/^const |^var /, '').trim();
    const eq = line.indexOf('=');
    if (eq === -1) throw new Error('Missing = in variable declaration: ' + line);
    const left = line.slice(0, eq).trim();
    const right = line.slice(eq + 1).trim();
    // left may be: "int name" or "name"
    const parts = left.split(/\s+/);
    let type = null;
    let name = null;
    if (parts.length === 1) {
        name = parts[0];
    } else if (parts.length === 2) {
        type = parts[0];
        name = parts[1];
    } else {
        throw new Error('Invalid variable declaration: ' + left);
    }
    if (!/^[A-Za-z_]\w*$/.test(name)) throw new Error('Invalid variable name: ' + name);
    const value = evalExpr(right, env);
    // type enforcement
    if (type) {
        if (type === 'int') {
            const n = Number(value);
            if (!Number.isInteger(n)) throw new Error(`Type error: expected int for ${name}`);
            env[name] = { value: n, const: isConst, type: 'int' };
        } else if (type === 'string') {
            env[name] = { value: String(value), const: isConst, type: 'string' };
        } else if (type === 'bool') {
            if (typeof value !== 'boolean') throw new Error(`Type error: expected bool for ${name}`);
            env[name] = { value: value, const: isConst, type: 'bool' };
        } else {
            throw new Error('Unknown type: ' + type);
        }
    } else {
        // infer type: int if integer, string if string, bool if boolean
        if (typeof value === 'number' && Number.isInteger(value)) {
            env[name] = { value: value, const: isConst, type: 'int' };
        } else if (typeof value === 'string') {
            env[name] = { value: value, const: isConst, type: 'string' };
        } else if (typeof value === 'boolean') {
            env[name] = { value: value, const: isConst, type: 'bool' };
        } else {
            // fallback stringify
            env[name] = { value: String(value), const: isConst, type: 'string' };
        }
    }

    // keep global env synced so string interpolation can access values
    globalThis.__nova_env__ = env;
}


function evalExpr(expr, env) {
  // Simple expression evaluator supporting literals, <var>, and binary ops ++, +, -, *, /
  // Tokenize respecting strings in double quotes.
  const tokens = tokenize(expr);
  // We'll do a simple left-to-right evaluation with operator precedence: *,/ before +,++,-
  // Convert to RPN or do two-pass: first handle * /
  const out = shuntingYard(tokens);
  return evalRPN(out, env);
}

function tokenize(s) {
    const tokens = [];
    let i = 0;
    while (i < s.length) {
        const ch = s[i];
        if (/\s/.test(ch)) { i++; continue; }
        if (ch === '"') {
            // string literal
            let j = i+1;
            let str = '';
            while (j < s.length) {
                if (s[j] === '\\' && j+1 < s.length) {
                    str += s[j+1]; j+=2; continue;
                }
                if (s[j] === '"') { break; }
                str += s[j]; j++;
            }
            if (j >= s.length) throw new Error('Unterminated string literal');
            tokens.push({type:'string', value: interpolateString(str)}); // interpolate <var> inside string
            i = j+1;
            continue;
        }
        if (ch === '<') {
            // variable reference like <name>
            let j = i+1;
            let name = '';
            while (j < s.length && s[j] !== '>') { name += s[j]; j++; }
            if (j >= s.length) throw new Error('Unterminated variable reference');
            tokens.push({type:'var', value: name});
            i = j+1;
            continue;
        }
        // multi-char operators: ++
        if (s.slice(i, i+2) === '++') { tokens.push({type:'op', value:'++'}); i+=2; continue; }
        if ('+-*/()'.includes(ch)) { tokens.push({type:'op', value:ch}); i++; continue; }
        // numbers or identifiers or booleans
        if (/[0-9]/.test(ch)) {
            let j = i; let num = '';
            while (j < s.length && /[0-9]/.test(s[j])) { num += s[j]; j++; }
            tokens.push({type:'number', value: Number(num)});
            i = j; continue;
        }
        // identifier (true/false or bare variable name)
        if (/[A-Za-z_]/.test(ch)) {
            let j = i; let id = '';
            while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) { id += s[j]; j++; }
            if (id === 'true') tokens.push({type:'bool', value:true});
            else if (id === 'false') tokens.push({type:'bool', value:false});
            else tokens.push({type:'var', value: id}); // treat as variable reference (bare variable)
            i = j; continue;
        }
        throw new Error('Unexpected character in expression: ' + ch);
    }
    return tokens;
}


function interpolateString(s) {
  // replace occurrences of <name> with its runtime value as string — but we don't have env here.
  // We'll return a marker and do replacement during eval by wrapping in special token with raw string and leaving variable markers like ${name}
  // For simplicity store as raw string with markers: we'll evaluate later at string value stage.
  return s.replace(/<([A-Za-z_]\w*)>/g, (m, name) => `\${${name}}`);
}

function shuntingYard(tokens) {
  const out = [];
  const ops = [];
  const prec = {'++':1, '+':1, '-':1, '*':2, '/':2};
  const isLeft = { '++':true, '+':true, '-':true, '*':true, '/':true };
  for (const t of tokens) {
    if (t.type === 'number' || t.type === 'string' || t.type === 'var' || t.type === 'bool') out.push(t);
    else if (t.type === 'op') {
      if (t.value === '(') { ops.push(t); }
      else if (t.value === ')') {
        while (ops.length && ops[ops.length-1].value !== '(') out.push(ops.pop());
        if (!ops.length) throw new Error('Mismatched parentheses');
        ops.pop();
      } else {
        while (ops.length && ops[ops.length-1].value !== '(') {
          const o2 = ops[ops.length-1].value;
          if ((isLeft[t.value] && prec[t.value] <= prec[o2]) || (!isLeft[t.value] && prec[t.value] < prec[o2])) {
            out.push(ops.pop());
            continue;
          }
          break;
        }
        ops.push(t);
      }
    }
  }
  while (ops.length) {
    const o = ops.pop();
    if (o.value === '(' || o.value === ')') throw new Error('Mismatched parentheses');
    out.push(o);
  }
  return out;
}

function evalRPN(rpn, env) {
    const st = [];
    for (const t of rpn) {
        if (t.type === 'number' || t.type === 'string' || t.type === 'bool') st.push(t.value);
        else if (t.type === 'var') {
            if (!(t.value in env)) throw new Error('Undefined variable: ' + t.value);
            st.push(env[t.value].value);
        } else if (t.type === 'op') {
            if (st.length < 2) throw new Error('Not enough operands for operator ' + t.value);
            const b = st.pop(); const a = st.pop();
            const res = applyOp(a, t.value, b);
            st.push(res);
        }
    }
    if (st.length !== 1) throw new Error('Invalid expression');

    // expand any ${name} interpolation markers in resulting string using current env
    let result = st[0];
    if (typeof result === 'string') {
        result = result.replace(/\$\{([A-Za-z_]\w*)\}/g, (m, name) => {
            if (name in env) return String(env[name].value);
            return '';
        });
    }
    return result;
}


function applyOp(a, op, b) {
  if (op === '+') {
    const na = toNumberIfPossible(a); const nb = toNumberIfPossible(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na + nb;
    throw new Error(`'+' operator requires numeric operands (got ${typeof a} and ${typeof b})`);
  }
  if (op === '++') {
    // if both numbers -> numeric concatenation (4 ++ 4 => 44)
    if (typeof a === 'number' && typeof b === 'number') {
      return Number(String(a) + String(b));
    }
    // otherwise string concatenation: convert both to strings, but expand ${var} markers if present
    const sa = String(a).replace(/\$\{([A-Za-z_]\w*)\}/g, (m, name) => {
      if (name in globalThis.__nova_env__) return String(globalThis.__nova_env__[name].value);
      return '';
    });
    const sb = String(b).replace(/\$\{([A-Za-z_]\w*)\}/g, (m, name) => {
      if (name in globalThis.__nova_env__) return String(globalThis.__nova_env__[name].value);
      return '';
    });
    // if both original values are numeric strings without interpolation, and both look like ints, we could return number, but spec says if either is string -> result string
    if (isIntString(sa) && isIntString(sb) && typeof a !== 'string' && typeof b !== 'string') {
      return Number(sa + sb);
    }
    return sa + sb;
  }
  if (op === '-') {
    const na = Number(a); const nb = Number(b);
    if (Number.isNaN(na) || Number.isNaN(nb)) throw new Error("'-' requires numeric operands");
    return na - nb;
  }
  if (op === '*') {
    // support string repetition if one operand is string and the other is integer
    if (typeof a === 'string' && Number.isInteger(Number(b))) return a.repeat(Number(b));
    if (typeof b === 'string' && Number.isInteger(Number(a))) return b.repeat(Number(a));
    const na = Number(a); const nb = Number(b);
    if (Number.isNaN(na) || Number.isNaN(nb)) throw new Error("'*' requires numeric operands");
    return na * nb;
  }
  if (op === '/') {
    const na = Number(a); const nb = Number(b);
    if (Number.isNaN(na) || Number.isNaN(nb)) throw new Error("'/' requires numeric operands");
    return na / nb;
  }
  throw new Error('Unsupported operator ' + op);
}
