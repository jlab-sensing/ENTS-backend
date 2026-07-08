/* eslint-disable no-use-before-define -- parser helpers are mutually recursive */
import { resolveStreamSpec } from './equationStreams';

/**
 * @typedef {'number' | 'stream' | 'unary' | 'binary'} AstNodeType
 */

/**
 * @typedef {object} AstNode
 * @property {AstNodeType} type
 * @property {number} [value]
 * @property {string} [ref] - e.g. "2:vwc"
 * @property {'+' | '-' | '*' | '/' | '^'} [op]
 * @property {AstNode} [left]
 * @property {AstNode} [right]
 * @property {AstNode} [arg]
 */

/**
 * @param {string} expression
 * @returns {string | null}
 */
export function validateEquationExpression(expression) {
  const trimmed = expression?.trim();
  if (!trimmed) return 'Expression is required';

  try {
    const tokens = tokenize(trimmed);
    parseExpression(tokens);
    return null;
  } catch (err) {
    return err.message || 'Invalid expression';
  }
}

/**
 * @param {string} expression
 * @returns {boolean}
 */
export function isDerivedLayoutEntry(expression) {
  return validateEquationExpression(expression) === null;
}

/**
 * @param {string} expression
 * @returns {string[]}
 */
export function extractCellStreamRefs(expression) {
  const refs = new Set();
  const re = /(\d+):([a-zA-Z][a-zA-Z0-9_]*)/g;
  let match;
  while ((match = re.exec(expression)) !== null) {
    const ref = `${match[1]}:${match[2]}`;
    const spec = resolveStreamSpec(match[2]);
    if (!spec) {
      throw new Error(`Unknown sensor stream "${match[2]}" in ${ref}`);
    }
    refs.add(ref);
  }
  return [...refs];
}

/**
 * @param {string} expression
 * @param {Record<string, number>} env
 * @returns {number | null}
 */
export function evaluateEquationAt(expression, env) {
  const tokens = tokenize(expression.trim());
  const ast = parseExpression(tokens);
  return evalAst(ast, env);
}

/**
 * @param {string} input
 * @returns {{ type: string, value?: number | string, ref?: string }[]}
 */
function tokenize(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if (/\d/.test(ch)) {
      const cellMatch = input.slice(i).match(/^(\d+):([a-zA-Z][a-zA-Z0-9_]*)/);
      if (cellMatch) {
        const ref = `${cellMatch[1]}:${cellMatch[2]}`;
        if (!resolveStreamSpec(cellMatch[2])) {
          throw new Error(`Unknown sensor stream "${cellMatch[2]}"`);
        }
        tokens.push({ type: 'stream', ref });
        i += ref.length;
        continue;
      }

      let num = ch;
      i += 1;
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i];
        i += 1;
      }
      const value = Number(num);
      if (Number.isNaN(value)) throw new Error(`Invalid number "${num}"`);
      tokens.push({ type: 'number', value });
      continue;
    }

    if (/[a-zA-Z]/.test(ch)) {
      throw new Error('Use cell:stream tokens like 1:vwc (not bare names)');
    }

    if (ch === '(' || ch === ')') {
      tokens.push({ type: ch });
      i += 1;
      continue;
    }

    if ('+-*/^'.includes(ch)) {
      tokens.push({ type: 'operator', value: ch });
      i += 1;
      continue;
    }

    throw new Error(`Unexpected character "${ch}"`);
  }

  return tokens;
}

/**
 * @param {{ type: string, value?: number | string, ref?: string }[]} tokens
 * @returns {AstNode}
 */
function parseExpression(tokens) {
  let pos = 0;

  function peek() {
    return tokens[pos];
  }

  function consume(expectedType) {
    const token = tokens[pos];
    if (!token || token.type !== expectedType) {
      throw new Error('Invalid expression syntax');
    }
    pos += 1;
    return token;
  }

  function parsePrimary() {
    const token = peek();
    if (!token) throw new Error('Unexpected end of expression');

    if (token.type === 'number') {
      consume('number');
      return { type: 'number', value: token.value };
    }

    if (token.type === 'stream') {
      consume('stream');
      return { type: 'stream', ref: token.ref };
    }

    if (token.type === '(') {
      consume('(');
      const node = parseAddSub();
      if (peek()?.type !== ')') throw new Error('Missing closing parenthesis');
      consume(')');
      return node;
    }

    if (token.type === 'operator' && token.value === '-') {
      consume('operator');
      return { type: 'unary', op: '-', arg: parsePrimary() };
    }

    throw new Error('Invalid expression syntax');
  }

  function parsePower() {
    let node = parsePrimary();
    while (peek()?.type === 'operator' && peek().value === '^') {
      consume('operator');
      node = { type: 'binary', op: '^', left: node, right: parsePrimary() };
    }
    return node;
  }

  function parseMulDiv() {
    let node = parsePower();
    while (peek()?.type === 'operator' && (peek().value === '*' || peek().value === '/')) {
      const op = consume('operator').value;
      node = { type: 'binary', op, left: node, right: parsePower() };
    }
    return node;
  }

  function parseAddSub() {
    let node = parseMulDiv();
    while (peek()?.type === 'operator' && (peek().value === '+' || peek().value === '-')) {
      const op = consume('operator').value;
      node = { type: 'binary', op, left: node, right: parseMulDiv() };
    }
    return node;
  }

  const ast = parseAddSub();
  if (pos !== tokens.length) throw new Error('Invalid expression syntax');
  return ast;
}

/**
 * @param {AstNode} node
 * @param {Record<string, number>} env
 * @returns {number | null}
 */
function evalAst(node, env) {
  switch (node.type) {
    case 'number':
      return node.value ?? null;
    case 'stream': {
      const value = env[node.ref];
      if (value == null || Number.isNaN(value)) return null;
      return value;
    }
    case 'unary': {
      const arg = evalAst(node.arg, env);
      if (arg == null) return null;
      return node.op === '-' ? -arg : arg;
    }
    case 'binary': {
      const left = evalAst(node.left, env);
      const right = evalAst(node.right, env);
      if (left == null || right == null) return null;
      switch (node.op) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          return right === 0 ? null : left / right;
        case '^':
          return Math.pow(left, right);
        default:
          return null;
      }
    }
    default:
      return null;
  }
}
