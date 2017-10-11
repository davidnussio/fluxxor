import _isFunction from "lodash/isFunction";
import Store from "./store";

const RESERVED_KEYS = ["flux", "waitFor"];

function createStore(spec) {
  for (let i = 0; i < RESERVED_KEYS.length; i += 1) {
    const key = RESERVED_KEYS[i];

    if (spec[key]) {
      throw new Error(`Reserved key '${key}' found in store definition`);
    }
  }

  class ConcreteStore extends Store {
    constructor(options = {}) {
      super();

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
  }

  return ConcreteStore;
}

export default createStore;
