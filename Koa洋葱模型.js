async function f1 (ctx, next) {
  console.log('f1 start ->');
  await next()
  console.log('f1 end <-');
}
async function f2 (ctx, next) {
  console.log('f2 start ->');
  await next()
  console.log('f2 end <-');
}
async function f3 (ctx, next) {
  console.log('f3 service...');
}

const ctx = {} 
const middlewares = [] // 定义一个中间件集合
const use = fn => middlewares.push(fn) // 定义use方法

use(f1)
use(f2)
use(f3)

// 第一步我们单个调用依次传参 但是同样存在问题 如果再添加f4的话 就要再定义 所以有下面的递归方式
// const next3 = () => middlewares[2](ctx)
// const next2 = () => middlewares[1](ctx, next3)
// const next1 = () => middlewares[0](ctx, next2)
// next1()

// f1 start -> 
// f2 start ->
// f3 service...
// f2 end <-
// f1 end <-

// 递归实现

function  compose (ctx, middlewares) {
  // 先进行 边界处理
  // 判断 middlewares 是否为数组
  if (!Array.isArray(middlewares)) throw new TypeError('Middlewares stack must be an array!')

  // 循环判断middlewares是以function为元素的数组
  for (const fn of middlewares) {
    if (typeof fn !== 'function') throw new TypeError('Middlewares must be composed of functions!')
  }
  
  // 递归
  return function () {
    const len = middlewares.length  // 获取数组的长度
    const dispatch = function (i) { // 实现的关键所在
      // 判断执行到哪个位置了 如果等于数组长度 那么执行完毕了
      if (len === i) { // 中间件执行完毕
        return Promise.resolve()
      } else {
        // 取出当前执行的函数fn
        const fn = middlewares[i]

        try {
          // 传入dispatch函数且i+1
          // 这里一定要bind下 不要立即执行
          // 在什么时候执行? 在当前fn函数里的await next()执行时,
          // 此时这个next也就是现在fn函数传入的 dispatch.bind(null, (i+1))
          return Promise.resolve(fn(ctx, dispatch.bind(null, (i+1))))
        } catch (err) {
          return Promise.reject(err)
        }
      }
    }
    return dispatch(0)
  }
}

const fn = compose(ctx, middlewares)
fn()
// f1 start -> 
// f2 start ->
// f3 service...
// f2 end <-
// f1 end <-