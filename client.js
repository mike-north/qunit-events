/* eslint no-var:0, object-shorthand:0, prefer-template:0, max-statements-per-line:["error",{"max": 2}] */
/* globals define:true */
(function(w) {
  function handleEvent(event) {
    var evt = new Event("qunit-event");
    var frameId = event.data.instanceId;
    evt.data = event.data;
    delete evt.data.instanceId;
    var frame = document.querySelector("iframe.qunit-events-frame-" + frameId);
    frame.dispatchEvent(evt);
  }

  function receiveMessage(event) {
    var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
    if (origin !== "http://localhost:4200") {
      return;
    }
    if (event.data.instanceId) {
      handleEvent(event);
    }
  }

  function doSetup() {
    w.addEventListener("message", receiveMessage, false);
  }
  w.addEventListener("load", doSetup);

  function defaultTestUrl() {
    var url = new URL(w.location.href);
    url.pathname = "/tests";
    return url.href;
  }

  // ==== Client ==== //

  function QUnitEventsClient(options) {
    this._testUrl = (options || {}).testUrl || defaultTestUrl();
    this._id = "qunitEvents" + Math.round(Math.random() * 100000000);
    this._listeners = [];
    // ====== IFRAME LOAD RESPONDER ====== //

    function setupTestFrameWindow(fw) {
      var testOrigin = new URL(this._testUrl).origin;
      var appOrigin = new URL(w.location.href).origin;
      fw.postMessage({
        eventName: "setup",
        instanceId: this._id,
        plugins: [{
          type: "postmessage",
          origin: appOrigin
        }]
      }, testOrigin);
    }

    this._onFrameLoaded = function(event) {
      var testFrameWindow = event.target.contentWindow;
      setupTestFrameWindow.call(this, testFrameWindow);
    }.bind(this);

    // ====== STATE ====== //
    function qunitTestAdapter(testInfo) {
      return {
        name: testInfo.name,
        id: testInfo.testId,
        assertions: [],
        status: {},
        time: null
      };
    }

    function qunitModuleAdapter(moduleInfo) {
      return {
        name: moduleInfo.name,
        tests: moduleInfo.tests.map(qunitTestAdapter),
        status: {},
        time: null
      };
    }

    function qunitAssertionAdapter(assertionInfo) {
      return {
        result: assertionInfo.result,
        message: assertionInfo.message.split("\n").join("\n  ")
      };
    }
    this._setupModule = function(moduleInfo) {
      this._testModules.push(qunitModuleAdapter(moduleInfo));
    };

    // ===== Utilities ===== //
    this._moduleByName = function(name) {
      var items = this._testModules.filter(function(x) {
        return x.name === name;
      });
      return items.length > 0 ? items[0] : null;
    };

    this._testByName = function(moduleName, testName) {
      var m = this._moduleByName(moduleName);
      var items = m.tests.filter(function(x) {
        return x.name === testName;
      });
      return items.length > 0 ? items[0] : null;
    };

    // ====== MESSAGE EVENT RESPONDERS ====== //
    this._onBegin = function(msg) {
      var testModules = msg.modules;
      this._testModules = new Array();
      for (var i = 0; i < testModules.length; i++) {
        this._setupModule.call(this, testModules[i]);
      }
      this._fireStateChangeEvent();
    };

    this._onModuleStart = function(/* msg */) {
      this._fireStateChangeEvent();
    };

    this._onTestStart = function(/* msg */) {
      this._fireStateChangeEvent();
    };

    this._onTestDone = function(msg) {
      var t = this._testByName(msg.module, msg.name);
      if (msg.testId !== t.id) {
        throw "Expected " + t.id + " to finish before other tests start";
      }
      t.assertions = msg.assertions.map(qunitAssertionAdapter);
      t.time = msg.runtime;
      t.status = {
        passed: msg.passed,
        failed: msg.failed
      };
      this._fireStateChangeEvent();
    };

    this._onModuleDone = function(msg) {
      var m = this._moduleByName(msg.name);
      m.time = msg.runtime;
      m.status = {
        passed: msg.passed,
        failed: msg.failed
      };
      this._fireStateChangeEvent();
    };

    this._onDone = function() {
      this._fireStateChangeEvent();
    };

    // ==== UI Updating ==== //
    this._fireStateChangeEvent = function() {
      for (var i = 0; i < this._listeners.length; i++) {
        this._listeners[i]({
          modules: this._testModules
        });
      }
    };

    this._handleEvent = function(event) {
      switch (event.data.eventName) {
        case "begin":       this._onBegin.call(this, event.data); break;
        case "moduleStart": this._onModuleStart.call(this, event.data); break;
        case "moduleDone":  this._onModuleDone.call(this, event.data); break;
        case "testStart":   this._onTestStart.call(this, event.data); break;
        case "testDone":    this._onTestDone.call(this, event.data); break;
        case "done":        this._onDone.call(this, event.data); break;
        default:
          throw "Unknown event type: " + event.data.eventName;
      }
    }.bind(this);
  }

  QUnitEventsClient.prototype = {
    setupTestFrame: function(container) {
      this.ui.setupTestFrame(container);
    },
    registerChangeListener: function(listener) {
      if (this._listeners.indexOf(listener) < 0) {
        return;
      }
      this._listeners.push(listener);
    },
    unregisterChangeListener: function(listener) {
      var idx = this._listeners.indexOf(listener);
      if (idx >= 0) {
        this._listeners.splice(idx, 1);
      }
    }
  };

  w.QUnitEventsClient = QUnitEventsClient;
  if (typeof define === "function") {
    define("qunit-events/client", [], function() {
      return {
        default: QUnitEventsClient
      };
    });
  }
  if (typeof define === "function") {
    define("qunit-events/client", [], function() {
      return {
        default: QUnitEventsClient
      };
    });
  }
}(window));