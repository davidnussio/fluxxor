import Fluxxor from "../src";

describe("Dispatcher", () => {
  let store1;
  let store2;
  let dispatcher;

  beforeEach(() => {
    const handleActionStub = jest.fn().mockImplementation(() => true);

    store1 = { __handleAction__: handleActionStub };
    store2 = { __handleAction__: jest.fn() };
    dispatcher = new Fluxxor.Dispatcher({ Store1: store1, Store2: store2 });
  });

  it("dispatches actions to every store", () => {
    const action = { type: "ACTION", payload: { val: 123 } };

    dispatcher.dispatch(action);

    expect(store1.__handleAction__).toHaveBeenCalledWith(action);
    expect(store2.__handleAction__).toHaveBeenCalledWith(action);
  });

  it("does not allow cascading dispatches", done => {
    store1.__handleAction__ = () => {
      expect(() => {
        dispatcher.dispatch({ type: "action2" });
      }).toThrow(/action2.*another action.*action1/);

      done();

      return true;
    };

    dispatcher.dispatch({ type: "action1" });
  });

  it("allows back-to-back dispatches on the same tick", () => {
    dispatcher.dispatch({ type: "action" });

    expect(() => {
      dispatcher.dispatch({ type: "action" });
    }).not.toThrow();
  });

  it("gracefully handles exceptions in the action handlers", () => {
    let thrw = true;

    store1.__handleAction__ = () => {
      if (thrw) {
        throw new Error("omg");
      }

      return true;
    };

    expect(() => {
      dispatcher.dispatch({ type: "action" });
    }).toThrow("omg");

    expect(() => {
      thrw = false;

      dispatcher.dispatch({ type: "action" });
    }).not.toThrow();
  });

  it("throws when asked to dispatch an action with to 'type' property", () => {
    expect(() => {
      dispatcher.dispatch();
    }).toThrow(/dispatch.*type/);

    expect(() => {
      dispatcher.dispatch(false);
    }).toThrow(/dispatch.*type/);

    expect(() => {
      dispatcher.dispatch("");
    }).toThrow(/dispatch.*type/);

    expect(() => {
      dispatcher.dispatch(null);
    }).toThrow(/dispatch.*type/);

    expect(() => {
      dispatcher.dispatch({});
    }).toThrow(/dispatch.*type/);
  });

  it("allows stores to wait on other stores", () => {
    let callCount = 0;

    const Store1 = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      },

      handleAction() {
        this.waitFor(["Store2"], () => {
          callCount += 1;

          this.value = callCount;
        });
      }
    });
    const Store2 = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      },

      handleAction() {
        callCount += 1;

        this.value = callCount;
      }
    });

    store1 = new Store1();
    store2 = new Store2();
    dispatcher = new Fluxxor.Dispatcher({ Store1: store1, Store2: store2 });

    dispatcher.dispatch({ type: "ACTION" });

    expect(store1.value).toBe(2);
    expect(store2.value).toBe(1);
  });

  it("does not allow stores to wait unless an action is being dispatched", () => {
    expect(() => {
      dispatcher.waitForStores();
    }).toThrow(/unless.*action.*dispatch/);
  });

  it("does not allow a store to wait on itself", () => {
    const Store = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      },

      handleAction() {
        this.waitFor(["Store"], () => {});
      }
    });
    const store = new Store();

    dispatcher = new Fluxxor.Dispatcher({ Store: store });

    expect(() => {
      dispatcher.dispatch({ type: "ACTION" });
    }).toThrow(/wait.*itself/);
  });

  it("does not allow a store to wait more than once in the same loop", () => {
    const Store1 = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      },

      handleAction() {
        this.waitFor(["Store2"], jest.fn());
        this.waitFor(["Store2"], jest.fn());
      }
    });
    const Store2 = Fluxxor.createStore({});

    store1 = new Store1();
    store2 = new Store2();
    dispatcher = new Fluxxor.Dispatcher({ Store1: store1, Store2: store2 });

    expect(() => {
      dispatcher.dispatch({ type: "ACTION" });
    }).toThrow(/already.*waiting/);
  });

  it("allows a store to wait on a store more than once in different loops", () => {
    const Store1 = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      },

      handleAction() {
        this.waitFor(["Store2"], () => {
          this.waitFor(["Store2"], store => {
            this.value = store.value;
          });
        });
      }
    });
    const Store2 = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      },

      handleAction() {
        this.value = 42;
      }
    });

    store1 = new Store1();
    store2 = new Store2();
    dispatcher = new Fluxxor.Dispatcher({ Store1: store1, Store2: store2 });
    dispatcher.dispatch({ type: "ACTION" });

    expect(store1.value).toBe(42);
  });

  it("does not allow waiting on non-existant stores", () => {
    const Store = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      },

      handleAction() {
        this.waitFor(["StoreFake"], jest.fn());
      }
    });
    const store = new Store();

    dispatcher = new Fluxxor.Dispatcher({ Store: store });

    expect(() => {
      dispatcher.dispatch({ type: "ACTION" });
    }).toThrow(/wait.*StoreFake/);
  });

  it("detects direct circular dependencies between stores", () => {
    const Store1 = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      },

      handleAction() {
        this.waitFor(["Store2"], jest.fn());
      }
    });
    const Store2 = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      },

      handleAction() {
        this.waitFor(["Store1"], jest.fn());
      }
    });

    store1 = new Store1();
    store2 = new Store2();
    dispatcher = new Fluxxor.Dispatcher({ Store1: store1, Store2: store2 });

    expect(() => {
      dispatcher.dispatch({ type: "ACTION" });
    }).toThrow(/circular.*Store2.*Store1/i);
  });

  it("detects indirect circular dependencies between stores", () => {
    const Store1 = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      },

      handleAction() {
        this.waitFor(["Store2"], jest.fn());
      }
    });
    const Store2 = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      },

      handleAction() {
        this.waitFor(["Store3"], jest.fn());
      }
    });
    const Store3 = Fluxxor.createStore({
      actions: {
        ACTION: "handleAction"
      },

      handleAction() {
        this.waitFor(["Store1"], jest.fn());
      }
    });
    const store3 = new Store3();

    store1 = new Store1();
    store2 = new Store2();

    dispatcher = new Fluxxor.Dispatcher({
      Store1: store1,
      Store2: store2,
      Store3: store3
    });

    expect(() => {
      dispatcher.dispatch({ type: "ACTION" });
    }).toThrow(/circular.*Store1.*Store2.*Store3/i);
  });

  describe("unhandled dispatch warnings", () => {
    let warnSpy;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockReset();
      warnSpy.mockRestore();
    });

    it("warns if a dispatched action is not handled by any store", () => {
      const Store1 = Fluxxor.createStore({});
      const Store2 = Fluxxor.createStore({});

      store1 = new Store1();
      store2 = new Store2();
      dispatcher = new Fluxxor.Dispatcher({ Store1: store1, Store2: store2 });
      dispatcher.dispatch({ type: "ACTION_TYPE" });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/ACTION_TYPE.*no store/);
    });

    it("doesn't warn if a dispatched action is handled by any store", () => {
      const Store1 = Fluxxor.createStore({
        actions: {
          ACTION_TYPE: "handleAction"
        },

        handleAction() {}
      });
      const Store2 = Fluxxor.createStore({});

      store1 = new Store1();
      store2 = new Store2();
      dispatcher = new Fluxxor.Dispatcher({ Store1: store1, Store2: store2 });
      dispatcher.dispatch({ type: "ACTION_TYPE" });

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
