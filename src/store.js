import EventEmitter from "eventemitter3";
import _isFunction from "lodash/isFunction";
import _isObject from "lodash/isObject";

import { eachKeyValue } from "./utils";

class Store extends EventEmitter {
  constructor(dispatcher) {
    super();

    this.dispatcher = dispatcher;
    this.__actions__ = {};
  }

  __handleAction__(action) {
    const handler = this.__actions__[action.type];

    if (!handler) {
      return false;
    }

    if (_isFunction(handler)) {
      handler.call(this, action.payload, action.type);
    } else if (handler && _isFunction(this[handler])) {
      this[handler].call(this, action.payload, action.type);
    } else {
      throw new Error(
        `The handler for action type ${action.type} is not a function`
      );
    }
    return true;
  }

  bindActions(...actions) {
    if (actions.length > 1 && actions.length % 2 !== 0) {
      throw new Error("bindActions must take an even number of arguments.");
    }

    const bindAction = (type, handler) => {
      if (!handler) {
        throw new Error(`The handler for action type ${type} is falsy`);
      }

      this.__actions__[type] = handler;
    };

    if (actions.length === 1 && _isObject(actions[0])) {
      const [actionsMap] = actions;

      eachKeyValue(actionsMap, (name, action) => {
        bindAction(name, action);
      });
    } else {
      for (let i = 0; i < actions.length; i += 2) {
        const type = actions[i];
        const handler = actions[i + 1];

        if (!type) {
          throw new Error(`Argument ${i + 1} to bindActions is a falsy value`);
        }

        bindAction(type, handler);
      }
    }
  }

  waitFor(stores, fn) {
    this.dispatcher.waitForStores(this, stores, fn.bind(this));
  }
}

export default Store;
