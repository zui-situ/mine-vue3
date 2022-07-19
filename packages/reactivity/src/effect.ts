export let activeEffect = undefined;
class ReactiveEffect {
  //这里表示在实例上新增了active属性
  public parent = null;
  public deps = [];
  public active = true;//这个effect默认是激活状态
  constructor(public fn) {// 用户传递的参数也会当this上， this.fn

  }
  run() { // run就是执行effect
    if(!this.active) this.fn() //这里表示如果是非激活，只需要执行函数，不需要进行依赖收集

    //这里就要依赖收集 核心就行将当前的effect和稍后渲染的属性关联在一起
    try {
      this.parent = activeEffect;
      activeEffect = this;
      return this.fn() //当稍后调用取值操作的时候 就可以获取到这个全局的activeEffect了 
    } finally {
      activeEffect = this.parent;
      this.parent = null;
    }
  }
}


export function effect(fn) {
  // 这里fn可以根据状态变化 重新执行， effect 可以嵌套着写
  const _effect = new ReactiveEffect(fn)
  _effect.run();
}

const targetMap = new WeakMap();
export function track(target,type,key) {
  // target -> key -> dep
  if(!activeEffect) return;
  let depsMap = targetMap.get(target); //第一次没有
  if(!depsMap) {
    targetMap.set(target,(depsMap = new Map()))
  }
  let dep = depsMap.get(key);
  if(!dep) {
    depsMap.set(key,(dep = new Set()))
  } 
  let shouldTrack = !dep.has(activeEffect)
  if(shouldTrack) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep); //  让effect记录住对应的dep，稍后清理的时候会用到
  }  
  //单向指的是属性记录了effect，方向记录，应该让effect也记录它被哪些属性收集过，这样做的好处是为了可以清理
  // 这个执行流程 就类似一个树形结构
  // 对象 某个属性 -》多个effect
  // weakMap = {对象:Map{name:set}}
  // { 对象:{name:[]} }
}


