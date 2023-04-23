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

  it('serializes a nested object', () => {
    const obj = { foo: { bar: { baz: 'qux' } } }
    const result = smartSerialize(obj)
    expect(result).toEqual('{"foo":{"bar":{"baz":"qux"}}}')
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

  it('serializes a date object', () => {
    const obj = { date: new Date('2022-01-01T00:00:00.000Z') }
    const result = smartSerialize(obj)
    expect(result).toEqual('{"date":"2022-01-01T00:00:00.000Z"}')
  })
})
test('serializes object with both maxDepth and maxSize', () => {
  const input = ['0123456789', { a: 1, b: 2 }, { n: { n: { n: { n: { n: { n: { n: {} } } } } } } }, 12.345, { longLongLongKey: 0 }]
  const expectedOutputLength = 67
  const maxSize = 70
  const maxDepth = 4

  const output = smartSerialize(input, maxDepth, maxSize)
  expect(output).toHaveLength(expectedOutputLength)
})
