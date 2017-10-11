import Fluxxor from "../src";

describe("Flux", () => {
  it("allows retrieval of stores added by constructor", () => {
    const store1 = {};
    const store2 = {};
    const stores = { Store1: store1, Store2: store2 };
    const flux = new Fluxxor.Flux(stores, {});

    expect(flux.store("Store1")).toBe(store1);
    expect(flux.store("Store2")).toBe(store2);
  });

  it("allows retrieval of stores added by addStores", () => {
    const store1 = {};
    const store2 = {};
    const stores = { Store1: store1, Store2: store2 };
    const flux = new Fluxxor.Flux();

    flux.addStores(stores);

    expect(flux.store("Store1")).toBe(store1);
    expect(flux.store("Store2")).toBe(store2);
  });

  it("allows retrieval of stores added by addStore", () => {
    const store1 = {};
    const store2 = {};
    const flux = new Fluxxor.Flux();

    flux.addStore("Store1", store1);
    flux.addStore("Store2", store2);

    expect(flux.store("Store1")).toBe(store1);
    expect(flux.store("Store2")).toBe(store2);
  });

  it("allows retrieval of all stores", () => {
    const store1 = {};
    const store2 = {};
    const store3 = {};
    const flux = new Fluxxor.Flux({ store1, store2, store3 });

    expect(flux.getAllStores()).toEqual({ store1, store2, store3 });
  });

  it("does not allow duplicate stores", () => {
    const store1 = {};
    const flux = new Fluxxor.Flux();

    flux.addStore("Store1", store1);

    expect(() => {
      flux.addStore("Store1", {});
    }).toThrow(/store.*Store1.*already exists/);
    expect(flux.store("Store1")).toBe(store1);
  });

  it("sets a 'flux' property on stores", () => {
    const store1 = {};
    const store2 = {};
    const stores = { Store1: store1, Store2: store2 };
    const flux = new Fluxxor.Flux(stores, {});

    expect(store1.flux).toBe(flux);
    expect(store2.flux).toBe(flux);
  });

  it("binds actions' `this.dispatch` to the dispatcher", () => {
    const actions = {
      act() {
        this.dispatch("ABC", { val: 123 });
      }
    };
    const flux = new Fluxxor.Flux({}, actions);
    const action = { type: "ABC", payload: { val: 123 } };

    flux.dispatcher.dispatch = jest.fn();

    flux.actions.act();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith(action);
  });

  it("binds actions' `this.flux` to the flux instance", done => {
    let flux;

    const actions = {
      act() {
        expect(this.flux).toBe(flux);
        done();
      }
    };

    flux = new Fluxxor.Flux({}, actions);
    flux.actions.act();
  });

  it("allows namespaced actions", () => {
    const actions = {
      a: {
        b: {
          c() {
            this.dispatch("action", { name: "a.b.c" });
          }
        },
        d() {
          this.dispatch("action", { name: "a.d" });
        }
      },
      e() {
        this.dispatch("action", { name: "e" });
      }
    };
    const flux = new Fluxxor.Flux({}, actions);

    flux.dispatcher.dispatch = jest.fn();

    flux.actions.e();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith({
      type: "action",
      payload: { name: "e" }
    });

    flux.actions.a.d();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith({
      type: "action",
      payload: { name: "a.d" }
    });

    flux.actions.a.b.c();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith({
      type: "action",
      payload: { name: "a.b.c" }
    });
  });

  it("allows adding actions after Flux creation via addActions", () => {
    const actions = {
      a: {
        b: {
          c() {
            this.dispatch("action", { name: "a.b.c" });
          }
        },
        d() {
          this.dispatch("action", { name: "a.d" });
        }
      },
      e() {
        this.dispatch("action", { name: "e" });
      }
    };
    const flux = new Fluxxor.Flux();

    flux.addActions(actions);
    flux.dispatcher.dispatch = jest.fn();

    flux.actions.e();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith({
      type: "action",
      payload: { name: "e" }
    });

    flux.actions.a.d();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith({
      type: "action",
      payload: { name: "a.d" }
    });

    flux.actions.a.b.c();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith({
      type: "action",
      payload: { name: "a.b.c" }
    });
  });

  it("allows adding actions after Flux creation via addAction", () => {
    const actions = {
      a: {
        b: {
          c() {
            this.dispatch("action", { name: "a.b.c" });
          }
        },
        d() {
          this.dispatch("action", { name: "a.d" });
        }
      },
      e() {
        this.dispatch("action", { name: "e" });
      }
    };
    const flux = new Fluxxor.Flux({}, actions);

    flux.addAction("f", function action() {
      this.dispatch("action", { name: "f" });
    });
    flux.addAction("a", "b", "g", function action() {
      this.dispatch("action", { name: "a.b.g" });
    });
    flux.addAction("h", "i", "j", function action() {
      this.dispatch("action", { name: "h.i.j" });
    });
    flux.addAction(["k", "l", "m"], function action() {
      this.dispatch("action", { name: "k.l.m" });
    });
    flux.dispatcher.dispatch = jest.fn();

    flux.actions.f();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith({
      type: "action",
      payload: { name: "f" }
    });

    flux.actions.a.b.g();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith({
      type: "action",
      payload: { name: "a.b.g" }
    });

    flux.actions.h.i.j();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith({
      type: "action",
      payload: { name: "h.i.j" }
    });

    flux.actions.k.l.m();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith({
      type: "action",
      payload: { name: "k.l.m" }
    });
  });

  it("does not allow replacing namespaces with actions", () => {
    const actions = {
      a: {
        b() {
          this.dispatch("action", { name: "a.b" });
        }
      }
    };
    const flux = new Fluxxor.Flux({}, actions);

    expect(() => {
      flux.addAction("a", function action() {
        this.dispatch("action", { name: "a.z" });
      });
    }).toThrow(/namespace.*a.*already exists/);

    flux.dispatcher.dispatch = jest.fn();

    flux.actions.a.b();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith({
      type: "action",
      payload: { name: "a.b" }
    });
  });

  it("does not allow replacing actions", () => {
    const actions = {
      a: {
        b() {
          this.dispatch("action", { name: "a.b" });
        }
      }
    };
    const flux = new Fluxxor.Flux({}, actions);

    expect(() => {
      flux.addAction("a", "b", "c", function action() {
        this.dispatch("action", { name: "a.b.c" });
      });
    }).toThrow(/action.*a\.b.*already exists/);

    expect(() => {
      flux.addAction("a", "b", function action() {
        this.dispatch("action", { name: "a.b.c" });
      });
    }).toThrow(/action.*a\.b.*exists/);

    flux.dispatcher.dispatch = jest.fn();

    flux.actions.a.b();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith({
      type: "action",
      payload: { name: "a.b" }
    });
  });

  it("deeply merges with existing actions", () => {
    const actions = {
      a: {
        b() {
          this.dispatch("action", { name: "a.b" });
        },
        c: {
          d() {
            this.dispatch("action", { name: "a.c.d" });
          }
        }
      }
    };
    const flux = new Fluxxor.Flux({}, actions);

    flux.addAction("a", "c", "e", function action() {
      this.dispatch("action", { name: "a.c.e" });
    });

    flux.dispatcher.dispatch = jest.fn();

    flux.actions.a.c.e();
    expect(flux.dispatcher.dispatch).toHaveBeenCalledWith({
      type: "action",
      payload: { name: "a.c.e" }
    });
  });

  it("throws when using addAction incorrectly", () => {
    const flux = new Fluxxor.Flux();

    expect(() => {
      flux.addAction();
    }).toThrow(/two arguments/);

    expect(() => {
      flux.addAction("a");
    }).toThrow(/two arguments/);

    expect(() => {
      flux.addAction("a", "b");
    }).toThrow(/last argument.*function/);

    expect(() => {
      flux.addAction("a", () => {}, "b");
    }).toThrow(/last argument.*function/);
  });

  describe("emitting dispatching", () => {
    let originalConsoleWarn;

    beforeEach(() => {
      originalConsoleWarn = console.warn;

      console.warn = () => {};
    });

    afterEach(() => {
      console.warn = originalConsoleWarn;
    });

    it("emits an event when dispatching an action", () => {
      const payload1 = { payload: "1", thing: [1, 2, 3] };
      const payload2 = { payload: "2", thing: [1, 2, 3] };
      const payload3 = { payload: "3", thing: [1, 2, 3] };
      const actions = {
        a() {
          this.dispatch("ACTION_1", payload1);
        },
        b() {
          this.dispatch("ACTION_2", payload2);
        },
        c() {
          this.dispatch("ACTION_3", payload3);
        }
      };
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const callback = (type, payload) => {
        if (type === "ACTION_1") {
          spy1(payload);
        }
        if (type === "ACTION_2") {
          spy2(payload);
        }
        if (type === "ACTION_3") {
          throw new Error("ACTION_3");
        }
      };
      const store = {
        __handleAction__(action) {
          spy3(action);
        }
      };
      const flux = new Fluxxor.Flux({ store }, actions);

      flux.on("dispatch", callback);

      flux.actions.a();
      expect(spy1).toHaveBeenCalledWith(payload1);
      expect(spy2).not.toHaveBeenCalled();

      flux.actions.b();
      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledWith(payload2);

      expect(() => flux.actions.c()).toThrow();
      expect(spy3).toHaveBeenCalled();
    });
  });
});
