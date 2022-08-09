import { isString, ShapeFlags } from "@vue/shared";
import { createVnode, isSameVnode, Text } from "./vnode";

export function createRenderer(renderOptions) {
  let {
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createElement: hostCreateElement,
    createText: hostCreateText,
    patchProp: hostPatchProp
  } = renderOptions;

  const normalize = (child) =>{
    if(isString(child)) {
      return createVnode(Text,null,child)
    }
    return child
  }

  const mountChildren = (children,container) => {
    for(let i = 0; i < children.length;i++) {
      let child = normalize(children[i]);

      patch(null,child,container)
    } 
  }


  const mountElement = (vnode, container)=> {
    let { type, props, children, shapeFlag } = vnode;
    let el = vnode.el = hostCreateElement(type); // 将真实元素挂载到这个虚拟节点上，后续用于复用阶段和更新

    if(props) {
      for(let key in props) {
        hostPatchProp(el,key,null,props[key]);
      }
    }
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) { // 文本
      hostSetElementText(el,children)
    } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children,el)
    }

    hostInsert(el,container)
  }

  const processText = (n1, n2, container) =>{
    if(n1 === null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
  
    } else {
      // 文本的内容变化了，可以复用老的节点
      const el = n2.el = n1.el;
      if(n1.children !== n2.children) {
        hostSetText(el,n2.children);
      }
    }
  }

  const processElement = (n1, n2, container) => {
    if(n1 === null) {
      mountElement(n2, container);
    } else {
      //元素比对
      // patchElement()
    }
  }

  const patch = (n1, n2, container) => {     // 核心的patch方法
    // n2 可能是一个文本
    if (n1 === n2) return;

    if(n1 && !isSameVnode(n1,n2)) { // 判断两个元素是否相同，不相同卸载再添加
      unmount(n1); // 删除老的
      n1 = null;
    }

    const {type,shapeFlag} = n2;

    switch(type) { 
      case Text:
        processText(n1, n2, container);
        break;
      
      default:
        if(shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container)
        }
    }

    // if (n1 == null) {
    //   //初次渲染
    //   // 后续还有组件的初次渲染，目前是元素的初始化渲染
    //   switch(type) {
    //     case Text:
    //       processText(n1, n2, container);
    //       break;
        
    //     default:
    //       if(shapeFlag & ShapeFlags.ELEMENT) {
    //         processElement(n1, n2, container)
    //       }
    //   }
    // } else {
    //   // 更新流程
    // }
  };


  const unmount = (vnode) =>{
    hostRemove(vnode.el)
  }


  const render = (vnode, container) => {
    // 渲染过程是用你传入的renderOptions来渲染

    if (vnode == null) {
      // 卸载逻辑
      if(container._vnode) { //之前确实渲染过了，那么就卸载掉
        unmount(container._vnode); // el 
      }
    } else {
      // 这里既有初始化逻辑，又有更新的逻辑
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };
  return {
    render,
  };
}

// 文本的处理，需要自己增加类型，因为不能通过document.createElement('文本')
// 我们如果传入null的时候在渲染时，则是卸载逻辑，需要将dom节点删掉

// 1) 更新的逻辑思考：
// - 如果前后完全没关系，删除老的 添加新的
// - 老的和新的一样，复用 。属性可能不一样，再比对属性，更新属性
// - 比儿子
