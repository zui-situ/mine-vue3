// h的用法 h('div')
// h('div',{style:{"color":"red"}})
// h('div',{style:{"color":"red"}},"hello")
// h('div',null,'hello')
// h('div',null,'hello','world')
// h('div',null,h('span'))

import { isArray, isObject } from "@vue/shared";
import { createVnode, isVnode } from "./vnode";

// h('div',null,[h('span')])
export function h(type,propsChildren,children) { // 其余的除了3个之外的肯定是孩子
    const l = arguments.length;
    // h('div',{style:{"color":"red"}})
    // h('div',h('span'))
    // h('div',[h('span'),h('span')])
    // h('div','hello')
    if(l === 2) { // 为什么要将儿子包装成数组，因为元素可以循环创建 
      if(isObject(propsChildren) && !isArray(propsChildren)) {
        if(isVnode(propsChildren)) { // 虚拟节点包装成数组 
          return createVnode(type,null,[propsChildren])
        }
        return createVnode(type,propsChildren); //属性
      } else {
        return createVnode(type,null,propsChildren); // 是数组
      }
    } else {
      if(l > 3) {
        children = Array.from(arguments).slice(2);
      } else if(l === 3 && isVnode(children)){
      // 等于3个
        children = [children]
      }
      // 其他
      return createVnode(type,propsChildren,children);  // children的情况有两种 文本/数组
    }
}