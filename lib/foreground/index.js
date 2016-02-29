
/**
* Module dependencies.
*/
var cssPath = require('./3rd-party/optimal-select.min.js').select;
var each = require('component/each');
var fmt  = require('yields/fmt');

/**
 * Events and elements.
 */

detect('click');
detect('mousedown');
detect('keydown');
detect('copy');

/**
 * Detect.
 *
 * @param {String} listener
 */

var lastEvent = {};

function detect(listener) {
  if (listener === 'copy') return copyText();

  var els = document.querySelectorAll('body');
  each(els, function(el){
    el.addEventListener(listener, function(event) {
      if (listener === 'click' || listener === 'mousedown') {
        if (lastEvent.type === 'keydown') {
          handle('type', lastEvent.target);
        }
        handle('click', event.target);
      }
      lastEvent = event;
    });
  });
};

/**
* Copy text.
*/

function copyText(){
  window.onkeydown = function(event){
    if (event.keyCode === 67 && event.ctrlKey) {
      var selObj = window.getSelection();
      handle('evaluate', selObj.focusNode);
    }
  };
};

/**
 * Handle.
 *
 * @param {String} event
 * @param {Node} node
 */

function handle(event, node) {
  if (chrome && chrome.runtime) {
    var path = cssPath(node);
    var message = [event, path];
    message.push(node.value);
    chrome.runtime.sendMessage(message);
  }
};
