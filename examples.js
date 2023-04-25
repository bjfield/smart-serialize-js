/**
 * @file Contains examples, which may be commented and uncommented to experiment with various usages.
 */

const smartSerialize = require('./index')
const crypto = require('crypto')
const Benchmark = require('benchmark')
const { performance } = require('perf_hooks')
const util = require('util')

/**
 * Creates an object with a specified breadth (properties per object layer) and depth (levels of nesting).
 *
 * @param {number} breadth - The number of properties to add to each object layer.
 * @param {number} [depth=0] - The depth of nested objects to create.
 * @returns {Object} An object with the specified number of properties and depth.
 */
const createObject = (breadth, depth = 0) => {
  const obj = {}
  for (let i = 0; i < breadth; i++) {
    const key = crypto.randomUUID()

    if (depth > 1) {
      obj[key] = createObject(breadth, depth - 1)
    } else {
      obj[key] = crypto.randomUUID()
    }
  }
  return obj
}

// console.log()
// console.log('Visualize the way size and depth limits impact an object.')
// console.log('---------------------------------------------------------')

// const obj = ['0123456789', { a: 1, b: 2 }, { n: { n: { n: { n: { n: { n: { n: {} } } } } } } }, 12.345, { longLongLongKey: 0 }]
// const objLength = JSON.stringify(obj).length
// for (let i = 0; i <= objLength; i++) {
//   const serialized = smartSerialize(obj, 4, i)
//   console.log('limit', i, ':', serialized, serialized.length)
// }

// console.log()
// console.log('Compare with the performance of JSON.stringify.')
// console.log('-----------------------------------------------')

// console.time('create 69863851 byte object')
// const targetObject = createObject(7, 7) // 69863851 bytes when stringified
// console.timeEnd('create 69863851 byte object')

// const suite = new Benchmark.Suite('Compare JSON.stringify and smartSerialize')
// suite
//   .add('JSON.stringify whole object', () => JSON.stringify(targetObject))
//   .add('smartSerialize whole object', () => smartSerialize(targetObject))
//   .add('smartSerialize to depth of 3', () => smartSerialize(targetObject, 3))
//   .add('smartSerialize to size of 1024', () => smartSerialize(targetObject, Infinity, 1024))
//   .on('cycle', event => {
//     const benchmark = event.target
//     console.log(benchmark.toString())
//   })
//   .on('complete', event => {
//     const suite = event.currentTarget
//     const fastestOption = suite.filter('fastest').map('name')
//     console.log(`${fastestOption} is fastest`)
//   })
//   .run()

// console.log()
// console.log('Serialize unusual nodes.')
// console.log('------------------------')

// const oddNodes = []
// oddNodes.push(new Date())
// oddNodes.push(new Error('"hello"'))
// oddNodes.push(function () { return true }) // anonymous function
// oddNodes.push(function foo () { return true }) // named function
// oddNodes.push(/[a-z]+/gi)
// oddNodes.push(oddNodes) // circular reference
// oddNodes.push(`line1
// line2`) // multiline string
// // eslint-disable-next-line no-tabs
// oddNodes.push('	') // tab control character
// oddNodes.push('[') // does not interfere with enclosing brackets
// console.log(smartSerialize(oddNodes))
// console.log(JSON.parse(smartSerialize(oddNodes)))

// console.log()
// console.log('Simple example with a callback.')
// console.log('-------------------------------')

// console.log('started serializing')
// smartSerialize([1, 2, 3, 4, 5], Infinity, Infinity, (result) => {
//   console.log(result)
//   console.log('finished serializing')
// })
// console.log('continued execution')

// console.log()
// console.log('Callback example showing how to share the main thread at the sacrifice of speed.')
// console.log('--------------------------------------------------------------------------------')

// // Create a large object.
// console.time('create 175861129 byte object')
// const largeObject = createObject(6, 7) // 69863851 bytes when stringified
// console.timeEnd('create 175861129 byte object')

// // Test with and without a callback.
// const testRun = async (callback) => {
//   console.log(`Attempt ${callback ? 'with' : 'without'} callback:`)

//   // See how long it takes to serialize on your machine (without interval callbacks yet).
//   const start = performance.now()
//   smartSerialize(largeObject, Infinity, Infinity) // dummy just for timing evaluation
//   const end = performance.now()
//   const duration = (end - start) * 3

//   // Start interval.
//   let i = 10 // how many times to call the interval
//   const timeSlice = duration / i // how often to execute the interval callback
//   console.log(' (', i, 'interval functions executing every', timeSlice, 'ms over', duration, 'ms)')

//   await new Promise(resolve => {
//     const intervalId = setInterval(() => {
//       console.log('  - ', performance.now(), 'interval', 10 - i)
//       i--
//       if (i === 0) {
//         clearInterval(intervalId)
//         resolve()
//       }
//     }, timeSlice)

//     // Now serialize again while intervals are running.
//     const callTime = performance.now()
//     console.log('  - ', callTime, 'smartSerializer called')
//     smartSerialize(largeObject, Infinity, Infinity, callback) // now take a long time serializing
//     const returnTime = performance.now()
//     console.log('  - ', returnTime, 'smartSerializer returns after', returnTime - callTime, 'ms')
//   })
// }

// testRun().then(() => {
//   const secondStart = performance.now()
//   testRun((output) => {
//     const secondEnd = performance.now()
//     console.log('  - ', secondEnd, 'done serializing', output.length, 'bytes after', secondEnd - secondStart, 'ms')
//   })
// })
