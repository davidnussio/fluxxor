import createClass from "create-react-class";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  findRenderedComponentWithType,
  renderIntoDocument
} from "react-dom/test-utils";

import Fluxxor from "../src";

describe("FluxMixin", () => {
  let warn;

  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockReset();
    warn.mockRestore();
  });

  it("passes flux via getFlux() to descendants who ask for it", () => {
    const GreatGrandchild = createClass({
      displayName: "GreatGrandchild",

      mixins: [Fluxxor.FluxMixin],

      render() {
        return <div />;
      }
    });
    const Grandchild = createClass({
      displayName: "Grandchild",

      mixins: [Fluxxor.FluxMixin],

      render() {
        return <GreatGrandchild />;
      }
    });
    const Child = createClass({
      displayName: "Child",

      render() {
        return <Grandchild />;
      }
    });
    const Parent = createClass({
      displayName: "Parent",

      mixins: [Fluxxor.FluxMixin],

      render() {
        return <Child />;
      }
    });
    const flux = new Fluxxor.Flux({}, {});
    const tree = renderIntoDocument(<Parent flux={flux} />);

    expect(tree.getFlux()).toBe(flux);

    const child = findRenderedComponentWithType(tree, Child);
    expect(child.getFlux).toBeUndefined();

    const grandchild = findRenderedComponentWithType(tree, Grandchild);
    expect(grandchild.getFlux()).toBe(flux);

    const greatGrandchild = findRenderedComponentWithType(
      tree,
      GreatGrandchild
    );
    expect(greatGrandchild.getFlux()).toBe(flux);
  });

  it("throws when it can't find flux on the props or context", () => {
    const Component = createClass({
      displayName: "MyComponent",

      mixins: [Fluxxor.FluxMixin],

      render() {
        return React.DOM.div();
      }
    });

    expect(() => {
      renderToString(<Component />);
    }).toThrow(/Could not find flux.*MyComponent/);
  });
});
