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

  const normalize = (children,i) =>{
    if(isString(children[i])) {
      let vnode = createVnode(Text,null,children[i]) // 处理后要进行替换，否则children中存放的依旧是字符串
      children[i] = vnode;
    }
    return children[i]
  }

  const mountChildren = (children,container) => {
    for(let i = 0; i < children.length;i++) {
      let child = normalize(children,i);

      patch(null,child,container)
    } 
  }


  const mountElement = (vnode, container, anchor)=> {
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

    hostInsert(el,container,anchor)
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

  const patchProps = (oldProps, newProps, el) => {
    for(let key in newProps) { // 新的里面有，直接用新的盖掉即可
      hostPatchProp(el,key,oldProps[key],newProps[key]);
    }

    for(let key in oldProps) { // 如果老的里面有新的没有，则是删除
      if(newProps[key] == null) {
        hostPatchProp(el,key,oldProps[key],undefined);
      }
    }
  }

  const unmountChildren = (children) => {
    for(let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  }

  const patchKeyedChildren = (c1,c2,el) => {  //比较两个儿子的差异

    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    // sync from start 
    while(i<=e1 && i<=e2) { // 有任何一方停止循环则直接跳出
      const n1 = c1[i];
      const n2 = c2[i];
      if(isSameVnode(n1,n2)) {
        patch(n1,n2,el);//这样做就是比较两个节点的属性和子节点
      } else {
        break;
      }
      i++;
    } 

    // sync from end
    while(i<=e1 && i<=e2) { // 有任何一方停止循环则直接跳出
      const n1 = c1[e1];
      const n2 = c2[e2];
      if(isSameVnode(n1,n2)) {
        patch(n1,n2,el);//这样做就是比较两个节点的属性和子节点
      } else {
        break;
      }
      e1--;
      e2--;
    }  
    // 尽可能减少比较内容
    // common sequence + mount
    // i 要比e1大说明有新增的
    // i和e2之间的是新增的部分 

    // 有一方全部比较完毕了，要么就删除，要么就添加
    if(i > e1) {
      if(i <= e2) {
        while(i <= e2) {
          const nextPos = e2 + 1;
          // 根据下一个人的索引来看参照物
          const anchor = nextPos < c2.length ?  c2[nextPos].el : null;
          patch(null,c2[i],el,anchor);//创建新节点，扔到容器中
          i++;
        }
      }
    } else if(i > e2) {
      if(i <= e1) {
        while(i<=e1) {
          unmount(c1[i])
          i++;
        }
      }
    }
    // common sequence + unmount
    // i比e2大说明有要卸载的
    // 1到e1之间的就是要卸载的
    console.log(i,e1,e2); 
    //优化完毕~~~~~~~~~~~~~~~~~~~~
    //乱序比对
    let s1 = i;
    let s2 = i;
    const keyToNewIndexMap = new Map();
    for(let i = s2;i<=e2;i++) {
      keyToNewIndexMap.set(c2[i].key,i);
    }
    console.log(keyToNewIndexMap)
    // 循环老的元素 看一下新的里面有没有，如果有说明要比较差异，没有要添加到列表中，老的有新的没有要删除
    const toBePatched = e2 - s2 + 1;//新的总和数
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0);// 一个记录是否比对过的映射表
    for(let i = s1;i<=e1;i++) {
      const oldChild = c1[i]; // 老的孩子
      let newIndex = keyToNewIndexMap.get(oldChild.key);// 用老的孩子去新的里面找
      if(newIndex == undefined) {
        unmount(oldChild); // 多余的删掉
      } else {
        // 新的位置对应老的位置。如果数组里放的值>0 说明已经patch过了
        newIndexToOldIndexMap[newIndex - s2] = i+1;// 用来标记当前所patch过的结果
        patch(oldChild,c2[newIndex],el);
      }
    } // 只是新老属性和儿子的比对，没有移动位置

    // 需要移动的位置
    for(let i = toBePatched -1; i >=0; i--) {
      let index = i + s2;
      let current = c2[index];// 找到h
      let anchor = index + 1 < c2.length ? c2[index+1].el :null;
      if(newIndexToOldIndexMap[i] === 0) {//元素是创建的
        patch(null,current,el,anchor);
      } else {// 不是0，说明是已经比对过属性和儿子的了
        hostInsert(current.el,el,anchor); // 目前无论如何都做了一遍倒叙插入，其实可以不用的，可以根据刚才的数据来减少次数
      }
      // 这里发现缺失逻辑 需要看一下current有没有el,如果没有el说明是新增的逻辑

      //最长递增子序列来实现 vue2在移动元素时候的时候会有浪费 优化
    }
  } 


  const patchChildren = (n1, n2, el) => {
    // 比较两个虚拟节点的儿子的差异，el就是当前的父节点
    const c1 = n1 && n1.children;
    const c2 = n2 && n2.children;

    const prevShapeFlag = n1.shapeFlag; // 之前的
    const shapeFlag = n2.shapeFlag;// 之后的

    // 文本 空的null 数组
    
    // 比较两个儿子列表的差异
    // 新的 老的
    // 文本 数组 （删除老儿子，设置文本内容）
    // 文本 文本 （更新文本即可）

    // 数组 数组 （diff算法）
    // 数组 文本 （清空文本，进行挂载）
    // 空   数组 （删除所有儿子）
    // 空   文本 （清空文本）

    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 删除所有子节点
        unmountChildren(c1) // 文本 数组 （删除老儿子，设置文本内容）
      }
      if(c1 !== c2) { // 文本 文本 （更新文本即可）
        hostSetElementText(el,c2);
      }
    } else {
      // 现在为数组或者为空 
      
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 数组 数组 （diff算法）
          // diff算法
          patchKeyedChildren(c1,c2,el);  //全量对比
        } else {
          // 现在不是数组（文本和空 删除以前的）
          unmountChildren(c1) // 空   数组 （删除所有儿子）
        }
      } else {
        if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) { 
          hostSetElementText(el,''); // 数组 文本 （清空文本，进行挂载）
        } // 空   文本 （清空文本）
        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) { 
          mountChildren(c2,el);  // 数组 文本 （清空文本，进行挂载）
        }
      }
    }

  }

  const patchElement = (n1, n2, container) => { // 先复用节点、再比较属性、再比较儿子
     let el = n2.el = n1.el;
     let oldProps = n1.props || {}; // 对象
     let newProps = n2.props || {}; // 对象

     patchProps(oldProps,newProps,el);

     patchChildren(n1,n2, el);

  }


  const processElement = (n1, n2, container, anchor) => {
    if(n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      //元素比对
      patchElement(n1, n2, container);
    }
  }

  const patch = (n1, n2, container, anchor = null) => {     // 核心的patch方法
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
          processElement(n1, n2, container, anchor)
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
