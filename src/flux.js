import EventEmitter from "eventemitter3";
import objectPath from "object-path";

import Dispatcher from "./dispatcher";
import { eachKeyValue, isFunction } from "./utils";

function findLeaves(obj, path, callback) {
  path = path || [];

  if (!obj) {
    return;
  }

  eachKeyValue(obj, (key, value) => {
    if (isFunction(value)) {
      callback(path.concat(key), value);
    } else {
      findLeaves(value, path.concat(key), callback);
    }
  });
}

class Flux extends EventEmitter {
  constructor(stores, actions) {
    super();

    this.dispatcher = new Dispatcher(stores);
    this.actions = {};
    this.stores = {};

    const flux = this;

    this.dispatchBinder = {
      flux,

      dispatch(type, payload) {
        try {
          flux.emit("dispatch", type, payload);
        } finally {
          flux.dispatcher.dispatch({ type, payload });
        }
      }
    };

    this.addActions(actions);
    this.addStores(stores);
  }

  addActions(actions) {
    findLeaves(actions, [], this.addAction.bind(this));
  }

  // addAction has two signatures:
  // 1: string[, string, string, string...], actionFunction
  // 2: arrayOfStrings, actionFunction
  addAction(...args) {
    if (args.length < 2) {
      throw new Error(
        "addAction requires at least two arguments, a string (or array of strings) and a function"
      );
    }

    if (!isFunction(args[args.length - 1])) {
      throw new Error("The last argument to addAction must be a function");
    }

    const func = args.pop().bind(this.dispatchBinder);

    if (typeof args[0] !== "string") {
      args = args[0]; // eslint-disable-line
    }

    const leadingPaths = args.reduce((acc, next) => {
      if (acc) {
        const nextPath = acc[acc.length - 1].concat([next]);

        return acc.concat([nextPath]);
      }

      return [[next]];
    }, null);

    // Detect trying to replace a function at any point in the path
    leadingPaths.forEach(path => {
      if (isFunction(objectPath.get(this.actions, path))) {
        throw new Error(`An action named ${args.join(".")} already exists`);
      }
    });

    // Detect trying to replace a namespace at the final point in the path
    if (objectPath.get(this.actions, args)) {
      throw new Error(`A namespace named ${args.join(".")} already exists`);
    }

    objectPath.set(this.actions, args, func, true);
  }

  store(name) {
    return this.stores[name];
  }

  getAllStores() {
    return this.stores;
  }

  addStore(name, store) {
    if (name in this.stores) {
      throw new Error(`A store names '${name}' already exists`);
    }

    store.flux = this;

    this.stores[name] = store;
    this.dispatcher.addStore(name, store);
  }

  addStores(stores) {
    if (!stores) {
      return;
    }

    eachKeyValue(stores, (name, store) => {
      this.addStore(name, store);
    });
  }

  setDispatchInterceptor(fn) {
    this.dispatcher.setDispatchInterceptor(fn);
  }
}

export default Flux;
