function createInvoker(callback) {
  const invoker = (e) => invoker.value(e)
  invoker.value = callback
  return invoker
}

export function patchEvent(el,eventName,nextValue) {
  // 可以先移除掉事件，再重新绑定事件
  // remove -> add ===> add + 自定义事件（里面调用绑定的方法）
  let invokers = el._vei || (el.vei = {});
  let exits = invokers[eventName]; // 先看有没有缓存过

  if(exits && nextValue) { // 已经绑定过事件
    exits.value = nextValue; // 没有卸载函数 只是改了invoker.value 属性
  } else { 
    let event = eventName.slice(2).toLowerCase();

    if(nextValue) {
      const invoker = invokers[eventName] = createInvoker(nextValue);
      el.addEventListener(event,invoker)
    } else if(exits) { //如果有老值，需要讲老的绑定事件移除掉
      el.removeEventListener(event,exits);
      invokers[eventName] = undefined;
    }
  }




}