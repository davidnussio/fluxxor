import _clone from "lodash/clone";

import {
  eachKeyValue,
  findKey,
  intersection,
  keys,
  mapValues,
  unique
} from "./utils";

function defaultDispatchInterceptor(action, dispatch) {
  dispatch(action);
}

class Dispatcher {
  constructor(stores) {
    this.stores = {};
    this.currentDispatch = null;
    this.currentActionType = null;
    this.waitingToDispatch = {};
    this.dispatchInterceptor = defaultDispatchInterceptor;
    this._boundDispatch = this._dispatch.bind(this);

    if (stores) {
      eachKeyValue(stores, (name, store) => {
        this.addStore(name, store);
      });
    }
  }

  addStore(name, store) {
    store.dispatcher = this; // eslint-disable-line

    this.stores[name] = store;
  }

  dispatch(action) {
    this.dispatchInterceptor(action, this._boundDispatch);
  }

  _dispatch(action) {
    if (!action || !action.type) {
      throw new Error("Can only dispatch actions with a 'type' property");
    }

    if (this.currentDispatch) {
      throw new Error(
        `Cannot dispatch an action ('${action.type}') while another action` +
          `('${this.currentActionType}') is being dispatched`
      );
    }

    this.waitingToDispatch = _clone(this.stores);

    this.currentActionType = action.type;
    this.currentDispatch = mapValues(this.stores, () => ({
      resolved: false,
      waitingOn: [],
      waitCallback: null
    }));

    try {
      this.doDispatchLoop(action);
    } finally {
      this.currentActionType = null;
      this.currentDispatch = null;
    }
  }

  doDispatchLoop(action) {
    const dispatchedThisLoop = [];
    const removeFromDispatchQueue = [];

    let dispatch;
    let canBeDispatchedTo;
    let wasHandled = false;

    eachKeyValue(this.waitingToDispatch, key => {
      dispatch = this.currentDispatch[key];
      canBeDispatchedTo =
        !dispatch.waitingOn.length ||
        !intersection(dispatch.waitingOn, keys(this.waitingToDispatch)).length;

      if (!canBeDispatchedTo) {
        return;
      }

      if (dispatch.waitCallback) {
        const stores = dispatch.waitingOn.map(store => this.stores[store]);

        const fn = dispatch.waitCallback;

        dispatch.waitCallback = null;
        dispatch.waitingOn = [];
        dispatch.resolved = true;

        fn(...stores);

        wasHandled = true;
      } else {
        dispatch.resolved = true;

        const handled = this.stores[key].__handleAction__(action);

        if (handled) {
          wasHandled = true;
        }
      }

      dispatchedThisLoop.push(key);

      if (this.currentDispatch[key].resolved) {
        removeFromDispatchQueue.push(key);
      }
    });

    if (keys(this.waitingToDispatch).length && !dispatchedThisLoop.length) {
      const storesWithCircularWaits = keys(this.waitingToDispatch).join(", ");

      throw new Error(
        `Indirect circular wait detected among: ${storesWithCircularWaits}`
      );
    }

    removeFromDispatchQueue.forEach(key => {
      delete this.waitingToDispatch[key];
    });

    if (keys(this.waitingToDispatch).length) {
      this.doDispatchLoop(action);
    }

    if (!wasHandled && console && console.warn) {
      console.warn(
        `An action of type ${action.type} was dispatched, but no store handled it`
      );
    }
  }

  waitForStores(store, stores, fn) {
    if (!this.currentDispatch) {
      throw new Error("Cannot wait unless an action is being dispatched");
    }

    const waitingStoreName = findKey(this.stores, val => val === store);

    if (stores.indexOf(waitingStoreName) > -1) {
      throw new Error("A store cannot wait on itself");
    }

    const dispatch = this.currentDispatch[waitingStoreName];

    if (dispatch.waitingOn.length) {
      throw new Error(`${waitingStoreName} already waiting on stores`);
    }

    stores.forEach(name => {
      const storeDispatch = this.currentDispatch[name];

      if (!this.stores[name]) {
        throw new Error(`Cannot wait for non-existing store ${name}`);
      }

      if (storeDispatch.waitingOn.indexOf(waitingStoreName) > -1) {
        throw new Error(
          `Circular wait detected between ${waitingStoreName} and ${name}`
        );
      }
    });

    dispatch.resolved = false;
    dispatch.waitingOn = unique(dispatch.waitingOn.concat(stores));
    dispatch.waitCallback = fn;
  }

  setDispatchInterceptor(fn) {
    this.dispatchInterceptor = fn || defaultDispatchInterceptor;
  }
}

export default Dispatcher;
