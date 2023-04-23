/**
 * Converts a JavaScript object to a serialized string with optional size and depth limits.
 *
 * @param {Object} object - The object to serialize.
 * @param {number} [maxDepth=Infinity] - The maximum depth of nested objects or arrays to serialize.
 * @param {number} [maxSize=Infinity] - The maximum size in bytes of the serialized output.
 * @returns {string} The serialized string representation of the input object.
*/
function smartSerialize (object, maxDepth = Infinity, maxSize = Infinity) {
  const seen = new WeakSet()

  let output = ''
  function isBraceOrBracket (value) {
    return value === '[' || value === ']' || value === '[]' || value === '{' || value === '}' || value === '{}'
  }
  function render (key, value, index) {
    let str = ''
    if (index) str = ','
    if (key) str += '"' + key + '":'
    if (isBraceOrBracket(value)) {
      str += value
    } else if (typeof value === 'string') {
      str += '"' + value + '"'
    } else str += value
    output = str + output
  }

  let size = 0
  let sizeLimitReached = false
  function measureSize (value) {
    if (value === null || value === true) size += 4
    else if (value === false) size += 5
    else if (typeof value === 'string') size += value.length + 2 // + ""
    else if (typeof value === 'number') size += String(value).length
    else if (value instanceof Date) size += 26 // ISO format + ""
    if (size > maxSize) {
      sizeLimitReached = true
    }
  }
  function addSize (strLength) {
    size += strLength
    if (size > maxSize) {
      sizeLimitReached = true
    }
  }

  const stack = [[null, object, undefined, 0]] // key, value, index, depth

  while (stack.length) {
    const [key, value, index, depth] = stack.pop()
    if (typeof value === 'object' && !seen.has(value)) {
      seen.add(value)
      if (Array.isArray(value)) {
        addSize(2) // []
        if (!sizeLimitReached && depth < maxDepth) {
          stack.push([key, '[', index, depth])
          for (let i = 0; i < value.length; i++) {
            measureSize(value[i])
            if (!sizeLimitReached) stack.push([null, value[i], i, depth + 1])
          }
          stack.push([undefined, ']', undefined, depth])
        } else {
          render(key, '[]', index)
        }
      } else if (value instanceof Date) {
        render(key, value.toISOString(), index, depth)
      } else {
        const keys = Object.keys(value)
        if (keys.length) {
          addSize(2) // {}
          if (!sizeLimitReached && depth < maxDepth) {
            stack.push([key, '{', index, depth])
            keys.forEach((k, i) => {
              addSize(k.length + 3) // "":
              if (!sizeLimitReached) measureSize(value[k])
              if (!sizeLimitReached) stack.push([k, value[k], i, depth + 1])
            })
            stack.push([undefined, '}', undefined, depth])
          } else {
            render(key, '{}', index)
          }
        }
      }
    } else {
      render(key, value, index)

      if (index) addSize(1) // comma for indexes > 0
    }
  }

  return output
}

module.exports = smartSerialize
