/**
 * Converts a JavaScript object to a serialized string with optional size and depth limits.
 *
 * @param {Object} object - The object to serialize.
 * @param {number} [maxDepth=Infinity] - The maximum depth of nested objects or arrays to serialize.
 * @param {number} [maxSize=Infinity] - The maximum size in bytes of the serialized output.
 * @param {function} [callback] - Function to execute when finished. Warning: returns immediately if callback is set.
 * @returns {string} The serialized string representation of the input object.
*/
function smartSerialize (object, maxDepth = Infinity, maxSize = Infinity, callback) {
  // When a callback is specified, the stack is split into serial batches of this size,
  // allowing other application code to execute between batches.
  const BATCH_SIZE = 10000

  // Used to avoid following circular references
  const seen = new WeakSet()

  let size = 0
  let sizeLimitReached = false
  function measureSize (value) {
    if (value === null || value === true) size += 4
    else if (value === false) size += 5
    else if (typeof value === 'string' || value instanceof String) size += value.length + 2 // + ""; not accounting for escape characters
    else if (typeof value === 'number' || value instanceof Number) size += String(value).length
    else if (value instanceof Date) size += 26 // ISO format + ""
    else if (value instanceof Error || value instanceof RegExp) size += value.toString()
    else if (typeof value === 'function') size += 13 + value.name.length // "[function ${value.name}]"
    if (size > maxSize) sizeLimitReached = true
  }
  function addSize (strLength) {
    size += strLength
    if (size > maxSize) {
      sizeLimitReached = true
    }
  }

  /*
   * These symbols are used to create mock opening and closing nodes for arrays and objects on the stack.
   * We can't put simple string values like '[' on the stack because the serialized object might contain these.
   */
  const LEFT_BRACKET = Symbol('[')
  const RIGHT_BRACKET = Symbol(']')
  const BRACKETS = Symbol('[]')
  const LEFT_BRACE = Symbol('{')
  const RIGHT_BRACE = Symbol('}')
  const BRACES = Symbol('{}')

  const enclosures = [LEFT_BRACKET, RIGHT_BRACKET, BRACKETS, LEFT_BRACE, RIGHT_BRACE, BRACES]

  const getEnclosure = (value) => {
    switch (value) {
      case LEFT_BRACKET: return '['
      case RIGHT_BRACKET: return ']'
      case BRACKETS: return '[]'
      case LEFT_BRACE: return '{'
      case RIGHT_BRACE: return '}'
      case BRACES: return '{}'
    }
  }

  let output = ''
  function render (key, value, index) {
    let str = ''
    if (index) str = ','
    if (key) str += '"' + key + '":'
    if (enclosures.includes(value)) {
      str += getEnclosure(value)
    } else if (typeof value === 'string' || value instanceof String) {
      str += '"' + escape(value) + '"'
    } else str += value
    output = str + output
  }

  /**
   * @see {@link https://github.com/bestiejs/json3/blob/master/lib/json3.js#L419 | JSON3 implementation}
   */
  // eslint-disable-next-line no-control-regex, no-misleading-character-class
  const ESCAPE_REGEXP = /[\x00-\x1f\x22\x5c]/g // ASCII: control characters 0-31; quote character; backslash

  /**
   * Escapes any characters that would create a problematic string representation.
   * @see {@link https://github.com/douglascrockford/JSON-js/blob/master/json2.js#L215-L231 | JSON2 quote function}
   *
   * @param {string} value - A string to be checked for problem characters and escaped.
   */
  function escape (value) {
    ESCAPE_REGEXP.lastIndex = 0 // always reset the index at which to start the next match
    if (ESCAPE_REGEXP.test(value)) {
      return value.replaceAll(ESCAPE_REGEXP, function (a) {
        const c = {
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"': '\\"',
          '\\': '\\\\'
        }[a]
        if (typeof c === 'string') return c
        return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4)
      })
    }
    return value
  }

  const stack = [[null, object, undefined, 0]] // key, value, index, depth

  function iterateStack (callback) {
    const [key, value, index, depth] = stack.pop()
    if (seen.has(value)) {
      addSize(20) // [circular reference]
      if (!sizeLimitReached) render(key, '[circular reference]', index)
    } else if (typeof value === 'function') {
      render(key, `[function ${value.name || '(anonymous)'}]`, index, depth)
    } else if (value !== null && typeof value === 'object') {
      seen.add(value)
      if (Array.isArray(value)) {
        addSize(2) // []
        if (!sizeLimitReached && depth < maxDepth) {
          stack.push([key, LEFT_BRACKET, index, depth])
          for (let i = 0; i < value.length; i++) {
            measureSize(value[i])
            if (!sizeLimitReached) stack.push([null, value[i], i, depth + 1])
          }
          stack.push([undefined, RIGHT_BRACKET, undefined, depth])
        } else {
          render(key, BRACKETS, index)
        }
      } else if (value instanceof Date) {
        render(key, value.toISOString(), index, depth)
      } else if (value instanceof Error || value instanceof RegExp) {
        render(key, value.toString(), index, depth)
      } else {
        const keys = Object.keys(value)
        if (keys.length) {
          addSize(2) // {}
          if (!sizeLimitReached && depth < maxDepth) {
            stack.push([key, LEFT_BRACE, index, depth])
            keys.forEach((k, i) => {
              addSize(k.length + 3) // "":
              if (!sizeLimitReached) measureSize(value[k])
              if (!sizeLimitReached) stack.push([k, value[k], i, depth + 1])
            })
            stack.push([undefined, RIGHT_BRACE, undefined, depth])
          } else {
            render(key, BRACES, index)
          }
        }
      }
    } else {
      render(key, value, index)

      if (index) addSize(1) // comma for indexes > 0
    }
  }

  if (callback) {
    function callbackStack () {
      let i = 0
      while (stack.length && i < BATCH_SIZE) {
        iterateStack()
        i++
      }
      if (stack.length) {
        setTimeout(callbackStack) // breaks execution momentarily
      } else {
        callback(output)
        return undefined
      }
    }
    callbackStack()
  } else {
    while (stack.length) {
      iterateStack()
    }
  }

  return output
}

module.exports = smartSerialize
