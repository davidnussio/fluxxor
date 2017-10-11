import Fluxxor from "../src";

describe("Store", () => {
  it("passes one object from constructor to initialize", done => {
    const Store = Fluxxor.createStore({
      initialize(opt, nothing) {
        expect(opt).toBe(42);
        expect(nothing).toBeUndefined();
        done();
      }
    });

    (() => new Store(42, 100))();
  });

  it("copies properties from the spec", () => {
    const Store = Fluxxor.createStore({
      answer: { is: 42 }
    });

    const store = new Store();

    expect(store.answer).toEqual({ is: 42 });
  });

  it("disallows reserved property names", () => {
    expect(() => {
      Fluxxor.createStore({
        flux: true
      });
    }).toThrow(/reserved.*flux/i);

    expect(() => {
      Fluxxor.createStore({
        waitFor: true
      });
    }).toThrow(/reserved.*waitFor/i);
  });

  it("allows registering actions via an actions hash", () => {
    const Store = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      },

      handleAction() {}
    });
    const store = new Store();
    const payload = { val: 42 };

    store.handleAction = jest.fn();
    store.__handleAction__({ type: "ACTION", payload });

    expect(store.handleAction).toHaveBeenCalledWith(payload, "ACTION");
  });

  it("throws when binding to a falsy action type", () => {
    const Store = Fluxxor.createStore({
      initialize() {
        this.bindActions("TYPE_ONE", "handleOne", null, "handleTwo");
      }
    });

    expect(() => new Store()).toThrow(/Argument 3.*bindActions.*falsy/);
  });

  it("throws when using a non-function action handler", () => {
    const Store = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      }
    });
    const store = new Store();

    expect(() => {
      store.__handleAction__({ type: "ACTION" });
    }).toThrow(/handler.*type ACTION.*not.*function/);

    expect(() => {
      store.__handleAction__({ type: "ACTION2" });
    }).not.toThrow();
  });

  it("throws when binding an action type to a falsy handler", () => {
    const Store = Fluxxor.createStore({
      actions: {
        ACTION: null
      },

      handleAction() {}
    });

    expect(() => new Store()).toThrow(/handler.*type ACTION.*falsy/);
  });

  describe("#bindActions", () => {
    it("allows registering actions via an argument list", () => {
      const Store = Fluxxor.createStore({
        actions: {
          ACTION: "handleAction"
        },

        initialize() {
          this.bindActions(
            "ACTION2",
            "handleAction2",
            "ACTION3",
            this.handleAction3
          );
        },

        handleAction() {},

        handleAction2() {},

        handleAction3() {
          this.value = 42;
        }
      });
      const store = new Store();
      const payload = { val: 42 };

      store.handleAction = jest.fn();
      store.handleAction2 = jest.fn();

      store.__handleAction__({ type: "ACTION", payload });
      expect(store.handleAction).toHaveBeenCalledWith(payload, "ACTION");

      store.__handleAction__({ type: "ACTION2", payload });
      expect(store.handleAction2).toHaveBeenCalledWith(payload, "ACTION2");

      store.__handleAction__({ type: "ACTION3", payload });
      expect(store.value).toBe(42);
    });

    it("allows registering actions via a hash", () => {
      const Store = Fluxxor.createStore({
        actions: {
          ACTION: "handleAction"
        },

        initialize() {
          this.bindActions({
            ACTION2: "handleAction2",
            ACTION3: this.handleAction3
          });
        },

        handleAction() {},

        handleAction2() {},

        handleAction3() {
          this.value = 42;
        }
      });
      const store = new Store();
      const payload = { val: 42 };

      store.handleAction = jest.fn();
      store.handleAction2 = jest.fn();

      store.__handleAction__({ type: "ACTION", payload });
      expect(store.handleAction).toHaveBeenCalledWith(payload, "ACTION");

      store.__handleAction__({ type: "ACTION2", payload });
      expect(store.handleAction2).toHaveBeenCalledWith(payload, "ACTION2");

      store.__handleAction__({ type: "ACTION3", payload });
      expect(store.value).toBe(42);
    });
  });
});
