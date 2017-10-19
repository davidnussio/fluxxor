import PropTypes from "prop-types";

const FluxMixin = {
  componentWillMount() {
    if (!this.props.flux && (!this.context || !this.context.flux)) {
      const namePart = this.constructor.displayName
        ? ` of ${this.constructor.displayName}`
        : "";

      throw new Error(
        `Could not find flux on this.props or this.context${namePart}`
      );
    }
  },

  childContextTypes: {
    flux: PropTypes.object
  },

  contextTypes: {
    flux: PropTypes.object
  },

  getChildContext() {
    return {
      flux: this.getFlux()
    };
  },

  getFlux() {
    return this.props.flux || (this.context && this.context.flux);
  }
};

export default FluxMixin;
