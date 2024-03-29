// type props children

import { isArray, isString, ShapeFlags } from "@vue/shared";

export const Text = Symbol('Text');

export function isVnode(value) {
  return !!(value && value.__v_isVnode);
}

export function isSameVnode(n1,n2) {
  return (n1.type === n2.type) && (n1.key === n2.key)
}



// 虚拟节点：组件的、元素的、文本的 h('h1')
export function createVnode(type, props, children = null) {
  // 组合方案 shapeFlag  我想知道一个元素中包含的是多个儿子还是一个儿子
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;

  // 虚拟dom就是一个对象，diff算法。真实dom的属性比较多
  const vnode = {
    type,
    props,
    children,
    el: null, // 虚拟节点上对应的真实节点，后续diff算法
    key: props?.["key"],
    __v_isVnode: true,
    shapeFlag,
  };

  if (children) {
    let type = 0;
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children);
      type = ShapeFlags.TEXT_CHILDREN;
    } 
    vnode.shapeFlag |= type;
  }
  return vnode;
}
