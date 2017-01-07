'use strict';
var stylegen = require('./lib/stylegen');
var LayerWatcher = require('./lib/layerwatcher');
var InspectIcon = require('./lib/inspecticon');
var MapIcon = require('./lib/mapicon');

var emptyStyle = {
  version: 8,
  layers: [],
  sources: {}
};

function InspectToggle(opts) {
  var enabled = false;

  var btn = document.createElement("button");
  btn.className = "mapboxgl-ctrl-icon mapboxgl-ctrl-zoom-in"
  btn.type = 'button'
  btn.style['background-image'] = 'url(data:image/svg+xml;charset=utf8,' + encodeURI(InspectIcon) + ')';

  btn['aria-label'] = 'Inspect'
  btn.onclick = function() {
    enabled = !enabled;
    if(enabled) {
      btn.style['background-image'] = 'url(data:image/svg+xml;charset=utf8,' + encodeURI(MapIcon) + ')';
    } else {
      btn.style['background-image'] = 'url(data:image/svg+xml;charset=utf8,' + encodeURI(InspectIcon) + ')';
    }
    opts.onToggle(enabled);
  }

  var container = document.createElement('div');
  container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
  container.appendChild(btn)
  return container
}

function MapboxInspector(options) {
  if (!(this instanceof MapboxInspector)) {
    throw new Error("MapboxInspector needs to be called with the new keyword");
  }

  var triggerAnalyze = null;

  this.onAdd = function(map) {
    var originalStyle = emptyStyle;
    var inspectStyle = stylegen.generateInspectStyle(originalStyle, []);
    var watcher = new LayerWatcher({
      onSourcesChange: function(sources) {
        var coloredLayers = stylegen.generateColoredLayers(sources);
        inspectStyle = stylegen.generateInspectStyle(map.getStyle(), coloredLayers);
      }
    });

    triggerAnalyze = function(e) {
      watcher.analyzeMap(map);
    }

    map.on("tiledata", triggerAnalyze);
    map.on("sourcedata", triggerAnalyze);
    map.on("load", triggerAnalyze);

    this._map = map;
    this._container = InspectToggle({
      onToggle: function(enable) {
        if(enable) {
          originalStyle = map.getStyle();
          map.setStyle(inspectStyle);
        } else {
          map.setStyle(originalStyle);
        }
      }
    });
    return this._container;
  };

  this.onRemove = function() {
     this._map.off("tiledata", triggerAnalyze);
     this._map.off("sourcedata", triggerAnalyze);
     this._map.off("load", triggerAnalyze);

     this._container.parentNode.removeChild(this._container);
     this._map = undefined;
  };
}

module.exports = MapboxInspector;
