import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";

// dom属性的操作api
export function patchProp(el, key, prevValue, nextValue) {
  // el.setAttribute
  // 类名 el.className
  if (key === "class") {
    patchClass(el,nextValue);
    // el style{color:'red',fontSize:'12px'} {color:'blue',background:"red"}
  } else if (key === "style") {
    patchStyle(el,prevValue,nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    patchEvent(el,key,nextValue);
  } else { // 普通属性 el.setAttribute
    patchAttr(el,key,nextValue);
  }
  // 样式 el.style

  // events

  // 普通属性
}


