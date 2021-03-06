"use strict";

const universalAnalytics = require('universal-analytics');
const detect = require('./detect');
const _ = require('lodash');

/* A rider is attached to alexaEvents to expose an API
 */
module.exports = class GoogleAnalyticsEventRider {
  constructor(alexaEvent, config) {
    this.alexaEvent = alexaEvent;
    this.config = config;
    this.pageparams = {};
    this.path = [];
    this.timers = [];

    this.visitor = universalAnalytics(config.trackingId, alexaEvent.user.userId, {debug: config.debug, strictCidFormat: false});
    if(alexaEvent.request.locale) this.visitor.set('ul',alexaEvent.request.locale.toLowerCase());
    this.visitor.set('fl',detect.deviceCapabilities(alexaEvent));
  }

  ignore() {
    this.ignoreState = true;
  }

  startSession() {
    this.pageparams.sc = 'start';
  }

  endSession() {
    this.pageparams.sc = 'end';
  }

  event() {
    this.visitor.event.apply(this.visitor,arguments);
  }

  time(cat,variable) {
    this.timers.push({cat,variable, start: +new Date()});
  }

  timeEnd(cat,variable) {
    const timer = this.timeRemove(cat,variable);
    if(!timer) return null;
    const elapsed = (+new Date()) - timer.start;
    this.visitor.timing(cat,variable,elapsed);
  }

  timeRemove(cat,variable) {
    const i = _.findIndex(this.timers,{cat,variable});
    if(i<0) return null;
    const timer = this.timers[i];
    this.timers.splice(i,1);
    return timer;
  }

  pushPath(reply) {
    if(reply) this.path.push(reply);
  }

  logPath() {
    if(this.path.length < 0) throw new Error(`Expected something in the path`);
    const name = _(this.path).compact().value().join('; ');
    this.visitor.screenview(name, this.config.appName, this.config.appVersion, null, null ,this.pageparams);
    this.pageparams = {};
    this.path = [];
  }

};

