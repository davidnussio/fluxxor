import _clone from "lodash/clone";
import _mapValues from "lodash/mapValues";
import _forOwn from "lodash/forOwn";
import _intersection from "lodash/intersection";
import _keys from "lodash/keys";
import _map from "lodash/map";
import _each from "lodash/forEach";
import _size from "lodash/size";
import _findKey from "lodash/findKey";
import _uniq from "lodash/uniq";

function defaultDispatchInterceptor(action, dispatch) {
  dispatch(action);
}

function Dispatcher(stores) {
  this.stores = {};
  this.currentDispatch = null;
  this.currentActionType = null;
  this.waitingToDispatch = [];
  this.dispatchInterceptor = defaultDispatchInterceptor;
  this._boundDispatch = this._dispatch.bind(this);

  if (stores) {
    Object.keys(stores).forEach(storeName => {
      this.addStore(storeName, stores[storeName]);
    });
  }
}

Dispatcher.prototype.addStore = function addStore(name, store) {
  store.dispatcher = this; // eslint-disable-line

  this.stores[name] = store;
};

Dispatcher.prototype.dispatch = function dispatch(action) {
  this.dispatchInterceptor(action, this._boundDispatch);
};

Dispatcher.prototype._dispatch = function _dispatch(action) {
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
  this.currentDispatch = _mapValues(this.stores, () => ({
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
};

Dispatcher.prototype.doDispatchLoop = function doDispatchLoop(action) {
  const dispatchedThisLoop = [];
  const removeFromDispatchQueue = [];

  let dispatch;
  let canBeDispatchedTo;
  let wasHandled = false;

  _forOwn(this.waitingToDispatch, (value, key) => {
    dispatch = this.currentDispatch[key];
    canBeDispatchedTo =
      !dispatch.waitingOn.length ||
      !_intersection(dispatch.waitingOn, _keys(this.waitingToDispatch)).length;

    if (canBeDispatchedTo) {
      if (dispatch.waitCallback) {
        const stores = _map(dispatch.waitingOn, store => this.stores[store]);

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
    }
  });

  if (_keys(this.waitingToDispatch).length && !dispatchedThisLoop.length) {
    const storesWithCircularWaits = _keys(this.waitingToDispatch).join(", ");

    throw new Error(
      `Indirect circular wait detected among: ${storesWithCircularWaits}`
    );
  }

  _each(removeFromDispatchQueue, key => {
    delete this.waitingToDispatch[key];
  });

  if (_size(this.waitingToDispatch)) {
    this.doDispatchLoop(action);
  }

  if (!wasHandled && console && console.warn) {
    console.warn(
      `An action of type ${action.type} was dispatched, but no store handled it`
    );
  }
};

Dispatcher.prototype.waitForStores = function waitForStores(store, stores, fn) {
  if (!this.currentDispatch) {
    throw new Error("Cannot wait unless an action is being dispatched");
  }

  const waitingStoreName = _findKey(this.stores, val => val === store);

  if (stores.indexOf(waitingStoreName) > -1) {
    throw new Error("A store cannot wait on itself");
  }

  const dispatch = this.currentDispatch[waitingStoreName];

  if (dispatch.waitingOn.length) {
    throw new Error(`${waitingStoreName} already waiting on stores`);
  }

  _each(stores, storeName => {
    const storeDispatch = this.currentDispatch[storeName];

    if (!this.stores[storeName]) {
      throw new Error(`Cannot wait for non-existing store ${storeName}`);
    }

    if (storeDispatch.waitingOn.indexOf(waitingStoreName) > -1) {
      throw new Error(
        `Circular wait detected between ${waitingStoreName} and ${storeName}`
      );
    }
  });

  dispatch.resolved = false;
  dispatch.waitingOn = _uniq(dispatch.waitingOn.concat(stores));
  dispatch.waitCallback = fn;
};

Dispatcher.prototype.setDispatchInterceptor = function setDispatchInterceptor(
  fn
) {
  this.dispatchInterceptor = fn || defaultDispatchInterceptor;
};

export default Dispatcher;
