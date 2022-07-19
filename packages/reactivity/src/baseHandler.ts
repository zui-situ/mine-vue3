import { track } from "./effect";

export const enum ReactiveFlgs {
  IS_REACTIVE = '_v_isReactive'
}
export const mutableHandlers = {
  get(target,key,receiver) {
    if(key === ReactiveFlgs.IS_REACTIVE) { 
      return true 
    }
    console.log(receiver)
    track(target,'get',key);
    //去代理对象上取值 就走get
    //这里可以监控到用户取值了
    return Reflect.get(target,key,receiver)
  },
  set(target,key,value,receiver) {
    //去代理上设置值 就走set
    //这里可以监控到用户赋值了
    return Reflect.set(target,key,value,receiver)
  }
}

// 对象 某个属性 ->多个effect
// WeakMap = {对象:Map:{name:Set}}
// map {对象:name:[]}