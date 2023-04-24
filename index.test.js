const smartSerialize = require('./index')

describe('smartSerialize', () => {
  test('wraps a string in quotes', () => {
    const str = smartSerialize('a')
    expect(str).toBe('"a"')
  })

  it('serializes a simple object', () => {
    const obj = { foo: 1, bar: 'baz' }
    const result = smartSerialize(obj)
    expect(result).toEqual('{"foo":1,"bar":"baz"}')
  })

  test('serializes an object with a nested object value', () => {
    const obj = { foo: { bar: 'baz' } }
    expect(smartSerialize(obj)).toBe('{"foo":{"bar":"baz"}}')
  })

  test('serializes an object with a nested array value', () => {
    const obj = { foo: ['bar', 'baz'] }
    expect(smartSerialize(obj)).toBe('{"foo":["bar","baz"]}')
  })

  it('serializes arrays', () => {
    const obj = { foo: [1, 2, 3], bar: ['a', 'b', 'c'] }
    const result = smartSerialize(obj)
    expect(result).toEqual('{"foo":[1,2,3],"bar":["a","b","c"]}')
  })

  it('respects maxDepth limit', () => {
    const obj = { foo: { bar: { baz: 'qux' } } }
    const result = smartSerialize(obj, 2)
    expect(result).toEqual('{"foo":{"bar":{}}}')
  })

  it('respects maxSize limit', () => {
    const obj = { foo: 'a'.repeat(1000) }
    const result = smartSerialize(obj, Infinity, 100)
    expect(result).toEqual('{}')
  })

  it('serializes a Date object', () => {
    const obj = { date: new Date('2022-01-01T00:00:00.000Z') }
    const result = smartSerialize(obj)
    expect(result).toEqual('{"date":"2022-01-01T00:00:00.000Z"}')
  })

  test('serializes object with both maxDepth and maxSize', () => {
    const input = ['0123456789', { a: 1, b: 2 }, { n: { n: { n: { n: { n: { n: { n: {} } } } } } } }, 12.345, { longLongLongKey: 0 }]
    const expectedOutputLength = 67
    const maxSize = 70
    const maxDepth = 4

    const output = smartSerialize(input, maxDepth, maxSize)
    expect(output).toHaveLength(expectedOutputLength)
  })

  test('serializes an object with a number value', () => {
    const obj = { foo: 42 }
    expect(smartSerialize(obj)).toBe('{"foo":42}')
  })

  test('serializes an object with a boolean value', () => {
    const obj = { foo: true }
    expect(smartSerialize(obj)).toBe('{"foo":true}')
  })

  test('serializes an object with a null value', () => {
    const obj = { foo: null }
    expect(smartSerialize(obj)).toBe('{"foo":null}')
  })

  test('serializes an object with an Error value', () => {
    const obj = { foo: new Error('error message') }
    expect(smartSerialize(obj)).toBe('{"foo":"Error: error message"}')
  })

  test('serializes an object with a RegExp value', () => {
    const obj = { foo: /hello/i }
    expect(smartSerialize(obj)).toBe('{"foo":"/hello/i"}')
  })

  test('should handle circular references in objects', () => {
    const obj = { foo: {} }
    obj.foo.bar = obj
    expect(smartSerialize(obj)).toBe('{"foo":{"bar":"[circular reference]"}}')
  })

  test('properly escapes special characters', () => {
    const input = {
      tab: '\t',
      lineFeed: '\n',
      doubleQuote: '"',
      singleQuote: "'",
      backslash: '\\'
    }
    const expectedOutput = '{"tab":"\\t","lineFeed":"\\n","doubleQuote":"\\"","singleQuote":"\'","backslash":"\\\\"}'
    expect(smartSerialize(input)).toEqual(expectedOutput)
  })
})
