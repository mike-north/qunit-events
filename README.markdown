# QUnit Events [![Build Status](https://travis-ci.org/mike-north/qunit-events.svg?branch=master)](https://travis-ci.org/mike-north/qunit-events)
A pluggable, event-driven extension to [QUnit](https://qunitjs.com)

## Why might you want to use this?
Anytime you want QUnit to communicate test results and status outside of the test runner’s frame. This might include:

* Showing test results along side your application as you develop
* Communicating test results to an instructor’s machine in a classroom setting
* Agglomerating paralleled tests into a single status UI

## How does this work
You’ll begin by providing the library with a configuration object. Right now this can only be done via postMessage into the test runner’s frame.

You might have an iframe like this, inside which QUnit is running your tests

```html
<iframe
	src="http://localhost:4200/tests"
  onload="frameLoad(event)" ></iframe>
```

And define your `frameLoad` function as follows

```js
function frameLoad(event) {
  var origin = "https://fiddle.jshell.net";
	event.target.contentWindow.postMessage({
	  eventName: 'setup', // required
    instanceId: 'abc',  // required, any unique string
    plugins: [{
    	type: 'postmessage',
      origin: origin
    }]
  }, origin);
}
```

Support for additional features is in the works, including WebRTC and WebSocket support for classroom use.
