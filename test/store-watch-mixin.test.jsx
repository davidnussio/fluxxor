import createClass from "create-react-class";
import React from "react";
import { findDOMNode, unmountComponentAtNode } from "react-dom";
import TestUtils from "react-dom/test-utils";

import { Flux, FluxMixin, StoreWatchMixin, createStore } from "../src";

describe("StoreWatchMixin", () => {
  it("watches for store change events until the component is unmounted", done => {
    const SwappedComponent = createClass({
      mixins: [FluxMixin, StoreWatchMixin("Store1")],

      getStateFromFlux() {
        return {
          store1state: this.getFlux()
            .store("Store1")
            .getState()
        };
      },

      render() {
        return (
          <div>
            <span key={1}>{String(this.state.store1state.value)}</span>
          </div>
        );
      }
    });
    const Wrapper = createClass({
      mixins: [FluxMixin, StoreWatchMixin("Store1", "Store2")],

      getStateFromFlux() {
        this.getStateCalls = this.getStateCalls || 0;
        this.getStateCalls += 1;

        return {
          store1state: this.getFlux()
            .store("Store1")
            .getState(),
          store2state: this.getFlux()
            .store("Store2")
            .getState()
        };
      },

      render() {
        if (this.state.store1state.value === 0) {
          return (
            <div>
              <SwappedComponent />
            </div>
          );
        }

        return (
          <div>
            <span key={1}>String(this.state.store1state.value)</span>
            <span key={2}>String(this.state.store2state.value)</span>
          </div>
        );
      }
    });
    const Store = createStore({
      actions: {
        ACTION: "handleAction"
      },

      initialize() {
        this.value = 0;
      },

      handleAction() {
        this.value += 1;

        this.emit("change");
      },

      getState() {
        return {
          value: this.value
        };
      }
    });
    const stores = {
      Store1: new Store(),
      Store2: new Store()
    };
    const actions = {
      act() {
        this.dispatch("ACTION", {});
      }
    };
    const flux = new Flux(stores, actions);
    const tree = TestUtils.renderIntoDocument(<Wrapper flux={flux} />);

    expect(tree.getStateCalls).toBe(1);
    expect(tree.state).toEqual({
      store1state: { value: 0 },
      store2state: { value: 0 }
    });

    flux.actions.act();

    expect(tree.getStateCalls).toBe(3);
    expect(tree.state).toEqual({
      store1state: { value: 1 },
      store2state: { value: 1 }
    });

    unmountComponentAtNode(findDOMNode(tree).parentNode);

    setTimeout(() => {
      flux.actions.act();

      expect(tree.getStateCalls).toBe(3);
      expect(tree.state).toEqual({
        store1state: { value: 1 },
        store2state: { value: 1 }
      });

      done();
    }, 0);
  });

  it("throws when attempting to mix in the function directly", () => {
    expect(() => {
      const MixedComponent = createClass({
        mixins: [StoreWatchMixin],

        render() {
          return <div />;
        }
      });

      (() => <MixedComponent />)();
    }).toThrow(/attempting to use a component class or function as a mixin/);
  });
});
