import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";

function traversal(value,set = new Set()) { //如果考虑对象中有循环引用的问题
  // 第一步递归要有终结条件，不是对象就不再递归
  if(!isObject(value)) return;
  if(set.has(value)) {
    return value
  }
  set.add(value);
  for(let key in value) {
    traversal(value[key],set);
  }
  return value
}

//用户传入的对象，cb就是对应的用户的回调
export function watch(source,cb) {
  let getter;
  if(isReactive(source)) {
    // 对我们用户传入的数据 进行循环（递归循环，只要循环就会访问对象上的每一个属性，访问属性的时候会收集effect）
    getter = () => traversal(source) 
  } else if(isFunction(source)) {
    getter = source
  } else {
    return
  }
  let cleanup;
  const onCleanup = (fn) => {
    cleanup = fn; //保存用户的函数
  }

  let oldValue;
  const job = () => {
    if(cleanup) cleanup(); //下一次watch开始触发上一次watch的清理函数
    const newValue = effect.run();
    cb(newValue,oldValue,onCleanup);
    oldValue = newValue
  }
  // 在effect中访问属性就会依赖收集
  const effect = new ReactiveEffect(getter,job); //监控自己构造的函数，变化后重新执行job
  oldValue = effect.run();
}

// watch = effcet 内部会保存老值和新值调用方法