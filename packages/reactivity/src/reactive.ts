import { isObject } from "@vue/shared";
import { mutableHandlers, ReactiveFlgs } from "./baseHandler";

// 1)将数据转换成响应式的数据 
const reactiveMap = new WeakMap(); //key只能是对象


// 1）实现同一个对象代理多次，返回同一个代理
// 2）代理对象被再次代理 可以直接返回
export function reactive(target) {
  if(!isObject(target)) {
    return 
  }
  if(target[ReactiveFlgs.IS_REACTIVE]) { // 如果目标是一个代理对象，那么一定被代理过了，会走get
    return target
  }

  // 并没有重新定义熟悉，只是代理，在取值的时候会调用get,当赋值的时候会调用get

  let exisitingProxy = reactiveMap.get(target);
  if(exisitingProxy) {
    return exisitingProxy
  }

  // 第一次普通对象代理，我们会通过new Proxy 代理一次
  // 下次你传递的是proxy 我们可以看一下他有没有代理过，如果访问这个proxy 有get方法的时候就说明访问过了

  const proxy = new Proxy(target,mutableHandlers)
  reactiveMap.set(target,proxy)
  return proxy
}