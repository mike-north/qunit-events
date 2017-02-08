QUnit.module("Public API");

QUnit.test("Public API is present", function(assert) {
  assert.equal(typeof QUnit.events, "object", "events namespace is present");
  assert.equal(typeof QUnit.EventsPluginManager, "function", "PluginManager is present");
  assert.equal(typeof QUnit.EventsPlugin, "function", "Plugin is present");
  assert.equal(typeof QUnit.events.registerPlugin, "function", "registerPlugin is present");
  assert.equal(typeof QUnit.events.unregisterPlugin, "function", "unregisterPlugin is present");
  assert.equal(typeof QUnit.events.receive, "function", "receive is present");
});
