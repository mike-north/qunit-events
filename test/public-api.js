QUnit.module("Public API");

QUnit.test("Public API is present", function(assert) {
  assert.equal(typeof QUnit.events, "object", "events namespace is present");
  assert.equal(typeof QUnit.EventsPluginManager, "function", "PluginManager is present");
  assert.equal(typeof QUnit.EventsPlugin, "function", "Plugin is present");
  assert.equal(typeof QUnit.events.registerPlugin, "function", "registerPlugin is present");
  assert.equal(typeof QUnit.events.unregisterPlugin, "function", "unregisterPlugin is present");
  assert.equal(typeof QUnit.events.receive, "function", "receive is present");

});


// QUnit.test("Setup", function(assert) {
//   var SETUP_EVENT_PAYLOAD = {
//     type: "qunitEvents",
//     id: "lj1h2rljh12rlkh12e"
//   };
//   var evt = null;
//   var plugin = {
//     setup: function(e) {
//       evt = e;
//     }
//   };
//   QUnit.event.registerPlugin(plugin);
//   QUnit.event.setup(SETUP_EVENT_PAYLOAD);
//   assert.deepEqual(evt, SETUP_EVENT_PAYLOAD, "setup payload is correct");
//   assert.throws(function() {
//     QUnit.event.setup(SETUP_EVENT_PAYLOAD);
//   }, "already set up");
// });