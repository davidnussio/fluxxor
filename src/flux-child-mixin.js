import PropTypes from "prop-types";

function FluxChildMixin() {
  return {
    componentWillMount() {
      if (console && console.warn) {
        const namePart = this.constructor.displayName
          ? ` in ${this.constructor.displayName}`
          : "";

        console.warn(
          `Fluxxor.FluxChildMixin was found is use ${namePart},` +
            "but has been deprecated. Use Fluxxor.FluxMixin instead."
        );
      }
    },

    contextTypes: {
      flux: PropTypes.object
    },

    getFlux() {
      return this.context.flux;
    }
  };
}

FluxChildMixin.componentWillMount = () => {
  throw new Error(
    "Fluxxor.FluxChildMixin is a function that takes React as a " +
      "parameter and returns the mixin, e.g.: mixins[Fluxxor.FluxChildMixin(React)]"
  );
};

export default FluxChildMixin;
