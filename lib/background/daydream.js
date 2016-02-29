
/**
 * Module dependencies.
 */

var Emitter = require('component/emitter');
var uid  = require('matthewmueller/uid');
var recorder = require('./recorder')();
var each = require('component/each');
var os = require('component/os');
var fmt = require('yields/fmt');

/**
 * Expose `Daydream`.
 */

module.exports = Daydream;

/**
 * Daydream.
 */

function Daydream(){
  if (!(this instanceof Daydream)) return new Daydream();
  this.isRunning = false;
}

/**
 * Boot.
 */

Daydream.prototype.boot = function(){
  var self = this;
  chrome.browserAction.onClicked.addListener(function(){
    if (!self.isRunning) {
      recorder.startRecording();
      self.setIcon("green");
    } else {
      recorder.stopRecording();
      self.setIcon("black");
      var nightmare = self.parse(recorder.recording, 'nightmare');
      var horseman  = self.parse(recorder.recording, 'horseman');
      chrome.storage.sync.set({
        'nightmare': nightmare,
        'horseman': horseman
      });
      self.showPopup();
    }
    self.isRunning = !self.isRunning;
  });
};

/**
 * Set the icon.
 *
 * @param {String} color
 */

Daydream.prototype.setIcon = function(color){
  if (color === "green") return chrome.browserAction.setIcon({path: 'images/icon-green.png'});
  if (color === "black") return chrome.browserAction.setIcon({path: 'images/icon-black.png'});
};

/**
 * Show the popup.
 */

Daydream.prototype.showPopup = function(){
  chrome.browserAction.setPopup({popup: 'index.html'});
  chrome.browserAction.setBadgeText({text: '1'});
};

/**
 * Parse the recording.
 *
 * @param {Array} recording
 */

Daydream.prototype.parse = function(recording, lib){
  var newLine = '\n';
  if (os == 'windows') newLine = '\r\n';

  var result;
  if (lib === 'nightmare') {
    result = [
      'it(\'should do something\', function(done) {',
      '\tnightmare',
      '\t.goto(url)' + newLine
    ].join(newLine);
  }

  each(recording, function (record, i) {
    var type = record[0];
    var content = record[1];
    switch (type) {
      case 'goto':
        if (lib === 'nightmare') {
          result += fmt("\t.goto('%s')%s", content, newLine);
        }
        break;
      case 'click':
        result += fmt("\t.click('%s')%s", content, newLine);
        break;
      case 'type':
        var val = record[2];
        result += fmt("\t.type('%s', '%s')%s", content, val, newLine);
        break;
      case 'screenshot':
        result += fmt("\t.screenshot('%s')%s", content, newLine);
        break;
      case 'reload':
        if (lib === 'nightmare') {
          result += fmt("\t.refresh()%s", newLine);
        }
        break;
      case 'evaluate':
        var textEl = fmt("\t\treturn document.querySelector('%s').innerText;", content);

        result += [
          '\t.evaluate(function () {',
          textEl,
          '\t}, function (text) {',
          '\t\tconsole.log(text);',
          fmt('\t})%s', newLine)
        ].join(newLine);

        break;
      default:
        console.log("Not a valid nightmare/horseman command");
    }
  });

  result += [
    '\t.evaluate(function () {',
    '\t\t// DOM manipulations here',
    '\t\treturn something;',
    '\t})',
    '\t//.end() // if this is the last testcase',
    '\t.then(function(result){',
    '\t\t// Tests should go here',
    '\t\texpect(result).toContain(',
    '\t\t\t\'foobar\'',
    '\t\t\t\'test case description\'',
    '\t\t);',
    '\t\tdone();',
    '\t});',
    '});'
  ].join(newLine);
  return result;
};
