import { isObject } from "@vue/shared";
import { track, trigger } from "./effect";
import { reactive } from "./reactive";

export const enum ReactiveFlgs {
  IS_REACTIVE = '_v_isReactive'
}
export const mutableHandlers = {
  get(target,key,receiver) {
    if(key === ReactiveFlgs.IS_REACTIVE) { 
      return true 
    }
    track(target,'get',key);
    //去代理对象上取值 就走get
    //这里可以监控到用户取值了
    let res = Reflect.get(target,key,receiver)

    if(isObject(res)) {
      return reactive(res) //深度代理实现，性能好，取值就可以进行代理
    }
    return res
  },
  set(target,key,value,receiver) {
    //去代理上设置值 就走set
    let oldValue = target[key]; 
    let result = Reflect.set(target,key,value,receiver)
    if(oldValue != value) { // 值变化了
      // 值更新
      trigger(target,'set',key,value,oldValue) 
    }
    //这里可以监控到用户赋值了
    return result
  }
}

// 对象 某个属性 ->多个effect
// WeakMap = {对象:Map:{name:Set}}
// map {对象:name:[]}