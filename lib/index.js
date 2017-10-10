var Dispatcher = require("./dispatcher"),
  Flux = require("./flux"),
  FluxMixin = require("./flux_mixin"),
  FluxChildMixin = require("./flux_child_mixin"),
  StoreWatchMixin = require("./store_watch_mixin"),
  createStore = require("./create_store");

var Fluxxor = {
  Dispatcher: Dispatcher,
  Flux: Flux,
  FluxMixin: FluxMixin,
  FluxChildMixin: FluxChildMixin,
  StoreWatchMixin: StoreWatchMixin,
  createStore: createStore,
  version: require("./version")
};

module.exports = Fluxxor;
