import { isObject } from "@vue/shared";
import { trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

function toReactive(value) {
  return isObject(value) ? reactive(value) : value
}



class RefImpl {
  public dep = new Set;
  public __v_isRef = true;
  public _value;
  constructor(public rawValue) {
    this._value = toReactive(rawValue)
  }
  get value() {
    trackEffects(this.dep)
    return this._value
  }
  set value(newValue) {
    if(newValue !== this.rawValue) {
      this._value = toReactive(newValue);
      this.rawValue = newValue;
      triggerEffects(this.dep)
    }
    
  }
}



export function ref(value) {
  return new RefImpl(value)
}