import createClass from "create-react-class";
import React from "react";
import { unstable_batchedUpdates as batchedUpdates } from "react-dom";
import { renderIntoDocument } from "react-dom/test-utils";

import { Flux, FluxMixin, StoreWatchMixin, createStore } from "../src";

const Store = createStore({
  actions: {
    ACTIVATE: "handleActivate",
    LOAD_INITIAL_VALUE: "handleLoadInitialValue"
  },

  initialize() {
    this.activated = false;
    this.value = null;
  },

  handleActivate() {
    this.activated = true;
    this.emit("change");
  },

  handleLoadInitialValue() {
    this.value = "testing";
    this.emit("change");
  }
});

const actions = {
  activate(callback) {
    setTimeout(() => {
      try {
        this.dispatch("ACTIVATE");

        callback();
      } catch (ex) {
        callback(ex);
      }
    });
  },

  loadInitialValue() {
    this.dispatch("LOAD_INITIAL_VALUE");
  }
};

describe("Dispatch interceptor", () => {
  let flux;
  let Application;
  let ComponentA;
  let ComponentB;

  beforeEach(() => {
    flux = new Flux({ store: new Store() }, actions);

    Application = createClass({
      displayName: "Application",

      mixins: [FluxMixin, StoreWatchMixin("store")],

      getStateFromFlux() {
        return {
          activated: this.getFlux().store("store").activated
        };
      },

      render() {
        return (
          <div>{this.state.activated ? <ComponentB /> : <ComponentA />}</div>
        );
      }
    });

    ComponentA = createClass({
      displayName: "ComponentA",

      mixins: [FluxMixin],

      render() {
        return <div />;
      }
    });

    ComponentB = createClass({
      displayName: "ComponentB",

      mixins: [FluxMixin, StoreWatchMixin("store")],

      getStateFromFlux() {
        return {
          value: this.getFlux().store("store").value
        };
      },

      componentWillMount() {
        this.getFlux().actions.loadInitialValue();
      },

      render() {
        return <div />;
      }
    });
  });

  it("doesn't intercept by default", done => {
    renderIntoDocument(<Application flux={flux} />);

    flux.actions.activate(error => {
      expect(error.message).toMatch(/dispatch.*another action/);

      done();
    });
  });

 it("allows intercepting", done => {
    flux.setDispatchInterceptor((action, dispatch) => {
      batchedUpdates(() => {
        dispatch(action);
      });
    });

    renderIntoDocument(<Application flux={flux} />);

    flux.actions.activate(err => {
      expect(err).toBeUndefined();

      done();
    });
  });

  it("allows nested interceptors", done => {
    let dispatches = 0;

    flux.setDispatchInterceptor((action, dispatch) => {
      dispatches += 1;

      batchedUpdates(() => {
        dispatch(action);
      });
    });

    renderIntoDocument(<Application flux={flux} />);

    flux.actions.activate(err => {
      expect(err).toBeUndefined();
      expect(dispatches).toBe(2);

      done();
    });
  });

  it("allows completely custom interceptors", done => {
    let dispatches = 0;

    flux.setDispatchInterceptor(() => {
      dispatches += 1;
    });

    renderIntoDocument(<Application flux={flux} />);

    flux.actions.activate(err => {
      expect(err).toBeUndefined();
      expect(dispatches).toBe(1);

      done();
    });
  });
});
