/* Copyright 2017 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('pdfjs-test/unit/cmap_spec', ['exports', 'pdfjs/core/cmap',
           'pdfjs/core/primitives', 'pdfjs/core/stream'], factory);
  } else if (typeof exports !== 'undefined') {
      factory(exports, require('../../src/core/cmap.js'),
              require('../../src/core/primitives.js'),
              require('../../src/core/stream.js'));
  } else {
    factory((root.pdfjsTestUnitCMapSpec = {}), root.pdfjsCoreCMap,
             root.pdfjsCorePrimitives, root.pdfjsCoreStream);
  }
}(this, function (exports, coreCMap, corePrimitives, coreStream) {

var CMapFactory = coreCMap.CMapFactory;
var CMap = coreCMap.CMap;
var IdentityCMap = coreCMap.IdentityCMap;
var Name = corePrimitives.Name;
var StringStream = coreStream.StringStream;

var cMapUrl = '../../external/bcmaps/';
var cMapPacked = true;

describe('cmap', function() {
  it('parses beginbfchar', function(done) {
    var str = '2 beginbfchar\n' +
              '<03> <00>\n' +
              '<04> <01>\n' +
              'endbfchar\n';
    var stream = new StringStream(str);
    var cmapPromise = CMapFactory.create(stream);
    cmapPromise.then(function (cmap) {
      expect(cmap.lookup(0x03)).toEqual(String.fromCharCode(0x00));
      expect(cmap.lookup(0x04)).toEqual(String.fromCharCode(0x01));
      expect(cmap.lookup(0x05)).toBeUndefined();
      done();
    }).catch(function (reason) {
      done.fail(reason);
    });
  });
  it('parses beginbfrange with range', function(done) {
    var str = '1 beginbfrange\n' +
              '<06> <0B> 0\n' +
              'endbfrange\n';
    var stream = new StringStream(str);
    var cmapPromise = CMapFactory.create(stream);
    cmapPromise.then(function (cmap) {
      expect(cmap.lookup(0x05)).toBeUndefined();
      expect(cmap.lookup(0x06)).toEqual(String.fromCharCode(0x00));
      expect(cmap.lookup(0x0B)).toEqual(String.fromCharCode(0x05));
      expect(cmap.lookup(0x0C)).toBeUndefined();
      done();
    }).catch(function (reason) {
      done.fail(reason);
    });
  });
  it('parses beginbfrange with array', function(done) {
    var str = '1 beginbfrange\n' +
              '<0D> <12> [ 0 1 2 3 4 5 ]\n' +
              'endbfrange\n';
    var stream = new StringStream(str);
    var cmapPromise = CMapFactory.create(stream);
    cmapPromise.then(function (cmap) {
      expect(cmap.lookup(0x0C)).toBeUndefined();
      expect(cmap.lookup(0x0D)).toEqual(0x00);
      expect(cmap.lookup(0x12)).toEqual(0x05);
      expect(cmap.lookup(0x13)).toBeUndefined();
      done();
    }).catch(function (reason) {
      done.fail(reason);
    });
  });
  it('parses begincidchar', function(done) {
    var str = '1 begincidchar\n' +
              '<14> 0\n' +
              'endcidchar\n';
    var stream = new StringStream(str);
    var cmapPromise = CMapFactory.create(stream);
    cmapPromise.then(function (cmap) {
      expect(cmap.lookup(0x14)).toEqual(0x00);
      expect(cmap.lookup(0x15)).toBeUndefined();
      done();
    }).catch(function (reason) {
      done.fail(reason);
    });
  });
  it('parses begincidrange', function(done) {
    var str = '1 begincidrange\n' +
              '<0016> <001B>   0\n' +
              'endcidrange\n';
    var stream = new StringStream(str);
    var cmapPromise = CMapFactory.create(stream);
    cmapPromise.then(function (cmap) {
      expect(cmap.lookup(0x15)).toBeUndefined();
      expect(cmap.lookup(0x16)).toEqual(0x00);
      expect(cmap.lookup(0x1B)).toEqual(0x05);
      expect(cmap.lookup(0x1C)).toBeUndefined();
      done();
    }).catch(function (reason) {
      done.fail(reason);
    });
  });
  it('decodes codespace ranges', function(done) {
    var str = '1 begincodespacerange\n' +
              '<01> <02>\n' +
              '<00000003> <00000004>\n' +
              'endcodespacerange\n';
    var stream = new StringStream(str);
    var cmapPromise = CMapFactory.create(stream);
    cmapPromise.then(function (cmap) {
      var c = {};
      cmap.readCharCode(String.fromCharCode(1), 0, c);
      expect(c.charcode).toEqual(1);
      expect(c.length).toEqual(1);
      cmap.readCharCode(String.fromCharCode(0, 0, 0, 3), 0, c);
      expect(c.charcode).toEqual(3);
      expect(c.length).toEqual(4);
      done();
    }).catch(function (reason) {
      done.fail(reason);
    });
  });
  it('decodes 4 byte codespace ranges', function(done) {
    var str = '1 begincodespacerange\n' +
              '<8EA1A1A1> <8EA1FEFE>\n' +
              'endcodespacerange\n';
    var stream = new StringStream(str);
    var cmapPromise = CMapFactory.create(stream);
    cmapPromise.then(function (cmap) {
      var c = {};
      cmap.readCharCode(String.fromCharCode(0x8E, 0xA1, 0xA1, 0xA1), 0, c);
      expect(c.charcode).toEqual(0x8EA1A1A1);
      expect(c.length).toEqual(4);
      done();
    }).catch(function (reason) {
      done.fail(reason);
    });
  });
  it('read usecmap', function(done) {
    var str = '/Adobe-Japan1-1 usecmap\n';
    var stream = new StringStream(str);
    var cmapPromise = CMapFactory.create(stream,
                                  { url: cMapUrl, packed: cMapPacked }, null);
    cmapPromise.then(function (cmap) {
      expect(cmap instanceof CMap).toEqual(true);
      expect(cmap.useCMap).not.toBeNull();
      expect(cmap.builtInCMap).toBeFalsy();
      expect(cmap.length).toEqual(0x20A7);
      expect(cmap.isIdentityCMap).toEqual(false);
      done();
    }).catch(function (reason) {
      done.fail(reason);
    });
  });
  it('parses cmapname', function(done) {
    var str = '/CMapName /Identity-H def\n';
    var stream = new StringStream(str);
    var cmapPromise = CMapFactory.create(stream);
    cmapPromise.then(function (cmap) {
      expect(cmap.name).toEqual('Identity-H');
      done();
    }).catch(function (reason) {
      done.fail(reason);
    });
  });
  it('parses wmode', function(done) {
    var str = '/WMode 1 def\n';
    var stream = new StringStream(str);
    var cmapPromise = CMapFactory.create(stream);
    cmapPromise.then(function (cmap) {
      expect(cmap.vertical).toEqual(true);
      done();
    }).catch(function (reason) {
      done.fail(reason);
    });
  });
  it('loads built in cmap', function(done) {
    var cmapPromise = CMapFactory.create(Name.get('Adobe-Japan1-1'),
                                  { url: cMapUrl, packed: cMapPacked }, null);
    cmapPromise.then(function (cmap) {
      expect(cmap instanceof CMap).toEqual(true);
      expect(cmap.useCMap).toBeNull();
      expect(cmap.builtInCMap).toBeTruthy();
      expect(cmap.length).toEqual(0x20A7);
      expect(cmap.isIdentityCMap).toEqual(false);
      done();
    }).catch(function (reason) {
      done.fail(reason);
    });
  });
  it('loads built in identity cmap', function(done) {
    var cmapPromise = CMapFactory.create(Name.get('Identity-H'),
                                  { url: cMapUrl, packed: cMapPacked }, null);
    cmapPromise.then(function (cmap) {
      expect(cmap instanceof IdentityCMap).toEqual(true);
      expect(cmap.vertical).toEqual(false);
      expect(cmap.length).toEqual(0x10000);
      expect(function() { return cmap.isIdentityCMap; }).toThrow(
        new Error('should not access .isIdentityCMap'));
      done();
    }).catch(function (reason) {
      done.fail(reason);
    });
  });
});
}));
