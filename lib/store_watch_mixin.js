var _each = require("lodash/forEach");

var StoreWatchMixin = function() {
  var storeNames = Array.prototype.slice.call(arguments);
  return {
    componentDidMount: function() {
      var flux = this.props.flux || this.context.flux;
      this.mounted = true;

      // No autobinding in ES6 classes
      this._setStateFromFlux = function() {
        if (this.mounted) {
          this.setState(this.getStateFromFlux());
        }
      }.bind(this);

      var _this = this;

      _each(storeNames, function(store) {
        flux.store(store).on("change", _this._setStateFromFlux);
      });
    },

    componentWillUnmount: function() {
      var flux = this.props.flux || this.context.flux;
      this.mounted = false;

      var _this = this;

      _each(storeNames, function(store) {
        flux.store(store).removeListener("change", _this._setStateFromFlux);
      });
    },

    getInitialState: function() {
      return this.getStateFromFlux();
    }
  };
};

StoreWatchMixin.componentWillMount = function() {
  throw new Error(
    "Fluxxor.StoreWatchMixin is a function that takes one or more " +
      "store names as parameters and returns the mixin, e.g.: " +
      'mixins: [Fluxxor.StoreWatchMixin("Store1", "Store2")]'
  );
};

module.exports = StoreWatchMixin;
