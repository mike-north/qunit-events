(function () {
  var QUNIT_GLOBAL_SHIM = {
    begin: function () { },
    done: function () { },
    moduleStart: function () { },
    moduleDone: function () { },
    testStart: function () { },
    testDone: function () { }
  };

  QUnit.module("EventsPluginManager");

  QUnit.test("Wiring up to QUnit", function (assert) {
    var invocations = { begin: 0, done: 0 };
    var shim = {
      begin: function () {
        invocations.begin++;
      },
      done: function () {
        invocations.done++;
      },
      moduleStart: function () { },
      moduleDone: function () { },
      testStart: function () { },
      testDone: function () { }
    };
    new QUnit.EventsPluginManager(shim);

    assert.equal(invocations.begin, 1, "registered one onBegin listener");
    assert.equal(invocations.done, 1, "registered one onDone listener");
  });


  QUnit.test("Plugin registration", function (assert) {
    var manager = new QUnit.EventsPluginManager(QUNIT_GLOBAL_SHIM);
    var plugin = new QUnit.EventsPlugin();

    var oldPluginCount = manager.pluginCount();
    var p = manager.registerPlugin(plugin);
    assert.ok(p, "registerPlugin returns the plugin");
    assert.equal(manager.pluginCount() - oldPluginCount, 1, "one more plugin indicated as registered");
    manager.unregisterPlugin(plugin);
    assert.equal(manager.pluginCount() - oldPluginCount, 0, "one less plugin indicated as registered");
  });


  QUnit.test("Setup, start and end test suite", function (assert) {
    var beginHook = null;
    var doneHook = null;
    var manager = new QUnit.EventsPluginManager({
      begin: function(f) {
        beginHook = f;
      },
      done: function(f) {
        doneHook = f;
      },
      moduleStart: function () { },
      moduleDone: function () { },
      testStart: function () { },
      testDone: function () { }
    });

    var uniqueId = "lj1h212erljh12rlkh";
    assert.equal(manager.isReady(), false, "Initially not setup");
    manager.receive({
      eventName: "setup",
      instanceId: uniqueId,
      plugins: [{
        type: "postmessage",
        hostWindow: window,
        origin: "http://localhost"
      }]
    });
    assert.equal(manager.isReady(), true, "Ready after receiving the setup event");
    assert.throws(function() {
      manager.receive({
        eventName: "setup",
        instanceId: uniqueId,
        plugins: []
      });
    }, "already set up");
    var oldPostMessage = window.postMessage;
    var postMessagePayloads = [];
    window.postMessage = function(data) {
      postMessagePayloads.push(data);
    };
    assert.equal(postMessagePayloads.length, 0, "No postMessage data to start");
    beginHook({});
    assert.equal(postMessagePayloads.length, 1, "one postMessage payload for starting");
    assert.equal(postMessagePayloads[0].instanceId, uniqueId, "unique ID is present in payload");
    doneHook({});
    assert.equal(postMessagePayloads.length, 2, "last postMessage for done hook");
    window.postMessage = oldPostMessage;   
  });


}());