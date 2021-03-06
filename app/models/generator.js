/* global JSON: true, _:true */
import Ember from 'ember';
import ajax from 'ic-ajax';
import config from '../config/environment';

export default Ember.Object.extend({
  archiveLink: '',
  isBuilding: false,
  buildFailed: false,
  isSaving: false,
  buildReady: false,
  manifestId: null,
  siteUrl: '',
  manifest: Ember.Object.create(),
  platforms: [
    { name: 'windows10', isSelected: true },
    { name: 'windows', isSelected: true },
    { name: 'android', isSelected: true },
    { name: 'ios', isSelected: true },
    { name: 'chrome', isSelected: true },
    { name: 'firefox', isSelected: true },
    { name: 'web', isSelected: true }
  ],
  suggestions: Ember.A(),
  warnings: Ember.A(),
  errors: Ember.A(),
  members: Ember.A(),
  buildErrors: Ember.A(),
  errorsTotal: function(){
    return _.sum(this.errors, function(n){
      return n.issues.length;
    });
  }.property('errors'),
  warningsTotal: function(){
    return _.sum(this.warnings, function(n){
      return n.issues.length;
    });
  }.property('errors'),
  suggestionsTotal: function(){
    return _.sum(this.suggestions, function(n){
      return n.issues.length;
    });
  }.property('errors'),
  hasIssues: function(){
    return this.errors.length > 0 || this.warnings.length > 0 || this.suggestions.length > 0;
  }.property('errors,suggestions,warnings'),
  display: {
    names: ['fullscreen', 'standalone', 'minimal-ui', 'browser']
  },
  orientation: {
    names: ['any', 'natural', 'landscape', 'portrait', 'portrait-primary', 'portrait-secondary', 'landscape-primary', 'landscape-secondary']
  },
  save: function () {
    this.set('isSaving', true);
    if(!this.manifestId) {
      this.create();
    } else {
      this.update();
    }
  },
  processResult: function(result){
    this.set('manifest', result.content);
    this.set('manifestId', result.id);
    if(!this.get('manifest.icons')) {
      this.set('manifest.icons',[]);
    }
    if(result.suggestions) {
      this.set('suggestions', result.suggestions);
    }
    if(result.warnings) {
      this.set('warnings', result.warnings);
    }
    if(result.errors) {
      this.set('errors', result.errors);
    }
  },
  setDefaults: function(result){
    if(result.content.display === undefined) {
      this.set('manifest.display', 'fullscreen');
    }
    if(result.content.orientation === undefined) {
      this.set('manifest.orientation', 'any');
    }
  },
  create: function(){
    var self = this;
    ajax({
      url:config.APP.API_URL+'/manifests/',
      type: 'POST',
      data: JSON.stringify({ siteUrl: this.get('siteUrl') }),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8'
    }).then(function(result) {
      self.processResult(result);
      self.setDefaults(result);
      self.set('isSaving', false);
    }).catch(function(){
      self.set('isSaving', false);
    });
  },
  update: function(){
    var self = this;
    var manifest = self.get('manifest');
    manifest = _.omit(manifest,function(prop){
      if(_.isString(prop)){
        return _.isEmpty(prop);
      }else if(_.isObject(prop)){
        return _.isUndefined(prop);
      }
      return false;
    });
    ajax({
      url: config.APP.API_URL + '/manifests/' + this.get('manifestId'),
      type: 'PUT',
      data: JSON.stringify(manifest),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8'
    }).then(function(result) {
      self.processResult(result);
      self.set('isSaving', false);
    }).catch(function(){
      self.set('isSaving', false);
    });
  },
  build: function(){
    var self = this;
    this.set('isBuilding', true);
    this.set('buildFailed',false);
    this.buildErrors.clear();
    // Throw an error if no platform is selected
    if(!this.arePlatformsSelected()) {
      this.set('isBuilding', false);
      this.set('buildFailed', true);
      this.set('buildReady',false);
      this.buildErrors.addObject("Please select at least one of the supported platforms");
    } else {
      ajax({
        url: config.APP.API_URL + '/manifests/' + this.get('manifestId') + '/build',
        type: 'POST',
        data: JSON.stringify({ platforms: this.getPlatforms() }),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8'
      }).then(function(result){
        self.set('archiveLink', result.archive);
        self.set('isBuilding', false);
        self.set('buildFailed',false);
        self.buildErrors.clear();
      }).catch(function(err){
        self.set('isBuilding', false);
        self.set('buildFailed', true);
        self.set('buildReady',false);
        if(err.jqXHR.responseJSON){
          self.buildErrors.addObject(err.jqXHR.responseJSON.error);
        }
      });
    }
  },
  generateFormData: function(file) {
    var formData = new FormData();
    formData.append('file', file);
    return formData;
  },
  upload: function(file) {
    var self = this;
    var data = this.generateFormData(file);
    this.set('isSaving', true);
    ajax({
      url: config.APP.API_URL + '/manifests',
      type: 'POST',
      data: data,
      contentType: false,
      processData: false,
      cache: false
    }).then(function(result) {
      self.processResult(result);
      self.setDefaults(result);
      self.set('isSaving', false);
    }).catch(function(){
      self.set('isSaving', false);
    });
  },
  getPlatforms: function() {
    var platforms = [];
    
    this.get('platforms').forEach(function(item) {
      if (!!item.isSelected) {
        platforms.push(item.name);
      }
    });

    return platforms;
  },
  arePlatformsSelected: function() {
    return this.getPlatforms().length > 0;
  }
});
