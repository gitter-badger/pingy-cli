'use strict';

var chokidar = require('chokidar');

module.exports = (function() {
  function Cache(mountPath, eventEmitter) {
    // Set-up cache and watchers
    this.cache = {};
    this.watchers = [];
    this.mountPath = mountPath;
    this.events = eventEmitter;
  }

  Cache.prototype.exists = function(compiledPath) {
    return compiledPath in this.cache;
  };

  Cache.prototype.get = function (compiledPath) {
    return this.cache[compiledPath];
  };

  Cache.prototype['delete'] = function(compiledPath) {
    if (compiledPath in this.cache) {
      this.cache[compiledPath] = null;
      delete this.cache[compiledPath];
    }
  };

  Cache.prototype.add = function (sourcePath, compiledPath, compiled) {
    this._add(compiledPath, compiled);
    var sources = this._getSources(compiled, sourcePath);
    this._addWatcher(compiledPath, sources);
  };

  Cache.prototype._getSources = function(compiled, sourcePath) {
    var sources;
    if (compiled.sourcemap) {
      // Remove preceeding slash to make the path relative (instead of absolute)
      sources = compiled.sourcemap.sources.map(function (src) {
        return src.substring(1);
      });
    }
    return sources || [sourcePath];
  };

  Cache.prototype._add = function(compiledPath, contents) {
    if (contents) {
      this.cache[compiledPath] = contents;
    }
  };

  Cache.prototype._addWatcher = function(compiledPath, sources) {
    var fileChanged = function(sourcePath) {
      this['delete'](compiledPath);
      this.events.emit('fileChanged', compiledPath, sourcePath);
    };

    if (this.watchers.indexOf(compiledPath) === -1) {
      chokidar.watch(sources, {
        cwd: this.mountPath
      })
      // TODO: Trigger a browser reload event on change/unlink
      .on('change', fileChanged.bind(this))
      .on('unlink', fileChanged.bind(this));
      this.watchers.push(compiledPath);
    }
  };

  return Cache;
})();