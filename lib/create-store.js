import _isFunction from "lodash/isFunction";
import Store from "./store";
import inherits from "./util/inherits";

const RESERVED_KEYS = ["flux", "waitFor"];

function createStore(spec) {
  for (let i = 0; i < RESERVED_KEYS.length; i += 1) {
    const key = RESERVED_KEYS[i];

    if (spec[key]) {
      throw new Error(`Reserved key '${key}' found in store definition`);
    }
  }

  function constructor(options) {
    options = options || {};

    Store.call(this);

    Object.keys(spec).forEach(field => {
      if (field === "actions") {
        this.bindActions(spec[field]);
      } else if (field === "initialize") {
        // do nothing
      } else if (_isFunction(spec[field])) {
        this[field] = spec[field].bind(this);
      } else {
        this[field] = spec[field];
      }
    });

    if (spec.initialize) {
      spec.initialize.call(this, options);
    }
  }

  inherits(constructor, Store);

  return constructor;
}

export default createStore;
