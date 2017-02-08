/**
 * QUnit Events
 */
(function(w) {

  ///================= PLUGIN =================///
  function QUnitEventPlugin(name) {
    this._name = name;
  }

  QUnitEventPlugin.prototype = {
    onDone: function() {},
    onBegin: function() {},
    onModuleStart: function() {},
    onModuleDone: function() {},
    onTestStart: function() {},
    onTestDone: function() {}
  };

  ///=========== POSTMESSAGE PLUGIN ===========///

  function QUnitPostMessagePlugin(options) {
    if (!options.hostWindow) throw "PostMessagePlugin options must include a hostWindow";
    this._hostWindow = options.hostWindow;
    this._origin = options.origin || window.location.protocol + "//" + window.location.hostname;
    this._sendEvent = function(eventName, evt) {
      this._hostWindow.postMessage(QUnit.extend(evt, {
        eventName: eventName
      }), this._origin);
    };
  }
  QUnitPostMessagePlugin.prototype = new QUnitEventPlugin("postmessage");
  QUnitPostMessagePlugin.prototype.onSetup = function() {};
  QUnitPostMessagePlugin.prototype.onBegin = function(evt) {
    this._sendEvent("begin", evt);
  };
  QUnitPostMessagePlugin.prototype.onDone = function(evt) {
    this._sendEvent("done", evt);
  };
  QUnitPostMessagePlugin.prototype.onModuleStart = function(evt) {
    this._sendEvent("moduleStart", evt);
  };
  QUnitPostMessagePlugin.prototype.onModuleDone = function(evt) {
    this._sendEvent("moduleDone", evt);
  };
  QUnitPostMessagePlugin.prototype.onTestStart = function(evt) {
    this._sendEvent("testStart", evt);
  };
  QUnitPostMessagePlugin.prototype.onTestDone = function(evt) {
    this._sendEvent("testDone", evt);
  };

  ///============= PLUGIN MANAGER =============///
  function QUnitEventPluginManager(qunit) {
    this._plugins = [];
    var q = qunit || QUnit;

    function callPluginHookOnPlugin(plugin, hookName, args) {
      var functionName = "on" + hookName[0].toUpperCase() + hookName.substring(1);
      var fn = plugin[functionName];
      fn.apply(plugin, args);
    }

    this._callPluginHook = function(hookName) {
      var args = Array.prototype.slice.call(arguments).splice(1, 1);
      if (args[0] && typeof args[0] === "object") {
        args[0].instanceId = this._id;
      }
      for (var i = 0; i < this._plugins.length; i++) {
        callPluginHookOnPlugin(this._plugins[i], hookName, args);
      }
    };

    function receiveHook(eventName) {
      return function(event) {
        this.receive(QUnit.extend(event, { eventName: eventName }));
      }.bind(this);
    }

    this._instantiatePlugins = function(plugins) {
      for (var i = 0; i < plugins.length; i++) {
        switch (plugins[i].type) {
          case "postmessage":
            this.registerPlugin(new QUnitPostMessagePlugin(plugins[i]));
            break;
          default:
            throw "Unknown plugin type: " + plugins[i].type;
        }
      }
    };

    this._processSetup = function(event) {
      if (typeof this._id !== "undefined") throw "QUnit event manager is already set up";
      if (!event.instanceId) throw "Setup event payload must contain an instanceId property";
      if (!event.plugins || typeof event.plugins.indexOf !== "function") throw "Setup event payload must contain a plugins array";
      this._instantiatePlugins(event.plugins);
      this._id = event.instanceId;
    };



    function receiveMessage(event) {
      var plugins = (event.data.plugins || []);
      for (var i = 0; i < plugins.length; i++) {
        if (plugins[i].type === "postmessage") {
          plugins[i].hostWindow = event.source;
        }
      }
      if (typeof event.data === "object" && typeof event.data.eventType === "string") {
        this.receive(event.data);
      }
    }
    window.addEventListener("message", receiveMessage.bind(this), false);

    q.begin(receiveHook.call(this, "begin"));
    q.done(receiveHook.call(this, "done"));
    q.moduleStart(receiveHook.call(this, "moduleStart"));
    q.moduleDone(receiveHook.call(this, "moduleDone"));
    q.testStart(receiveHook.call(this, "testStart"));
    q.testDone(receiveHook.call(this, "testDone"));
  }

  QUnitEventPluginManager.prototype = {};

  QUnitEventPluginManager.prototype.registerPlugin = function(plugin) {
    this._plugins.push(plugin);
    return plugin;
  };

  QUnitEventPluginManager.prototype.unregisterPlugin = function(plugin) {
    var idx = this._plugins.indexOf(plugin);
    this._plugins.splice(idx, 1);
  };

  QUnitEventPluginManager.prototype.pluginCount = function() {
    return this._plugins.length;
  };

  QUnitEventPluginManager.prototype.isReady = function() {
    return typeof this._id !== "undefined";
  };

  QUnitEventPluginManager.prototype.receive = function(evt) {
    if (!evt) throw "Empty event payload";
    switch (evt.eventName) {
      case "setup":
        this._processSetup(evt);
        this._callPluginHook(evt.eventName, evt);
        break;
      case "begin":
      case "done":
      case "moduleStart":
      case "moduleDone":
      case "testStart":
      case "testDone":
        if (this.isReady()) {
          this._callPluginHook(evt.eventName, evt);
        }
        break;
      default:
        throw "Unknown event type " + evt.eventName;
    }
  };

  ///============== SETUP QUNIT ===============///
  function doSetup() {
    if (!QUnit.events) {
      var defaultManager = new QUnitEventPluginManager();
      QUnit.extend(QUnit, {
        EventsPluginManager: QUnitEventPluginManager,
        EventsPlugin: QUnitEventPlugin,
        events: defaultManager
      });
    }
  }
  w.addEventListener("load", doSetup);

}(window));