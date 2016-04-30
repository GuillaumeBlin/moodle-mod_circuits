/* jshint expr: true */
/* jshint bitwise: false */
/* jshint immed: false */
/*
* This project provides the excellent SimcirJS project (https://kazuhikoarase.github.io/simcirjs/) as a YUI module.
* Copyright (c) 2014 Kazuhiko Arase
* URL: http://www.d-project.com/
* Licensed under the MIT license:
*  http://www.opensource.org/licenses/mit-license.php
*/
define(['jquery'], function($) { 

M.mod_circuits = M.mod_circuits || {};
M.mod_circuits.init = function() {
//
// SimcirJS
//
// Copyright (c) 2014 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

// includes following device types:
//  In
//  Out

M.mod_circuits.simcir = function() {

  var createSVGElement = function(tagName) {
    return $(document.createElementNS(
        'http://www.w3.org/2000/svg', tagName) );
  };

  var createSVG = function(w, h) {
    return createSVGElement('svg').attr({
      version: '1.1',
      width: w, height: h,
      viewBox: '0 0 ' + w + ' ' + h
    });
  };

  var graphics = function($target) {
    var attr = {};
    var buf = '';
    var moveTo = function(x, y) {
      buf += ' M ' + x + ' ' + y;
    };
    var lineTo = function(x, y) {
      buf += ' L ' + x + ' ' + y;
    };
    var curveTo = function(x1, y1, x, y) {
      buf += ' Q ' + x1 + ' ' + y1 + ' ' + x + ' ' + y;
    };
    var closePath = function(close) {
      if (close) {
        // really close path.
        buf += ' Z';
      }
      $target.append(createSVGElement('path').
          attr('d', buf).attr(attr) );
      buf = '';
    };
    var drawRect = function(x, y, width, height) {
      $target.append(createSVGElement('rect').
          attr({x: x, y: y, width: width, height: height}).attr(attr) );
    };
    var drawCircle = function(x, y, r) {
      $target.append(createSVGElement('circle').
          attr({cx: x, cy: y, r: r}).attr(attr) );
    };
    return {
      attr: attr,
      moveTo: moveTo,
      lineTo: lineTo,
      curveTo: curveTo,
      closePath: closePath,
      drawRect: drawRect,
      drawCircle: drawCircle
    };
  };

  var eachClass = function($o, f) {
    var className = $o.attr('class');
    if (className) {
      $.each(className.split(/\s+/g), f);
    }
  };

  var addClass = function($o, className, remove) {
    var newClass = '';
    eachClass($o, function(i, c) {
      if (!(remove && c == className) ) {
        newClass += '\u0020';
        newClass += c;
      }
    });
    if (!remove) {
      newClass += '\u0020';
      newClass += className;
    }
    $o.attr('class', newClass);
    return $o;
  };

  var removeClass = function($o, className) {
    return addClass($o, className, true);
  };

  var hasClass = function($o, className) {
    var found = false;
    eachClass($o, function(i, c) {
      if (c == className) {
        found = true;
      }
    });
    return found;
  };

  var transform = function() {
    var attrX = 'simcir-transform-x';
    var attrY = 'simcir-transform-y';
    var attrRotate = 'simcir-transform-rotate';
    var num = function($o, k) {
      var v = $o.attr(k);
      return v? +v : 0;
    };
    return function($o, x, y, rotate) {
      if (arguments.length >= 3) {
        var transform = 'translate(' + x + ' ' + y + ')';
        if (rotate) {
          transform += ' rotate(' + rotate + ')';
        }
        $o.attr('transform', transform);
        $o.attr(attrX, x);
        $o.attr(attrY, y);
        $o.attr(attrRotate, rotate);
      } else if (arguments.length == 1) {
        return {x: num($o, attrX), y: num($o, attrY),
          rotate: num($o, attrRotate)};
      }
    };
  }();

  var offset = function($o) {
    var x = 0;
    var y = 0;
    while ($o[0].nodeName != 'svg') {
      var pos = transform($o);
      x += pos.x;
      y += pos.y;
      $o = $o.parent();
    }
    return {x: x, y: y};
  };

  var enableEvents = function($o, enable) {
    $o.css('pointer-events', enable? 'visiblePainted' : 'none');
  };

  var disableSelection = function($o) {
    $o.each(function() {
      this.onselectstart = function() { return false; };
    }).css('-webkit-user-select', 'none');
  };

  var controller = function() {
    var id = 'controller';
    return function($ui, controller) {
      if (arguments.length == 1) {
        return $.data($ui[0], id);
      } else if (arguments.length == 2) {
        $.data($ui[0], id, controller);
      }
    };
  }();

  var eventQueue = function() {
    var delay = 50; // ms
    var limit = 40; // ms
    var _queue = null;
    var postEvent = function(event) {
      if (_queue === null) {
        _queue = [];
      }
      _queue.push(event);
    };
    var dispatchEvent = function() {
      var queue = _queue;
      _queue = null;
      while (queue.length > 0) {
        var e = queue.shift();
        e.target.trigger(e.type);
      }
    };
    var getTime = function() {
      return new Date().getTime();
    };
    var timerHandler = function() {
      var start = getTime();
      while (_queue !== null && getTime() - start < limit) {
        dispatchEvent();
      }
      window.setTimeout(timerHandler, 
        Math.max(delay - limit, delay - (getTime() - start) ) );
    };
    timerHandler();
    return {
      postEvent: postEvent
    };
  }();

  var unit = 16;
  var fontSize = 12;

  var createLabel = function(text) {
    return createSVGElement('text').
      text(text).
      css('font-size', fontSize + 'px');
  };

  var createNode = function(type, label, description, headless) {
    var $node = createSVGElement('g').
      attr('simcir-node-type', type);
    if (!headless) {
      $node.attr('class', 'simcir-node');
    }
    var node = createNodeController({
      $ui: $node, type: type, label: label,
      description: description, headless: headless});
    if (type == 'in') {
      controller($node, createInputNodeController(node) );
    } else if (type == 'out') {
      controller($node, createOutputNodeController(node) );
    } else {
      throw 'unknown type:' + type;
    }
    return $node;
  };

  var isActiveNode = function($o) {
    return $o.closest('.simcir-node').length == 1 &&
      $o.closest('.simcir-toolbox').length === 0;
  };

  var createNodeController = function(node) {
    var _value = null;
    var setValue = function(value, force) {
      if (_value === value && !force) {
        return;
      }
      _value = value;
      eventQueue.postEvent({target: node.$ui, type: 'nodeValueChange'});
    };
    var getValue = function() {
      return _value;
    };

    if (!node.headless) {

      node.$ui.attr('class', 'simcir-node simcir-node-type-' + node.type);

      var $circle = createSVGElement('circle').
        attr({cx: 0, cy: 0, r: 4});
      node.$ui.on('mouseover', function(event) {
        if (isActiveNode(node.$ui) ) {
          addClass(node.$ui, 'simcir-node-hover');
        }
      });
      node.$ui.on('mouseout', function(event) {
        if (isActiveNode(node.$ui) ) {
          removeClass(node.$ui, 'simcir-node-hover');
        }
      });
      node.$ui.append($circle);
      var appendLabel = function(text, align) {
        var $label = createLabel(text).
          attr('class', 'simcir-node-label');
        enableEvents($label, false);
        if (align == 'right') {
          $label.attr('text-anchor', 'start').
            attr('x', 6).
            attr('y', fontSize / 2);
        } else if (align == 'left') {
          $label.attr('text-anchor', 'end').
            attr('x', -6).
            attr('y', fontSize / 2);
        }
        node.$ui.append($label);
      };
      if (node.label) {
        if (node.type == 'in') {
          appendLabel(node.label, 'right');
        } else if (node.type == 'out') {
          appendLabel(node.label, 'left');
        }
      }
      if (node.description) {
        if (node.type == 'in') {
          appendLabel(node.description, 'left');
        } else if (node.type == 'out') {
          appendLabel(node.description, 'right');
        }
      }
      node.$ui.on('nodeValueChange', function(event) {
        if (_value !== null) {
          addClass(node.$ui, 'simcir-node-hot');
        } else {
          removeClass(node.$ui, 'simcir-node-hot');
        }
      });
    }

    return $.extend(node, {
      setValue: setValue,
      getValue: getValue
    });
  };

  var createInputNodeController = function(node) {
    var output = null;
    var setOutput = function(outNode) {
      output = outNode;
    };
    var getOutput = function() {
      return output;
    };
    return $.extend(node, {
      setOutput: setOutput,
      getOutput: getOutput
    });
  };

  var createOutputNodeController = function(node) {
    var inputs = [];
    var super_setValue = node.setValue;
    var setValue = function(value) {
      super_setValue(value);
      $.each(inputs, function(i, inputNode) {
        inputNode.setValue(value);
      });
    };
    var connectTo = function(inNode) {
      if (inNode.getOutput() !== null) {
        inNode.getOutput().disconnectFrom(inNode);
      }
      inNode.setOutput(node);
      inputs.push(inNode);
      inNode.setValue(node.getValue(), true);
    };
    var disconnectFrom = function(inNode) {
      if (inNode.getOutput() != node) {
        throw 'not connected.';
      }
      inNode.setOutput(null);
      inNode.setValue(null, true);
      inputs = $.grep(inputs, function(v) {
        return v != inNode;
      });
    };
    var getInputs = function() {
      return inputs;
    };
    return $.extend(node, {
      setValue: setValue,
      getInputs: getInputs,
      connectTo: connectTo,
      disconnectFrom: disconnectFrom
    });
  };

  var createDevice = function(deviceDef, headless) {
    headless = headless || false;
    var $dev = createSVGElement('g');
    if (!headless) {
      $dev.attr('class', 'simcir-device');
    }
    controller($dev, createDeviceController(
        {$ui: $dev, deviceDef: deviceDef,
          headless: headless, doc: null}) );
    var factory = factories[deviceDef.type];
    if (factory) {
      factory(controller($dev) );
    }
    if (!headless) {
      controller($dev).createUI();
    }
    return $dev;
  };

  var createDeviceController = function(device) {
    var inputs = [];
    var outputs = [];
    var addInput = function(label, description) {
      var $node = createNode('in', label, description, device.headless);
      $node.on('nodeValueChange', function(event) {
        device.$ui.trigger('inputValueChange');
      });
      if (!device.headless) {
        device.$ui.append($node);
      }
      var node = controller($node);
      inputs.push(node);
      return node;
    };
    var addOutput = function(label, description) {
      var $node = createNode('out', label, description, device.headless);
      if (!device.headless) {
        device.$ui.append($node);
      }
      var node = controller($node);
      outputs.push(node);
      return node;
    };
    var getInputs = function() {
      return inputs;
    };
    var getOutputs = function() {
      return outputs;
    };
    var disconnectAll = function() {
      $.each(getInputs(), function(i, inNode) {
        var outNode = inNode.getOutput();
        if (outNode !== null) {
          outNode.disconnectFrom(inNode);
        }
      });
      $.each(getOutputs(), function(i, outNode) {
        $.each(outNode.getInputs(), function(i, inNode) {
          outNode.disconnectFrom(inNode);
        });
      });
    };

    var selected = false;
    var setSelected = function(value) {
      selected = value;
      device.$ui.trigger('deviceSelect');
    };
    var isSelected = function() {
      return selected;
    };

    var label = device.deviceDef.label;
    var defaultLabel = device.deviceDef.type;
    if (typeof label == 'undefined') {
      label = defaultLabel;
    }
    var setLabel = function(value) {
      value = value.replace(/^\s+|\s+$/g, '');
      label = value || defaultLabel;
      device.$ui.trigger('deviceLabelChange');
    };
    var getLabel = function() {
      return label;
    };

    var getSize = function() {
      var nodes = Math.max(device.getInputs().length,
          device.getOutputs().length);
      return { width: unit * 2,
        height: unit * Math.max(2, device.halfPitch?
            (nodes + 1) / 2 : nodes)};
    };

    var layoutUI = function() {

      var size = device.getSize();
      var w = size.width;
      var h = size.height;

      device.$ui.children('.simcir-device-body').
        attr({x: 0, y: 0, width: w, height: h});

	      var pitch = device.halfPitch? unit / 2 : unit;
	      var layoutNodes = function(nodes, x) {
		var offset = (h - pitch * (nodes.length - 1) ) / 2;
		$.each(nodes, function(i, node) {
		  transform(node.$ui, x, pitch * i + offset);
		});
	      };
	      layoutNodes(getInputs(), 0);
	      layoutNodes(getOutputs(), w);

	      device.$ui.children('.simcir-device-label').
		attr({x: w / 2, y: h + fontSize});
	    };

	    var createUI = function() {

	      device.$ui.attr('class', 'simcir-device');
	      device.$ui.on('deviceSelect', function() {
		if (selected) {
		  addClass($(this), 'simcir-device-selected');
		} else {
		  removeClass($(this), 'simcir-device-selected');
		}
	      });

	      var $body = createSVGElement('rect').
		attr('class', 'simcir-device-body').
		attr('rx', 2).attr('ry', 2);
	      device.$ui.prepend($body);

	      var $label = createLabel(label).
		attr('class', 'simcir-device-label').
		attr('text-anchor', 'middle');
	      device.$ui.on('deviceLabelChange', function() {
		$label.text(getLabel() );
	      });

	      var label_dblClickHandler = function() {
		// open library,
		event.preventDefault();
		event.stopPropagation();
		var title = 'Enter device name ';
		var $labelEditor = $('<input type="text"/>').
		  addClass('simcir-label-editor').
		  val($label.text() ).
		  on('keydown', function(event) {
		    if (event.keyCode == 13) {
		      // ENTER
		      setLabel($(this).val() );
		      $dlg.remove();
		    } else if (event.keyCode == 27) {
		      // ESC
		      $dlg.remove();
		    }
		  } );
		var $placeHolder = $('<div></div>').
		  append($labelEditor);
		var $dlg = showDialog(title, $placeHolder);
		$labelEditor.focus();
	      };
	      device.$ui.on('deviceAdd', function() {
		$label.on('dblclick', label_dblClickHandler);
	      } );
	      device.$ui.on('deviceRemove', function() {
		$label.off('dblclick', label_dblClickHandler);
	      } );
	      device.$ui.append($label);

	      layoutUI();

	    };

	    return $.extend(device, {
	      addInput: addInput,
	      addOutput: addOutput,
	      getInputs: getInputs,
	      getOutputs: getOutputs,
	      disconnectAll: disconnectAll,
	      setSelected: setSelected,
	      isSelected: isSelected,
	      getLabel: getLabel,
	      setLabel: setLabel,
	      halfPitch: false,
	      getSize: getSize,
	      createUI: createUI,
	      layoutUI: layoutUI
	    });
	  };

	  var createConnector = function(x1, y1, x2, y2) {
	    return createSVGElement('path').
	      attr('d', 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2).
	      attr('class', 'simcir-connector');
	  };

	  var connect = function($node1, $node2) {
	    var type1 = $node1.attr('simcir-node-type');
	    var type2 = $node2.attr('simcir-node-type');
	    if (type1 == 'in' && type2 == 'out') {
	      controller($node2).connectTo(controller($node1) );
	    } else if (type1 == 'out' && type2 == 'in') {
	      controller($node1).connectTo(controller($node2) );
	    }
	  };

	  var buildCircuit = function(data, headless) {
	    var $devices = [];
	    var $devMap = {};
	    var getNode = function(path) {
	      if (!path.match(/^(\w+)\.(in|out)([0-9]+)$/g) ) {
		throw 'unknown path:' + path;
	      }
	      var devId = RegExp.$1;
	      var type = RegExp.$2;
	      var index = +RegExp.$3;
	      return (type == 'in')?
		controller($devMap[devId]).getInputs()[index] :
		controller($devMap[devId]).getOutputs()[index];
	    };
	    $.each(data.devices, function(i, deviceDef) {
	      var $dev = createDevice(deviceDef, headless);
	      transform($dev, deviceDef.x, deviceDef.y);
	      $devices.push($dev);
	      $devMap[deviceDef.id] = $dev;
	    });
	    $.each(data.connectors, function(i, conn) {
	      var nodeFrom = getNode(conn.from);
	      var nodeTo = getNode(conn.to);
	      if (nodeFrom && nodeTo) {
		connect(nodeFrom.$ui, nodeTo.$ui);
	      }
	    });
	    return $devices;
	  };

	  var showDialog = function(title, $content) {
	    var $closeButton = function() {
	      var r = 16;
	      var pad = 4;
	      var $btn = createSVG(r, r).
		attr('class', 'simcir-dialog-close-button');
	      var g = graphics($btn);
	      g.drawRect(0, 0, r, r);
	      g.attr['class'] = 'simcir-dialog-close-button-symbol';
	      g.moveTo(pad, pad);
	      g.lineTo(r - pad, r - pad);
	      g.closePath();
	      g.moveTo(r - pad, pad);
	      g.lineTo(pad, r - pad);
	      g.closePath();
	      return $btn;
	    }();
	    var $title = $('<div></div>').
	      addClass('simcir-dialog-title').
	      text(title).
	      css('cursor', 'default').
	      on('mousedown', function(event) {
	      event.preventDefault();
	    });
	    var $dlg = $('<div></div>').
	      addClass('simcir-dialog').
	      css({position:'absolute'}).
	      append($title.css('float', 'left') ).
	      append($closeButton.css('float', 'right') ).
	      append($('<br/>').css('clear', 'both') ).
	      append($content);
	    $('BODY').append($dlg);
	    var dragPoint = null;
	    var dlg_mouseDownHandler = function(event) {
	      if (!$(event.target).hasClass('simcir-dialog') &&
		  !$(event.target).hasClass('simcir-dialog-title') ) {
		return;
	      }
	      event.preventDefault();
	      $dlg.detach();
	      $('BODY').append($dlg);
	      var off = $dlg.offset();
	      dragPoint = {
		x: event.pageX - off.left,
		y: event.pageY - off.top};
	      $(document).on('mousemove', dlg_mouseMoveHandler);
	      $(document).on('mouseup', dlg_mouseUpHandler);
	    };
	    var dlg_mouseMoveHandler = function(event) {
	      moveTo(
		  event.pageX - dragPoint.x,
		  event.pageY - dragPoint.y);
	    };
	    var dlg_mouseUpHandler = function(event) {
	      $(document).off('mousemove', dlg_mouseMoveHandler);
	      $(document).off('mouseup', dlg_mouseUpHandler);
	    };
	    $dlg.on('mousedown', dlg_mouseDownHandler);
	    $closeButton.on('mousedown', function() {
	      $dlg.remove();
	    });
	    var w = $dlg.width();
	    var h = $dlg.height();
	    var cw = $(window).width();
	    var ch = $(window).height();
	    var x = (cw - w) / 2 + $(document).scrollLeft();
	    var y = (ch - h) / 2 + $(document).scrollTop();
	    var moveTo = function(x, y) {
	      $dlg.css({left: x + 'px', top: y + 'px'});
	    };
	    moveTo(x, y);
	    return $dlg;
	  };

	  var createDeviceRefFactory = function(data) {
	    return function(device) {
	      var $devs = buildCircuit(data, true);
	      var $ports = [];
	      $.each($devs, function(i, $dev) {
		var deviceDef = controller($dev).deviceDef;
		if (deviceDef.type == 'In' || deviceDef.type == 'Out') {
		  $ports.push($dev);
		}
	      });
	      $ports.sort(function($p1, $p2) {
		var x1 = controller($p1).deviceDef.x;
		var y1 = controller($p1).deviceDef.y;
		var x2 = controller($p2).deviceDef.x;
		var y2 = controller($p2).deviceDef.y;
		if (x1 == x2) {
		  return (y1 < y2)? -1 : 1;
		}
		return (x1 < x2)? -1 : 1;
	      });
	      var getDesc = function(port) {
		return port? port.description : '';
	      };
	      var someDesc = false;
	      $.each($ports, function(i, $port) {
		var port = controller($port);
		var portDef = port.deviceDef;
		var inPort;
		var outPort;
		if (portDef.label) {
		  someDesc = true;
		}
		if (portDef.type == 'In') {
		  outPort = port.getOutputs()[0];
		  inPort = device.addInput(portDef.label,
		      getDesc(outPort.getInputs()[0]) );
		  // force disconnect test devices that connected to In-port
		  var inNode = port.getInputs()[0];
		  if (inNode.getOutput() !== null) {
		    inNode.getOutput().disconnectFrom(inNode);
		  }
		} else if (portDef.type == 'Out') {
		  inPort = port.getInputs()[0];
		  outPort = device.addOutput(portDef.label,
		      getDesc(inPort.getOutput() ) );
		  // force disconnect test devices that connected to Out-port
		  var outNode = port.getOutputs()[0];
		  $.each(outNode.getInputs(), function(i, inNode) {
		    if (inNode.getOutput() !== null) {
		      inNode.getOutput().disconnectFrom(inNode);
		    }
		  } );
		}
		inPort.$ui.on('nodeValueChange', function() {
		  outPort.setValue(inPort.getValue() );
		});
	      });
	      var super_getSize = device.getSize;
	      device.getSize = function() {
		var size = super_getSize();
		return {width: unit * (someDesc?4:2), height: size.height};
	      };
	      device.$ui.on('dblclick', function(event) {
		// open library,
		event.preventDefault();
		event.stopPropagation();
		showDialog(device.deviceDef.label || device.deviceDef.type,
		    setupSimcir($('<div></div>'), data) );
	      });
	    };
	  };

	  var factories = {};
	  var defaultToolbox = [];
	  var registerDevice = function(type, factory) {
	    if (typeof factory == 'object') {
	      factory = createDeviceRefFactory(factory);
	    }
	    factories[type] = factory;
	    defaultToolbox.push({type: type});
	  };

	  var createScrollbar = function() {

	    // vertical only.
	    var _value = 0;
	    var _min = 0;
	    var _max = 0;
	    var _barSize = 0;
	    var _width = 0;
	    var _height = 0;

	    var $body = createSVGElement('rect');
	    var $bar = createSVGElement('g').
	      append(createSVGElement('rect') ).
	      attr('class', 'simcir-scrollbar-bar');
	    var $scrollbar = createSVGElement('g').
	      attr('class', 'simcir-scrollbar').
	      append($body).append($bar);

	    var dragPoint = null;
	    var bar_mouseDownHandler = function(event) {
	      event.preventDefault();
	      event.stopPropagation();
	      var pos = transform($bar);
	      dragPoint = {
		  x: event.pageX - pos.x,
		  y: event.pageY - pos.y};
	      $(document).on('mousemove', bar_mouseMoveHandler);
	      $(document).on('mouseup', bar_mouseUpHandler);
	    };
	    var bar_mouseMoveHandler = function(event) {
	      calc(function(unitSize) {
		setValues( (event.pageY - dragPoint.y) /
		    unitSize, _min, _max, _barSize);
	      });
	    };
	    var bar_mouseUpHandler = function(event) {
	      $(document).off('mousemove', bar_mouseMoveHandler);
	      $(document).off('mouseup', bar_mouseUpHandler);
	    };
	    $bar.on('mousedown', bar_mouseDownHandler);
	    var body_mouseDownHandler = function(event) {
	      event.preventDefault();
	      event.stopPropagation();
	      var off = $scrollbar.parents('svg').offset();
	      var pos = transform($scrollbar);
	      var y = event.pageY - off.top - pos.y;
	      var barPos = transform($bar);
	      if (y < barPos.y) {
		setValues(_value - _barSize, _min, _max, _barSize);
	      } else {
		setValues(_value + _barSize, _min, _max, _barSize);
	      }
	    };
	    $body.on('mousedown', body_mouseDownHandler);

	    var setSize = function(width, height) {
	      _width = width;
	      _height = height;
	      layout();
	    };
	    var layout = function() {

	      $body.attr({x: 0, y: 0, width: _width, height: _height});

	      var visible = _max - _min > _barSize;
	      $bar.css('display', visible? 'inline' : 'none');
	      if (!visible) {
		return;
	      }
	      calc(function(unitSize) {
		$bar.children('rect').
		  attr({x: 0, y: 0, width: _width, height: _barSize * unitSize});
		transform($bar, 0, _value * unitSize);
	      });
	    };
	    var calc = function(f) {
	      f(_height / (_max - _min) );
	    };
	    var setValues = function(value, min, max, barSize) {
	      value = Math.max(min, Math.min(value, max - barSize) );
	      var changed = (value != _value);
	      _value = value;
	      _min = min;
	      _max = max;
	      _barSize = barSize;
	      layout();
	      if (changed) {
		$scrollbar.trigger('scrollValueChange');
	      }
	    };
	    var getValue = function() {
	      return _value;
	    };
	    controller($scrollbar, {
	      setSize: setSize,
	      setValues: setValues,
	      getValue: getValue
	    });
	    return $scrollbar;
	  };

	  var getUniqueId = function() {
	    var uniqueIdCount = 0;
	    return function() {
	      return 'simcir-id' + uniqueIdCount++;
	    };
	  }();

	  var createWorkspace = function(data) {

	    data = $.extend({
	      width: 400,
	      height: 200,
	      showToolbox: true,
	      toolbox: defaultToolbox,
	      devices: [],
	      connectors: [],
	    }, data);

	    var workspaceWidth = data.width;
	    var workspaceHeight = data.height;
	    var barWidth = unit;
	    var toolboxWidth = data.showToolbox? unit * 6 + barWidth : 0;

	    var $workspace = createSVG(
		workspaceWidth, workspaceHeight).
	      attr('class', 'simcir-workspace');
	    disableSelection($workspace);

	    var $defs = createSVGElement('defs');
	    $workspace.append($defs);

	    !function() {

	      // fill with pin hole pattern.
	      var patId = getUniqueId();
	      var pitch = unit / 2;
	      var w = workspaceWidth - toolboxWidth;
	      var h = workspaceHeight;

	      $defs.append(createSVGElement('pattern').
		  attr({id: patId, x: 0, y: 0,
		    width: pitch / w, height: pitch / h}).append(
		    createSVGElement('rect').attr('class', 'simcir-pin-hole').
		    attr({x: 0, y: 0, width: 1, height: 1}) ) );

	      $workspace.append(createSVGElement('rect').
		  attr({x: toolboxWidth, y: 0, width: w, height: h}).
		  css({fill: 'url(#' + patId + ')'}) );
	    }();

	    var $toolboxDevicePane = createSVGElement('g');
	    var $scrollbar = createScrollbar();
	    $scrollbar.on('scrollValueChange', function(event) {
	      transform($toolboxDevicePane, 0,
		  -controller($scrollbar).getValue() );
	    });
	    controller($scrollbar).setSize(barWidth, workspaceHeight);
	    transform($scrollbar, toolboxWidth - barWidth, 0);
	    var $toolboxPane = createSVGElement('g').
	      attr('class', 'simcir-toolbox').
	      append(createSVGElement('rect').
		attr({x: 0, y: 0,
		  width: toolboxWidth,
		  height: workspaceHeight}) ).
	      append($toolboxDevicePane).
	      append($scrollbar);

	    var $devicePane = createSVGElement('g');
	    transform($devicePane, toolboxWidth, 0);
	    var $connectorPane = createSVGElement('g');
	    var $temporaryPane = createSVGElement('g');

	    enableEvents($connectorPane, false);
	    enableEvents($temporaryPane, false);

	    if (data.showToolbox) {
	      $workspace.append($toolboxPane);
	    }
	    $workspace.append($devicePane);
	    $workspace.append($connectorPane);
	    $workspace.append($temporaryPane);

	    var addDevice = function($dev) {
	      $devicePane.append($dev);
	      $dev.trigger('deviceAdd');
	    };

	    var removeDevice = function($dev) {
	      $dev.trigger('deviceRemove');
	      // before remove, disconnect all
	      controller($dev).disconnectAll();
	      $dev.remove();
	      updateConnectors();
	    };

	    var disconnect = function($inNode) {
	      var inNode = controller($inNode);
	      if (inNode.getOutput() !== null) {
		inNode.getOutput().disconnectFrom(inNode);
	      }
	      updateConnectors();
	    };

	    var updateConnectors = function() {
	      $connectorPane.children().remove();
	      $devicePane.children('.simcir-device').each(function() {
		var device = controller($(this) );
		$.each(device.getInputs(), function(i, inNode) {
		  if (inNode.getOutput() !== null) {
		    var p1 = offset(inNode.$ui);
		    var p2 = offset(inNode.getOutput().$ui);
		    $connectorPane.append(
			createConnector(p1.x, p1.y, p2.x, p2.y) );
		  }
		});
	      });
	    };

	    var loadToolbox = function(data) {
	      var vgap = 8;
	      var y = vgap;
	      $.each(data.toolbox, function(i, deviceDef) {
		var $dev = createDevice(deviceDef);
		$toolboxDevicePane.append($dev);
		var size = controller($dev).getSize();
		transform($dev, (toolboxWidth - barWidth - size.width) / 2, y);
		y += (size.height + fontSize + vgap);
	      });
	      controller($scrollbar).setValues(0, 0, y, workspaceHeight);
	    };

	    var getData = function() {

	      // renumber all id
	      var devIdCount = 0;
	      $devicePane.children('.simcir-device').each(function() {
		var $dev = $(this);
		var device = controller($dev);
		var devId = 'dev' + devIdCount++;
		device.id = devId;
		$.each(device.getInputs(), function(i, node) {
		  node.id = devId + '.in' + i;
		});
		$.each(device.getOutputs(), function(i, node) {
		  node.id = devId + '.out' + i;
		});
	      });

	      var toolbox = [];
	      var devices = [];
	      var connectors = [];
	      var clone = function(obj) {
		return JSON.parse(JSON.stringify(obj) );
	      };
	      $toolboxDevicePane.children('.simcir-device').each(function() {
		var $dev = $(this);
		var device = controller($dev);
		toolbox.push(device.deviceDef);
	      });
	      $devicePane.children('.simcir-device').each(function() {
		var $dev = $(this);
		var device = controller($dev);
		$.each(device.getInputs(), function(i, inNode) {
		  if (inNode.getOutput() !== null) {
		    connectors.push({from:inNode.id, to:inNode.getOutput().id});
		  }
		});
		var pos = transform($dev);
		var deviceDef = clone(device.deviceDef);
		deviceDef.id = device.id;
		deviceDef.x = pos.x;
		deviceDef.y = pos.y;
		deviceDef.label = device.getLabel();
		devices.push(deviceDef);
	      });
	      return {
		width: data.width,
		height: data.height,
		showToolbox: data.showToolbox,
		toolbox: toolbox,
		devices: devices,
		connectors: connectors
	      };
	    };
	    var getText = function() {

	      var data = getData();

	      var buf = '';
	      var print = function(s) {
		buf += s;
	      };
	      var println = function(s) {
		print(s);
		buf += '\r\n';
	      };
	      var printArray = function(array) {
		$.each(array, function(i, item) {
		  println('    ' + JSON.stringify(item) +
		      (i + 1 < array.length? ',' : '') );
		});
	      };
	      println('{');
	      println('  "width":' + data.width + ',');
	      println('  "height":' + data.height + ',');
	      println('  "showToolbox":' + data.showToolbox + ',');
	      println('  "toolbox":[');
	      printArray(data.toolbox);
	      println('  ],');
	      println('  "devices":[');
	      printArray(data.devices);
	      println('  ],');
	      println('  "connectors":[');
	      printArray(data.connectors);
	      println('  ]');
	      print('}');
	      return buf;
	    };

	    //-------------------------------------------
	    // mouse operations

	    var dragMoveHandler = null;
	    var dragCompleteHandler = null;

	    var adjustDevice = function($dev) {
	      var pitch = unit / 2;
	      var adjust = function(v) { return Math.round(v / pitch) * pitch; };
	      var pos = transform($dev);
	      var size = controller($dev).getSize();
	      var x = Math.max(0, Math.min(pos.x,
		  workspaceWidth - toolboxWidth - size.width) );
	      var y = Math.max(0, Math.min(pos.y,
		  workspaceHeight - size.height) );
	      transform($dev, adjust(x), adjust(y) );
	    };

	    var beginConnect = function(event, $target) {
	      var $srcNode = $target.closest('.simcir-node');
	      var off = $workspace.offset();
	      var pos = offset($srcNode);
	      if ($srcNode.attr('simcir-node-type') == 'in') {
		disconnect($srcNode);
	      }
	      dragMoveHandler = function(event) {
		var x = event.pageX - off.left;
		var y = event.pageY - off.top;
		$temporaryPane.children().remove();
		$temporaryPane.append(createConnector(pos.x, pos.y, x, y) );
	      };
	      dragCompleteHandler = function(event) {
		$temporaryPane.children().remove();
		var $dst = $(event.target);
		if (isActiveNode($dst) ) {
		  var $dstNode = $dst.closest('.simcir-node');
		  connect($srcNode, $dstNode);
		  updateConnectors();
		}
	      };
	    };

	    var beginNewDevice = function(event, $target) {
	      var $dev = $target.closest('.simcir-device');
	      var pos = offset($dev);
	      $dev = createDevice(controller($dev).deviceDef);
	      transform($dev, pos.x, pos.y);
	      $temporaryPane.append($dev);
	      var dragPoint = {
		x: event.pageX - pos.x,
		y: event.pageY - pos.y};
	      dragMoveHandler = function(event) {
		transform($dev,
		    event.pageX - dragPoint.x,
		    event.pageY - dragPoint.y);
	      };
	      dragCompleteHandler = function(event) {
		var $target = $(event.target);
		if ($target.closest('.simcir-toolbox').length === 0) {
		  $dev.detach();
		  var pos = transform($dev);
		  transform($dev, pos.x - toolboxWidth, pos.y);
		  adjustDevice($dev);
		  addDevice($dev);
		} else {
		  $dev.remove();
		}
	      };
	    };

	    var $selectedDevices = [];
	    var addSelected = function($dev) {
	      controller($dev).setSelected(true);
	      $selectedDevices.push($dev);
	    };
	    var deselectAll = function() {
	      $devicePane.children('.simcir-device').each(function() {
		controller($(this) ).setSelected(false);
	      });
	      $selectedDevices = [];
	    };

	    var beginMoveDevice = function(event, $target) {
	      var $dev = $target.closest('.simcir-device');
	      var pos = transform($dev);
	      if (!controller($dev).isSelected() ) {
		deselectAll();
		addSelected($dev);
		// to front.
		$dev.parent().append($dev.detach() );
	      }

	      var dragPoint = {
		x: event.pageX - pos.x,
		y: event.pageY - pos.y};
	      dragMoveHandler = function(event) {
		// disable events while dragging.
		enableEvents($dev, false);
		var curPos = transform($dev);
		var deltaPos = {
		  x: event.pageX - dragPoint.x - curPos.x,
		  y: event.pageY - dragPoint.y - curPos.y};
		$.each($selectedDevices, function(i, $dev) {
		  var curPos = transform($dev);
		  transform($dev,
		      curPos.x + deltaPos.x,
		      curPos.y + deltaPos.y);
		});
		updateConnectors();
	      };
	      dragCompleteHandler = function(event) {
		var $target = $(event.target);
		enableEvents($dev, true);
		$.each($selectedDevices, function(i, $dev) {
		  if ($target.closest('.simcir-toolbox').length === 0) {
		    adjustDevice($dev);
		    updateConnectors();
		  } else {
		    removeDevice($dev);
		  }
		});
	      };
	    };

	    var beginSelectDevice = function(event, $target) {
	      var intersect = function(rect1, rect2) {
		return !(
		    rect1.x > rect2.x + rect2.width ||
		    rect1.y > rect2.y + rect2.height ||
		    rect1.x + rect1.width < rect2.x ||
		    rect1.y + rect1.height < rect2.y);
	      };
	      var pointToRect = function(p1, p2) {
		return {
		  x: Math.min(p1.x, p2.x),
		  y: Math.min(p1.y, p2.y),
		  width: Math.abs(p1.x - p2.x),
		  height: Math.abs(p1.y - p2.y)};
	      };
	      deselectAll();
	      var off = $workspace.offset();
	      var pos = offset($devicePane);
	      var p1 = {x: event.pageX - off.left, y: event.pageY - off.top};
	      dragMoveHandler = function(event) {
		deselectAll();
		var p2 = {x: event.pageX - off.left, y: event.pageY - off.top};
		var selRect = pointToRect(p1, p2);
		$devicePane.children('.simcir-device').each(function() {
		  var $dev = $(this);
		  var devPos = transform($dev);
		  var devSize = controller($dev).getSize();
		  var devRect = {
		      x: devPos.x + pos.x,
		      y: devPos.y + pos.y,
		      width: devSize.width,
		      height: devSize.height};
		  if (intersect(selRect, devRect) ) {
		    addSelected($dev);
		  }
		});
		$temporaryPane.children().remove();
		$temporaryPane.append(createSVGElement('rect').
		    attr(selRect).
		    attr('class', 'simcir-selection-rect') );
	      };
	    };

	    var mouseDownHandler = function(event) {
	      event.preventDefault();
	      event.stopPropagation();
	      var $target = $(event.target);
	      if (isActiveNode($target) ) {
		beginConnect(event, $target);
	      } else if ($target.closest('.simcir-device').length == 1) {
		if ($target.closest('.simcir-toolbox').length == 1) {
		  beginNewDevice(event, $target);
		} else {
		  beginMoveDevice(event, $target);
		}
	      } else {
		beginSelectDevice(event, $target);
	      }
	      $(document).on('mousemove', mouseMoveHandler);
	      $(document).on('mouseup', mouseUpHandler);
	    };
	    var mouseMoveHandler = function(event) {
	      if (dragMoveHandler !== null) {
		dragMoveHandler(event);
	      }
	    };
	    var mouseUpHandler = function(event) {
	      if (dragCompleteHandler !== null) {
		dragCompleteHandler(event);
	      }
	      dragMoveHandler = null;
	      dragCompleteHandler = null;
	      $devicePane.children('.simcir-device').each(function() {
		enableEvents($(this), true);
	      });
	      $temporaryPane.children().remove();
	      $(document).off('mousemove', mouseMoveHandler);
	      $(document).off('mouseup', mouseUpHandler);
	    };
	    $workspace.on('mousedown', mouseDownHandler);

	    //-------------------------------------------
	    //

	    loadToolbox(data);
	    $.each(buildCircuit(data, false), function(i, $dev) {
	      addDevice($dev);
	    });
	    updateConnectors();

	    controller($workspace, {
	      data: getData,
	      text: getText
	    });

	    return $workspace;
	  };

	  var createPortFactory = function(type) {
	    return function(device) {
	      var in1 = device.addInput();
	      var out1 = device.addOutput();
	      device.$ui.on('inputValueChange', function() {
		out1.setValue(in1.getValue() );
	      });
	      var super_createUI = device.createUI;
	      device.createUI = function() {
		super_createUI();
		var size = device.getSize();
		var cx = size.width / 2;
		var cy = size.height / 2;
		device.$ui.append(createSVGElement('circle').
		  attr({cx: cx, cy: cy, r: unit / 2}).
		  attr('class', 'simcir-port simcir-node-type-' + type) );
		device.$ui.append(createSVGElement('circle').
		  attr({cx: cx, cy: cy, r: unit / 4}).
		  attr('class', 'simcir-port-hole') );
	      };
	    };
	  };
	  // register built-in devices
	  registerDevice('In', createPortFactory('in') );
	  registerDevice('Out', createPortFactory('out') );

	var createInvisibleInPortFactory = function() {
	    return function(device) {
		var in1 = device.addInput();
	      device.$ui.on('inputValueChange', function() {
		out1.setValue(in1.getValue() );
	      });
	      var super_createUI = device.createUI;
	      device.createUI = function() {
		super_createUI();
		var size = device.getSize();
		var cx = size.width / 2;
		var cy = size.height / 2;
		device.$ui.append(createSVGElement('circle').
		  attr({cx: cx, cy: cy, r: unit / 2}).
		  attr('class', 'simcir-port simcir-node-type-' + type) );
		device.$ui.append(createSVGElement('circle').
		  attr({cx: cx, cy: cy, r: unit / 4}).
		  attr('class', 'simcir-port-hole') );
	      };
	    };
	  };

	  var setupSimcir = function($placeHolder, data) {
	    var $workspace = createWorkspace(data);
	    var $dataArea = $('<textarea></textarea>').
	      addClass('simcir-json-data-area').
	      attr('readonly', 'readonly').
	      css('width', $workspace.attr('width') + 'px').
	      css('height', $workspace.attr('height') + 'px');
	    var showData = false;
	    var toggle = function() {
	      $workspace.css('display', !showData? 'inline' : 'none');
	      $dataArea.css('display', showData? 'inline' : 'none');
	      if (showData) {
		$dataArea.val(controller($workspace).text() ).focus();
	      }
	      showData = !showData;
	    };
	    $placeHolder.text('');
	    $placeHolder.append($('<div></div>').
		addClass('simcir-body').
		append($workspace).
		append($dataArea).
		on('click', function(event) {
		  if (event.ctrlKey || event.metaKey) {
		    toggle();
		  }
		}));
	    toggle();
	    return $placeHolder;
	  };

	  var setupSimcirDoc = function($placeHolder) {
	    var $table = $('<table><tbody></tbody></table>').
	      addClass('simcir-doc-table');
	    $.each(defaultToolbox, function(i, deviceDef) {
	      var $dev = createDevice(deviceDef);
	      var device = controller($dev);
	      if (!device.doc) {
		return;
	      }
	      var doc = $.extend({description: '', params: []},device.doc);
	      var size = device.getSize();

	      var $tr = $('<tr></tr>');
	      var hgap = 32;
	      var vgap = 8;
	      var $view = createSVG(size.width + hgap * 2,
		  size.height + vgap * 2 + fontSize);
	      transform($dev, hgap, vgap);

	      $view.append($dev);
	      $tr.append($('<td></td>').css('text-align', 'center').append($view) );
	      var $desc = $('<td></td>');
	      $tr.append($desc);

	      if (doc.description) {
		$desc.append($('<span></span>').
		    text(doc.description) );
	      }

	      if (doc.params.length > 0) {
		$desc.append($('<div>Params</div>').addClass('simcir-doc-title') );
		var $paramsTable = $('<table><tbody></tbody></table>').
		  addClass('simcir-doc-params-table');
		$paramsTable.children('tbody').append($('<tr></tr>').
		    append($('<th>Name</th>') ).
		    append($('<th>Type</th>') ).
		    append($('<th>Default</th>') ).
		    append($('<th>Description</th>') ) );
		$paramsTable.children('tbody').append($('<tr></tr>').
		    append($('<td>type</td>') ).
		    append($('<td>string</td>') ).
		    append($('<td>-</td>').
			css('text-align', 'center') ).
		    append($('<td>"' + deviceDef.type + '"</td>') ) );
		$paramsTable.children('tbody').append($('<tr></tr>').
		    append($('<td>label</td>') ).
		    append($('<td>string</td>') ).
		    append($('<td>same with type</td>').css('text-align', 'center') ).
		    append($('<td>label for a device.</td>') ) );

		$.each(doc.params, function(i, param) {
		  $paramsTable.children('tbody').append($('<tr></tr>').
		    append($('<td></td>').text(param.name) ).
		    append($('<td></td>').text(param.type) ).
		    append($('<td></td>').css('text-align', 'center').
			text(param.defaultValue) ).
		    append($('<td></td>').text(param.description) ) );
		});
		$desc.append($paramsTable);
	      }

	      if (doc.code) {
		$desc.append($('<div>Code</div>').addClass('simcir-doc-title') );
		$desc.append($('<div></div>').
		    addClass('simcir-doc-code').text(doc.code) );
	      }

	      $table.children('tbody').append($tr);
	    });

	    $placeHolder.append($table);
	  };

	/*  $(function() {
	    $('.simcir').each(function() {
	      var $placeHolder = $(this);
	      var text = $placeHolder.text().replace(/^\s+|\s+$/g, '');
	      setupSimcir($placeHolder, JSON.parse(text || '{}') );
	    });
	  });

	  $(function() {
	    $('.simcir-doc').each(function() {
	      setupSimcirDoc($(this) );
	    });
	  });
	*/
	  return {
	    registerDevice: registerDevice,
	    setupSimcir: setupSimcir,
	    createWorkspace: createWorkspace,
	    createSVGElement: createSVGElement,
	    addClass: addClass,
	    removeClass: removeClass,
	    hasClass: hasClass,
	    offset: offset,
	    transform: transform,
	    enableEvents: enableEvents,
	    graphics: graphics,
	    controller: controller,
	    unit: unit
	  };
	}();
	};
	M.mod_circuits.start = function() {

		$('.simcir').each(function() {
			var $placeHolder = $(this);
			var text = $placeHolder.text().replace(/^\s+|\s+$/g, '');
			M.mod_circuits.simcir.setupSimcir($placeHolder, JSON.parse(text || '{}') );
			this.style.visibility="visible";
		});
		$('.simcir-doc').each(function() {
			M.mod_circuits.simcir.setupSimcirDoc($(this) );
		});

	};
	M.mod_circuits.addBasicSet = function() {
	//
	// SimcirJS - basicset
	//
	// Copyright (c) 2014 Kazuhiko Arase
	//
	// URL: http://www.d-project.com/
	//
	// Licensed under the MIT license:
	//  http://www.opensource.org/licenses/mit-license.php
	//

	// includes following device types:
	//  DC
	//  LED
	//  PushOff
	//  PushOn
	//  Toggle
	//  BUF
	//  NOT
	//  AND
	//  NAND
	//  OR
	//  NOR
	//  XOR
	//  XNOR
	//  OSC
	//  7seg
	//  16seg
	//  4bit7seg
	//  RotaryEncoder
	//  BusIn
	//  BusOut

	!function() {
	  var $s = M.mod_circuits.simcir;
	  // unit size
	  var unit = $s.unit;

	  // red/black
	  var defaultLEDColor = '#ffff00';
	  var defaultLEDBgColor = '#000000';

	  var multiplyColor = function() {
	    var HEX = '0123456789abcdef';
	    var toIColor = function(sColor) {
	      if (!sColor) {
		return 0;
	      }
	      sColor = sColor.toLowerCase();
	      if (sColor.match(/^#[0-9a-f]{3}$/i) ) {
		var iColor = 0;
		for (var i = 0; i < 6; i += 1) {
		  iColor = (iColor << 4) | HEX.indexOf(sColor.charAt( (i >> 1) + 1) );
		}
		return iColor;
	      } else if (sColor.match(/^#[0-9a-f]{6}$/i) ) {
		var iColor = 0;
		for (var i = 0; i < 6; i += 1) {
		  iColor = (iColor << 4) | HEX.indexOf(sColor.charAt(i + 1) );
		}
		return iColor;
	      }
	      return 0;
	    };
	    var toSColor = function(iColor) {
	      var sColor = '#';
	      for (var i = 0; i < 6; i += 1) {
		sColor += HEX.charAt( (iColor >>> (5 - i) * 4) & 0x0f);
	      }
	      return sColor;
	    };
	    var toRGB = function(iColor) {
	      return {
		r: (iColor >>> 16) & 0xff,
		g: (iColor >>> 8) & 0xff,
		b: iColor & 0xff};
	    };
	    var multiplyColor = function(iColor1, iColor2, ratio) {
	      var c1 = toRGB(iColor1);
	      var c2 = toRGB(iColor2);
	      var mc = function(v1, v2, ratio) {
		return ~~Math.max(0, Math.min( (v1 - v2) * ratio + v2, 255) );
	      };
	      return (mc(c1.r, c2.r, ratio) << 16) |
		(mc(c1.g, c2.g, ratio) << 8) | mc(c1.b, c2.b, ratio);
	    };
	    return function(color1, color2, ratio) {
	      return toSColor(multiplyColor(
		  toIColor(color1), toIColor(color2), ratio) );
	    };
	  }();

	  // symbol draw functions
	  var drawBUF = function(g, x, y, width, height) {
	    g.moveTo(x, y);
	    g.lineTo(x + width, y + height / 2);
	    g.lineTo(x, y + height);
	    g.lineTo(x, y);
	    g.closePath(true);
	  };
	  var drawAND = function(g, x, y, width, height) {
	    g.moveTo(x, y);
	    g.curveTo(x + width, y, x + width, y + height / 2);
	    g.curveTo(x + width, y + height, x, y + height);
	    g.lineTo(x, y);
	    g.closePath(true);
	  };
	  var drawOR = function(g, x, y, width, height) {
	    var depth = width * 0.2;
	    g.moveTo(x, y);
	    g.curveTo(x + width - depth, y, x + width, y + height / 2);
	    g.curveTo(x + width - depth, y + height, x, y + height);
	    g.curveTo(x + depth, y + height, x + depth, y + height / 2);
	    g.curveTo(x + depth, y, x, y);
	    g.closePath(true);
	  };
	  var drawXOR = function(g, x, y, width, height) {
	    drawOR(g, x + 3, y, width - 3, height);
	    var depth = (width - 3) * 0.2;
	    g.moveTo(x, y + height);
	    g.curveTo(x + depth, y + height, x + depth, y + height / 2);
	    g.curveTo(x + depth, y, x, y);
	    g.closePath();
	  };
	  var drawNOT = function(g, x, y, width, height) {
	    drawBUF(g, x - 1, y, width - 2, height);
	    g.drawCircle(x + width - 1, y + height / 2, 2);
	  };
	  var drawNAND = function(g, x, y, width, height) {
	    drawAND(g, x - 1, y, width - 2, height);
	    g.drawCircle(x + width - 1, y + height / 2, 2);
	  };
	  var drawNOR = function(g, x, y, width, height) {
	    drawOR(g, x - 1, y, width - 2, height);
	    g.drawCircle(x + width - 1, y + height / 2, 2);
	  };
	  var drawXNOR = function(g, x, y, width, height) {
	    drawXOR(g, x - 1, y, width - 2, height);
	    g.drawCircle(x + width - 1, y + height / 2, 2);
	  };
	  // logical functions
	  var AND = function(a, b) { return a & b; };
	  var OR = function(a, b) { return a | b; };
	  var XOR = function(a, b) { return a ^ b; };
	  var BUF = function(a) { return (a == 1)? 1 : 0; };
	  var NOT = function(a) { return (a == 1)? 0 : 1; };

	  var onValue = 1;
	  var offValue = null;
	  var isHot = function(v) { return v !== null; };
	  var intValue = function(v) { return isHot(v)? 1 : 0; };

	  var createSwitchFactory = function(type) {
	    return function(device) {
	      var in1 = device.addInput();
	      var out1 = device.addOutput();
	      var on = (type == 'PushOff');

	      device.$ui.on('inputValueChange', function() {
		if (on) {
		  out1.setValue(in1.getValue() );
		}
	      });
	      var updateOutput = function() {
		out1.setValue(on? in1.getValue() : null);
	      };
	      updateOutput();

	      var super_createUI = device.createUI;
	      device.createUI = function() {
		super_createUI();
		var size = device.getSize();
		var $button = $s.createSVGElement('rect').
		  attr({x: size.width / 4, y: size.height / 4,
		    width: size.width / 2, height: size.height / 2,
		    rx: 2, ry: 2});
		$s.addClass($button, 'simcir-basicset-switch-button');
		device.$ui.append($button);
		var button_mouseDownHandler = function(event) {
		  event.preventDefault();
		  event.stopPropagation();
		  if (type == 'PushOn') {
		    on = true;
		    $s.addClass($button, 'simcir-basicset-switch-button-pressed');
		  } else if (type == 'PushOff') {
		    on = false;
		    $s.addClass($button, 'simcir-basicset-switch-button-pressed');
		  } else if (type == 'Toggle') {
		    on = !on;
		    $s.addClass($button, 'simcir-basicset-switch-button-pressed');
		  }
		  updateOutput();
		  $(document).on('mouseup', button_mouseUpHandler);
		  $(document).on('touchend', button_mouseUpHandler);
		};
		var button_mouseUpHandler = function(event) {
		  if (type == 'PushOn') {
		    on = false;
		    $s.removeClass($button, 'simcir-basicset-switch-button-pressed');
		  } else if (type == 'PushOff') {
		    on = true;
		    $s.removeClass($button, 'simcir-basicset-switch-button-pressed');
		  } else if (type == 'Toggle') {
		    // keep state
		    if (!on) {
		      $s.removeClass($button, 'simcir-basicset-switch-button-pressed');
		    }
		  }
		  updateOutput();
		  $(document).off('mouseup', button_mouseUpHandler);
		  $(document).off('touchend', button_mouseUpHandler);
		};
		device.$ui.on('deviceAdd', function() {
		  $s.enableEvents($button, true);
		  $button.on('mousedown', button_mouseDownHandler);
		  $button.on('touchstart', button_mouseDownHandler);
		});
		device.$ui.on('deviceRemove', function() {
		  $s.enableEvents($button, false);
		  $button.off('mousedown', button_mouseDownHandler);
		  $button.off('touchstart', button_mouseDownHandler);
		});
		$s.addClass(device.$ui, 'simcir-basicset-switch');
	      };
	    };
	  };

	  var createLogicGateFactory = function(op, out, draw) {
	    return function(device) {
	      var numInputs = (op === null)? 1 :
		Math.max(2, device.deviceDef.numInputs || 2);
	      device.halfPitch = numInputs > 2;
	      for (var i = 0; i < numInputs; i += 1) {
		device.addInput();
	      }
	      device.addOutput();
	      var inputs = device.getInputs();
	      var outputs = device.getOutputs();
	      device.$ui.on('inputValueChange', function() {
		var b = intValue(inputs[0].getValue() );
		if (op !== null) {
		  for (var i = 1; i < inputs.length; i += 1) {
		    b = op(b, intValue(inputs[i].getValue() ) );
		  }
		}
		b = out(b);
		outputs[0].setValue( (b == 1)? 1 : null);
	      });
	      var super_createUI = device.createUI;
	      device.createUI = function() {
		super_createUI();
		var size = device.getSize();
		var g = $s.graphics(device.$ui);
		g.attr['class'] = 'simcir-basicset-symbol';
		draw(g, 
		  (size.width - unit) / 2,
		  (size.height - unit) / 2,
		  unit, unit);
		if (op !== null) {
		  device.doc = {
		    params: [
		      {name: 'numInputs', type: 'number',
			defaultValue: 2,
			description: 'number of inputs.'}
		    ],
		    code: '{"type":"' + device.deviceDef.type + '","numInputs":2}'
		  };
		}
	      };
	    };
	  };

	var createPin = function(direction) {
	    return function(device) {
	      device.addInput();
	      device.addOutput();
	      var inputs = device.getInputs();
	      var outputs = device.getOutputs();
	      device.$ui.on('inputValueChange', function() {
		var b = intValue(inputs[0].getValue() );
		outputs[0].setValue( (b == 1)? 1 : null);
	      });

	      device.getLabel = function() {
		return '';
	      };
	      device.getSize = function() {
		return {width: unit, height: unit};
	      };

	      var super_createUI = device.createUI;
	      device.createUI = function() {
		super_createUI();
		device.setLabel(' ');
		var x_in = unit;
		var x_out = 0;
		var y = unit/2;
		if (direction) {
		  x_in = 0;
		  x_out = unit;
		}
		inputs[0].$ui.attr('transform', 'translate(' + x_in + ' ' + y + ')');
		inputs[0].$ui.attr('simcir-transform-x', x_in);
		inputs[0].$ui.attr('simcir-transform-y', y);
		outputs[0].$ui.attr('transform', 'translate(' + x_out + ' ' + y + ')');
		outputs[0].$ui.attr('simcir-transform-x', x_out);
		outputs[0].$ui.attr('simcir-transform-y', y);
	      };
	    };
	  };

	var createPin4 = function(direction) {
	    return function(device) {
	      device.halfPitch = true;
	      if(direction){
		device.addInput('', 'x4');
		device.addOutput('', 'x4');
	      }else{
		device.addInput('x4', '');
		device.addOutput('x4', '');
	      }
	      var inputs = device.getInputs();
	      var outputs = device.getOutputs();
	      var extractValue = function(busValue, i) {
		return (busValue !== null && typeof busValue == 'object' &&
		typeof busValue[i] != 'undefined')? busValue[i] : null;
	      };
	      device.$ui.on('inputValueChange', function() {
		var busValueIn = device.getInputs()[0].getValue();
		var busValueOut = [];
		var hotCount = 0;
		for (var i = 0; i < 4; i += 1) {
		  var value = extractValue(busValueIn, i);
		  if (isHot(value) ) {
		    hotCount += 1;
		  }
		  busValueOut.push(value);
		}
		device.getOutputs()[0].setValue((hotCount > 0)? busValueOut : null);
	      });
	      device.getLabel = function() {
		return '';
	      };
	      device.getSize = function() {
		return {width: unit, height: unit};
	      };
	      var super_createUI = device.createUI;
	      device.createUI = function() {
		super_createUI();
		device.setLabel('');
	       var x_in = unit;
		var x_out = 0;
		if(direction){
		  x_in=0;
		  x_out=unit;
		}
		var y = unit/2;
		inputs[0].$ui.attr('transform', 'translate(' + x_in + ' ' + y + ')');
		inputs[0].$ui.attr('simcir-transform-x', x_in);
		inputs[0].$ui.attr('simcir-transform-y', y);
		outputs[0].$ui.attr('transform', 'translate(' + x_out + ' ' + y + ')');
		outputs[0].$ui.attr('simcir-transform-x', x_out);
		outputs[0].$ui.attr('simcir-transform-y', y);
		device.doc = {
		  code: '{"type":"' + device.deviceDef.type + '"}'
		};
	      };
	    };
	  };
	  /*
	  var segBase = function() {
	    return {
	      width: 0,
	      height: 0,
	      allSegments: '',
	      drawSegment: function(g, segment, color) {},
	      drawPoint: function(g, color) {}
	    };
	  };
	  */

	  var _7Seg = function() {
	    var _SEGMENT_DATA = {
	      a: [575, 138, 494, 211, 249, 211, 194, 137, 213, 120, 559, 120],
	      b: [595, 160, 544, 452, 493, 500, 459, 456, 500, 220, 582, 146],
	      c: [525, 560, 476, 842, 465, 852, 401, 792, 441, 562, 491, 516],
	      d: [457, 860, 421, 892, 94, 892, 69, 864, 144, 801, 394, 801],
	      e: [181, 560, 141, 789, 61, 856, 48, 841, 96, 566, 148, 516],
	      f: [241, 218, 200, 453, 150, 500, 115, 454, 166, 162, 185, 145],
	      g: [485, 507, 433, 555, 190, 555, 156, 509, 204, 464, 451, 464]
	    };
	    return {
	      width: 636,
	      height: 1000,
	      allSegments: 'abcdefg',
	      drawSegment: function(g, segment, color) {
		if (color < 0) {
		  return;
		}
		var data = _SEGMENT_DATA[segment];
		var numPoints = data.length / 2;
		g.attr['fill'] = color;
		for (var i = 0; i < numPoints; i += 1) {
		  var x = data[i * 2];
		  var y = data[i * 2 + 1];
		  if (i === 0) {
		    g.moveTo(x, y);
		  } else {
		    g.lineTo(x, y);
		  }
		}
		g.closePath(true);
	      },
	      drawPoint: function(g, color) {
		if (!color) {
		  return;
		}
		g.attr['fill'] = color;
		g.drawCircle(542, 840, 46);
	      }
	    };
	  }();

	  var _16Seg = function() {
	    var _SEGMENT_DATA = {
	      a: [255, 184, 356, 184, 407, 142, 373, 102, 187, 102],
	      b: [418, 144, 451, 184, 552, 184, 651, 102, 468, 102],
	      c: [557, 190, 507, 455, 540, 495, 590, 454, 656, 108],
	      d: [487, 550, 438, 816, 506, 898, 573, 547, 539, 507],
	      e: [281, 863, 315, 903, 500, 903, 432, 821, 331, 821],
	      f: [35, 903, 220, 903, 270, 861, 236, 821, 135, 821],
	      g: [97, 548, 30, 897, 129, 815, 180, 547, 147, 507],
	      h: [114, 455, 148, 495, 198, 454, 248, 189, 181, 107],
	      i: [233, 315, 280, 452, 341, 493, 326, 331, 255, 200],
	      j: [361, 190, 334, 331, 349, 485, 422, 312, 445, 189, 412, 149],
	      k: [430, 316, 354, 492, 432, 452, 522, 334, 547, 200],
	      l: [354, 502, 408, 542, 484, 542, 534, 500, 501, 460, 434, 460],
	      m: [361, 674, 432, 805, 454, 691, 405, 550, 351, 509],
	      n: [265, 693, 242, 816, 276, 856, 326, 815, 353, 676, 343, 518],
	      o: [255, 546, 165, 671, 139, 805, 258, 689, 338, 510],
	      p: [153, 502, 187, 542, 254, 542, 338, 500, 278, 460, 203, 460]
	    };
	    return {
	      width: 690,
	      height: 1000,
	      allSegments: 'abcdefghijklmnop',
	      drawSegment: function(g, segment, color) {
		if (!color) {
		  return;
		}
		var data = _SEGMENT_DATA[segment];
		var numPoints = data.length / 2;
		g.attr['fill'] = color;
		for (var i = 0; i < numPoints; i += 1) {
		  var x = data[i * 2];
		  var y = data[i * 2 + 1];
		  if (i === 0) {
		    g.moveTo(x, y);
		  } else {
		    g.lineTo(x, y);
		  }
		}
		g.closePath(true);
	      },
	      drawPoint: function(g, color) {
		if (!color) {
		  return;
		}
		g.attr['fill'] = color;
		g.drawCircle(610, 900, 30);
	      }
	    };
	  }();

	  var drawSeg = function(seg, g, pattern, hiColor, loColor, bgColor) {
	    g.attr['stroke'] = 'none';
	    if (bgColor) {
	      g.attr['fill'] = bgColor;
	      g.drawRect(0, 0, seg.width, seg.height);
	    }
	    var on;
	    for (var i = 0; i < seg.allSegments.length; i += 1) {
	      var c = seg.allSegments.charAt(i);
	      on = (pattern !== null && pattern.indexOf(c) != -1);
	      seg.drawSegment(g, c, on? hiColor : loColor);
	    }
	    on = (pattern !== null && pattern.indexOf('.') != -1);
	    seg.drawPoint(g, on? hiColor : loColor);
	  };

	  var createSegUI = function(device, seg) {
	    var size = device.getSize();
	    var sw = seg.width;
	    var sh = seg.height;
	    var dw = size.width - unit;
	    var dh = size.height - unit;
	    var scale = (sw / sh > dw / dh)? dw / sw : dh / sh;
	    var tx = (size.width - seg.width * scale) / 2;
	    var ty = (size.height - seg.height * scale) / 2;
	    return $s.createSVGElement('g').
	      attr('transform', 'translate(' + tx + ' ' + ty + ')' +
		  ' scale(' + scale + ') ');
	  };

	  var createLEDSegFactory = function(seg) {
	    return function(device) {
	      var hiColor = device.deviceDef.color || defaultLEDColor;
	      var bgColor = device.deviceDef.bgColor || defaultLEDBgColor;
	      var loColor = multiplyColor(hiColor, bgColor, 0.25);
	      var allSegs = seg.allSegments + '.';
	      device.halfPitch = true;
	      for (var i = 0; i < allSegs.length; i += 1) {
		device.addInput();
	      }

	      var super_getSize = device.getSize;
	      device.getSize = function() {
		var size = super_getSize();
		return {width: unit * 4, height: size.height};
	      };

	      var super_createUI = device.createUI;
	      device.createUI = function() {
		super_createUI();

		var $seg = createSegUI(device, seg);
		device.$ui.append($seg);

		var update = function() {
		  var segs = '';
		  for (var i = 0; i < allSegs.length; i += 1) {
		    if (isHot(device.getInputs()[i].getValue() ) ) {
		      segs += allSegs.charAt(i);
		    }
		  }
		  $seg.children().remove();
		  drawSeg(seg, $s.graphics($seg), segs,
		      hiColor, loColor, bgColor);
		};
		device.$ui.on('inputValueChange', update);
		update();
		device.doc = {
		  params: [
		    {name: 'color', type: 'string',
		      defaultValue: defaultLEDColor,
		      description: 'color in hexadecimal.'},
		    {name: 'bgColor', type: 'string',
		      defaultValue: defaultLEDBgColor,
		      description: 'background color in hexadecimal.'}
		  ],
		  code: '{"type":"' + device.deviceDef.type +
		  '","color":"' + defaultLEDColor + '"}'
		};
	      };
	    };
	  };

	  var createLED4bitFactory = function(bus) {

	    var _PATTERNS = {
	      0: 'abcdef',
	      1: 'bc',
	      2: 'abdeg',
	      3: 'abcdg',
	      4: 'bcfg',
	      5: 'acdfg',
	      6: 'acdefg',
	      7: 'abc',
	      8: 'abcdefg',
	      9: 'abcdfg', 
	      a: 'abcefg',
	      b: 'cdefg',
	      c: 'adef',
	      d: 'bcdeg',
	      e: 'adefg',
	      f: 'aefg'
	    };

	    var getPattern = function(value) {
	      return _PATTERNS['0123456789abcdef'.charAt(value)];
	    };

	    var seg = _7Seg;

	    return function(device) {
	      var hiColor = device.deviceDef.color || defaultLEDColor;
	      var bgColor = device.deviceDef.bgColor || defaultLEDBgColor;
		var loColor = multiplyColor(hiColor, bgColor, 0.10);
		var extractValue = function(busValue, i) {
			return (busValue !== null && typeof busValue == 'object' &&
			typeof busValue[i] != 'undefined')? busValue[i] : null;
		};
	       if (bus) {
		device.addInput('', 'x4');
	       }
	       else
	       {
			for (var i = 0; i < 4; i += 1) {
				device.addInput();
			}
		}
	      var super_getSize = device.getSize;
	      device.getSize = function() {
		var size = super_getSize();
		return {width: unit * 4, height: unit * 4};
	      };

	      var super_createUI = device.createUI;
	      device.createUI = function() {
		super_createUI();

		var $seg = createSegUI(device, seg);
		device.$ui.append($seg);
	  
		var update = function() {
		  var value = 0;
		 if (bus) {
		    var busValue = device.getInputs()[0].getValue();
		  for (var i = 0; i < 4; i += 1) {
		      if (isHot(extractValue(busValue, i) ) ) {
		      value += (1 << i);
		    }
		  }
		  } else {
		  for (var i = 0; i < 4; i += 1) {
		      if (isHot(device.getInputs()[i].getValue() ) ) {
		      value += (1 << i);
		    }
		  }
		  }  
		$seg.children().remove();
		  drawSeg(seg, $s.graphics($seg), getPattern(value),
		      hiColor, loColor, bgColor);
		};
		device.$ui.on('inputValueChange', update);
		update();
		device.doc = {
		  params: [
		    {name: 'color', type: 'string',
		      defaultValue: defaultLEDColor,
		      description: 'color in hexadecimal.'},
		    {name: 'bgColor', type: 'string',
		      defaultValue: defaultLEDBgColor,
		      description: 'background color in hexadecimal.'}
		  ],
		  code: '{"type":"' + device.deviceDef.type +
		  '","color":"' + defaultLEDColor + '"}'
		};
	      };
	    };
	  };

	  var createRotaryEncoderFactory = function(bus) {
	    var _MIN_ANGLE = 45;
	    var _MAX_ANGLE = 315;
	    var thetaToAngle = function(theta) {
	      var angle = (theta - Math.PI / 2) / Math.PI * 180;
	      while (angle < 0) {
		angle += 360;
	      }
	      while (angle > 360) {
		angle -= 360;
	      }
	      return angle;
	    };
	    return function(device) {
		var numOutputs = Math.max(2, device.deviceDef.numOutputs || 4);
	      var initial_value = device.deviceDef.value;
	      if (initial_value === null) {
		initial_value = 0;
	      }
	      var max = 1 << numOutputs;
	      var _angle = _MIN_ANGLE + initial_value * (_MAX_ANGLE-_MIN_ANGLE) / max;
	      device.halfPitch = numOutputs > 4;
	      device.addInput();
	      if (bus) {
		device.addOutput('', 'x'+numOutputs);
	      } else {
		for (var i = 0; i < numOutputs; i += 1) {
		  device.addOutput();
		}
	      }
	      var update_outputs = function(input) {
		var max = 1 << numOutputs;
		var value = Math.min( ( (_angle - _MIN_ANGLE) /
		    (_MAX_ANGLE - _MIN_ANGLE) * max), max - 1);
		if (bus)
		{
		  var busValue = [];
		  if (isHot(input) && value) {
		    for (var i = 0; i < numOutputs; i += 1) {
		      busValue.push((value & (1 << i)) ? input : null);
		    }
		    device.getOutputs()[0].setValue(busValue);
		  } else {
		    device.getOutputs()[0].setValue(null);
		  }
		}
		else
		for (var i = 0; i < numOutputs; i += 1) {
		  device.getOutputs()[i].setValue( (value & (1 << i) )?
		      device.getInputs()[0].getValue() : null);
		}
	      };
	      // Make sure that embedded Rotary encoders provide their value
	      update_outputs(true);

	      var super_getSize = device.getSize;
	      device.getSize = function() {
		var size = super_getSize();
		return {width: unit * 4, height: unit * 4};
	      };

	      var super_createUI = device.createUI;
	      device.createUI = function() {
		super_createUI();
		var size = device.getSize();
		
		var $knob = $s.createSVGElement('g').
		  attr('class', 'simcir-basicset-knob').
		  append($s.createSVGElement('rect').
		      attr({x:-10,y:-10,width:20,height:20}));
		var r = Math.min(size.width, size.height) / 4 * 1.5;
		var g = $s.graphics($knob);
		g.drawCircle(0, 0, r);
		g.attr['class'] = 'simcir-basicset-knob-mark';
		g.moveTo(0, 0);
		g.lineTo(r, 0);
		g.closePath();
		device.$ui.append($knob);
	  
		var setAngle = function(angle) {
		  _angle = Math.max(_MIN_ANGLE, Math.min(angle, _MAX_ANGLE) );
		  update();
		};
	  
		var dragPoint = null;
		var knob_mouseDownHandler = function(event) {
		  event.preventDefault();
		  event.stopPropagation();
		  dragPoint = {x: event.pageX, y: event.pageY};
		  $(document).on('mousemove', knob_mouseMoveHandler);
		  $(document).on('mouseup', knob_mouseUpHandler);
		};
		var knob_mouseMoveHandler = function(event) {
		  var off = $knob.parents('svg').offset();
		  var pos = $s.offset($knob);
		  var cx = off.left + pos.x;
		  var cy = off.top + pos.y;
		  var dx = event.pageX - cx;
		  var dy = event.pageY - cy;
		  if (dx === 0 && dy === 0){ return;}
		  setAngle(thetaToAngle(Math.atan2(dy, dx) ) );
		};
		var knob_mouseUpHandler = function(event) {
		  $(document).off('mousemove', knob_mouseMoveHandler);
		  $(document).off('mouseup', knob_mouseUpHandler);
		};
		device.$ui.on('deviceAdd', function() {
		  $s.enableEvents($knob, true);
		  $knob.on('mousedown', knob_mouseDownHandler);
		});
		device.$ui.on('deviceRemove', function() {
		  $s.enableEvents($knob, false);
		  $knob.off('mousedown', knob_mouseDownHandler);
		});
	  
		var update = function() {
		  $s.transform($knob, size.width / 2,
		      size.height / 2, _angle + 90);
		  update_outputs(device.getInputs()[0].getValue());
		}
		device.$ui.on('inputValueChange', update);
		update();
		device.doc = {
		  params: [
		    {name: 'numOutputs', type: 'number', defaultValue: 4,
		      description: 'number of outputs.'},
		    {name: 'value', type: 'number', defaultValue: 0,
		      description: 'default value.'}
		  ],
		  code: '{"type":"' + device.deviceDef.type + '","numOutputs":4,"value":0}'
		};
	      };
	    };
	  };
	  // register direct current source
	  $s.registerDevice('DC', function(device) {
	    device.addOutput();
	    var super_createUI = device.createUI;
	    device.createUI = function() {
	      super_createUI();
	      $s.addClass(device.$ui, 'simcir-basicset-osc');
	    };
	    device.getOutputs()[0].setValue(onValue);
	    device.$ui.on('deviceAdd', function() {
	      device.getOutputs()[0].setValue(onValue);
	    });
	    device.$ui.on('deviceRemove', function() {
	      device.getOutputs()[0].setValue(null);
	    });
	  });

	  // register simple LED
	  $s.registerDevice('LED', function(device) {
	    var in1 = device.addInput();
	    var super_createUI = device.createUI;
	    device.createUI = function() {
	      super_createUI();
	      var hiColor = device.deviceDef.color || defaultLEDColor;
	      var bgColor = device.deviceDef.bgColor || defaultLEDBgColor;
	      var loColor = multiplyColor(hiColor, bgColor, 0.25);
	      var bLoColor = multiplyColor(hiColor, bgColor, 0.2);
	      var bHiColor = multiplyColor(hiColor, bgColor, 0.8);
	      var size = device.getSize();
	      var $ledbase = $s.createSVGElement('circle').
		attr({cx: size.width / 2, cy: size.height / 2, r: size.width / 4}).
		attr('stroke', 'none').
		attr('fill', bLoColor);
	      device.$ui.append($ledbase);
	      var $led = $s.createSVGElement('circle').
		attr({cx: size.width / 2, cy: size.height / 2, r: size.width / 4 * 0.8}).
		attr('stroke', 'none').
		attr('fill', loColor);
	      device.$ui.append($led);
	      device.$ui.on('inputValueChange', function() {
		$ledbase.attr('fill', isHot(in1.getValue() )? bHiColor : bLoColor);
		$led.attr('fill', isHot(in1.getValue() )? hiColor : loColor);
	      });
	      device.doc = {
		params: [
		  {name: 'color', type: 'string',
		    defaultValue: defaultLEDColor,
		    description: 'color in hexadecimal.'},
		  {name: 'bgColor', type: 'string',
		    defaultValue: defaultLEDBgColor,
		    description: 'background color in hexadecimal.'}
		],
		code: '{"type":"' + device.deviceDef.type +
		'","color":"' + defaultLEDColor + '"}'
	      };
	    };
	  });

	  // register switches
	  $s.registerDevice('PushOff', createSwitchFactory('PushOff') );
	  $s.registerDevice('PushOn', createSwitchFactory('PushOn') );
	  $s.registerDevice('Toggle', createSwitchFactory('Toggle') );

	  // register logic gates
	  $s.registerDevice('BUF', createLogicGateFactory(null, BUF, drawBUF) );
	  $s.registerDevice('NOT', createLogicGateFactory(null, NOT, drawNOT) );
	  $s.registerDevice('AND', createLogicGateFactory(AND, BUF, drawAND) );
	  $s.registerDevice('NAND', createLogicGateFactory(AND, NOT, drawNAND) );
	  $s.registerDevice('OR', createLogicGateFactory(OR, BUF, drawOR) );
	  $s.registerDevice('NOR', createLogicGateFactory(OR, NOT, drawNOR) );
	  $s.registerDevice('XOR', createLogicGateFactory(XOR, BUF, drawXOR) );
	  $s.registerDevice('XNOR', createLogicGateFactory(XOR, NOT, drawXNOR) );

	  // register Oscillator
	  $s.registerDevice('OSC', function(device) {
	    var freq = device.deviceDef.freq || 1;
	    var delay = ~~(500 / freq);
	    var out1 = device.addOutput();
	    var timerId = null;
	    var on = false;
	    device.$ui.on('deviceAdd', function() {
	      timerId = window.setInterval(function() {
		out1.setValue(on? onValue : offValue);
		on = !on;
	      }, delay);
	    });
	    device.$ui.on('deviceRemove', function() {
	      if (timerId !== null) {
		window.clearInterval(timerId);
		timerId = null;
	      }
	    });
	    var super_createUI = device.createUI;
	    device.createUI = function() {
	      super_createUI();
	      $s.addClass(device.$ui, 'simcir-basicset-dc');
	      device.doc = {
		params: [
		  {name: 'freq', type: 'number', defaultValue: '1',
		    description: 'frequency of an oscillator.'}
		],
		code: '{"type":"' + device.deviceDef.type + '","freq":1}'
	      };
	    };
	  });

	  $s.registerDevice('1<1', createPin(0) );
	  $s.registerDevice('1>1', createPin(1) );

  // register LED seg
  $s.registerDevice('7seg', createLEDSegFactory(_7Seg) );
  $s.registerDevice('16seg', createLEDSegFactory(_16Seg) );
  $s.registerDevice('4bit7seg', createLED4bitFactory(0) );
  $s.registerDevice('4bit7segBus', createLED4bitFactory(1) );

  // register Rotary Encoder
  $s.registerDevice('RotaryEncoder', createRotaryEncoderFactory(0) );
  $s.registerDevice('RotaryEncoderBus', createRotaryEncoderFactory(1) );

  $s.registerDevice('BusIn', function(device) {
    var numOutputs = Math.max(2, device.deviceDef.numOutputs || 4);
    device.halfPitch = true;
    device.addInput('', 'x' + numOutputs);
    for (var i = 0; i < numOutputs; i += 1) {
      device.addOutput();
    }
    var extractValue = function(busValue, i) {
      return (busValue !== null && typeof busValue == 'object' &&
          typeof busValue[i] != 'undefined')? busValue[i] : null;
    };
    device.$ui.on('inputValueChange', function() {
      var busValue = device.getInputs()[0].getValue();
      for (var i = 0; i < numOutputs; i += 1) {
        device.getOutputs()[i].setValue(extractValue(busValue, i) );
      }
    });
    var super_createUI = device.createUI;
    device.createUI = function() {
      super_createUI();
      device.doc = {
        params: [
          {name: 'numOutputs', type: 'number', defaultValue: 4,
            description: 'number of outputs.'}
        ],
        code: '{"type":"' + device.deviceDef.type + '","numOutputs":4}'
      };
    };
  });

$s.registerDevice('4>4',createPin4(0));
$s.registerDevice('4<4',createPin4(1));

$s.registerDevice('BusOut', function(device) {
    var numInputs = Math.max(2, device.deviceDef.numInputs || 4);
    device.halfPitch = true;
    for (var i = 0; i < numInputs; i += 1) {
      device.addInput();
    }
    device.addOutput('', 'x' + numInputs);
    device.$ui.on('inputValueChange', function() {
      var busValue = [];
      var hotCount = 0;
      for (var i = 0; i < numInputs; i += 1) {
        var value = device.getInputs()[i].getValue();
        if (isHot(value) ) {
          hotCount += 1;
        }
        busValue.push(value);
      }
      device.getOutputs()[0].setValue(
          (hotCount > 0)? busValue : null);
    });
    var super_createUI = device.createUI;
    device.createUI = function() {
      super_createUI();
      device.doc = {
        params: [
          {name: 'numInputs', type: 'number', defaultValue: 4,
            description: 'number of inputs.'}
        ],
        code: '{"type":"' + device.deviceDef.type + '","numInputs":4}'
      };
    };
  });

}();
};
M.mod_circuits.addVirtualPort = function() {
 var $s=M.mod_circuits.simcir;
  var virtualPortManager = function() {

    var devices = {};
    var idCount = 0;
  
    var register = function(device) {
      var id = 'id' + idCount++;
      device.$ui.on('deviceAdd', function() {
        devices[id] = device;
      }).on('deviceRemove', function() {
        delete devices[id];
      });
    };

    var setValueByLabel = function(label, value) {
      $.each(devices, function(id, device) {
        if (device.getLabel() == label && device.getOutputs().length > 0) {
          device.getOutputs()[0].setValue(value);
        }
      });
    };

    var getValueByLabel = function(label) {
      var value = null;
      $.each(devices, function(id, device) {
        if (device.getLabel() == label && device.getInputs().length > 0) {
          value = device.getInputs()[0].getValue();
        }
      });
      return value;
    };

    return {
      register: register,
      setValueByLabel: setValueByLabel,
      getValueByLabel: getValueByLabel
    };
  }();

  // register Virtual-In
  $s.registerDevice('Virtual-In', function(device) {
    virtualPortManager.register(device);
    var in1 = device.addInput();
    var lastLabel = device.getLabel();
    device.$ui.on('deviceRemove', function() {
      virtualPortManager.setValueByLabel(device.getLabel(), null);
    }).on('deviceLabelChange', function() {
      // unset by last label
      virtualPortManager.setValueByLabel(lastLabel, null);
      lastLabel = device.getLabel();
      // set by current(new) label
      virtualPortManager.setValueByLabel(
          device.getLabel(), in1.getValue() );
    }).on('inputValueChange', function() {
      virtualPortManager.setValueByLabel(
          device.getLabel(), in1.getValue() );
    });
  });

  // register Virtual-Out
  $s.registerDevice('Virtual-Out', function(device) {
    virtualPortManager.register(device);
    var out1 = device.addOutput();
    device.$ui.on('deviceLabelChange', function() {
      out1.setValue(virtualPortManager.getValueByLabel(
          device.getLabel() ) );
    });
    // update initial state
    out1.setValue(virtualPortManager.getValueByLabel(
        device.getLabel() ) );
  });

};
M.mod_circuits.library = function() {
//
// SimcirJS - library
//
// Copyright (c) 2014 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

// includes following device types:
//  RS-FF
//  JK-FF
//  T-FF
//  D-FF
//  8bitCounter
//  HalfAdder
//  FullAdder
//  4bitAdder
//  2to4Decoder
//  3to8Decoder
//  4to16Decoder

var simcir = M.mod_circuits.simcir;

simcir.registerDevice('RS-FF',
{
  "width":320,
  "height":160,
  "showToolbox":false,
  "toolbox":[
  ],
  "devices":[
    {"type":"NAND","id":"dev0","x":184,"y":32,"label":"NAND"},
    {"type":"NAND","id":"dev1","x":184,"y":80,"label":"NAND"},
    {"type":"In","id":"dev2","x":136,"y":24,"label":"~S"},
    {"type":"In","id":"dev3","x":136,"y":88,"label":"~R"},
    {"type":"Out","id":"dev4","x":232,"y":32,"label":"Q"},
    {"type":"Out","id":"dev5","x":232,"y":80,"label":"~Q"},
    {"type":"PushOff","id":"dev6","x":88,"y":24,"label":"PushOff"},
    {"type":"PushOff","id":"dev7","x":88,"y":88,"label":"PushOff"},
    {"type":"DC","id":"dev8","x":40,"y":56,"label":"DC"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev2.out0"},
    {"from":"dev0.in1","to":"dev1.out0"},
    {"from":"dev1.in0","to":"dev0.out0"},
    {"from":"dev1.in1","to":"dev3.out0"},
    {"from":"dev2.in0","to":"dev6.out0"},
    {"from":"dev3.in0","to":"dev7.out0"},
    {"from":"dev4.in0","to":"dev0.out0"},
    {"from":"dev5.in0","to":"dev1.out0"},
    {"from":"dev6.in0","to":"dev8.out0"},
    {"from":"dev7.in0","to":"dev8.out0"}
  ]
}
);

simcir.registerDevice('JK-FF',
{
  "width":480,
  "height":240,
  "showToolbox":false,
  "toolbox":[
  ],
  "devices":[
    {"type":"RS-FF","id":"dev0","x":216,"y":112,"label":"RS-FF"},
    {"type":"RS-FF","id":"dev1","x":344,"y":112,"label":"RS-FF"},
    {"type":"NAND","numInputs":3,"id":"dev2","x":168,"y":80,"label":"NAND"},
    {"type":"NAND","numInputs":3,"id":"dev3","x":168,"y":144,"label":"NAND"},
    {"type":"NAND","id":"dev4","x":296,"y":80,"label":"NAND"},
    {"type":"NAND","id":"dev5","x":296,"y":144,"label":"NAND"},
    {"type":"NOT","id":"dev6","x":168,"y":24,"label":"NOT"},
    {"type":"In","id":"dev7","x":120,"y":64,"label":"J"},
    {"type":"In","id":"dev8","x":120,"y":112,"label":"CLK"},
    {"type":"In","id":"dev9","x":120,"y":160,"label":"K"},
    {"type":"Out","id":"dev10","x":424,"y":80,"label":"Q"},
    {"type":"Out","id":"dev11","x":424,"y":144,"label":"~Q"},
    {"type":"Toggle","id":"dev12","x":72,"y":64,"label":"Toggle"},
    {"type":"PushOn","id":"dev13","x":72,"y":112,"label":"PushOn"},
    {"type":"Toggle","id":"dev14","x":72,"y":160,"label":"Toggle"},
    {"type":"DC","id":"dev15","x":24,"y":112,"label":"DC"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev2.out0"},
    {"from":"dev0.in1","to":"dev3.out0"},
    {"from":"dev1.in0","to":"dev4.out0"},
    {"from":"dev1.in1","to":"dev5.out0"},
    {"from":"dev2.in0","to":"dev1.out1"},
    {"from":"dev2.in1","to":"dev7.out0"},
    {"from":"dev2.in2","to":"dev8.out0"},
    {"from":"dev3.in0","to":"dev8.out0"},
    {"from":"dev3.in1","to":"dev9.out0"},
    {"from":"dev3.in2","to":"dev1.out0"},
    {"from":"dev4.in0","to":"dev6.out0"},
    {"from":"dev4.in1","to":"dev0.out0"},
    {"from":"dev5.in0","to":"dev0.out1"},
    {"from":"dev5.in1","to":"dev6.out0"},
    {"from":"dev6.in0","to":"dev8.out0"},
    {"from":"dev7.in0","to":"dev12.out0"},
    {"from":"dev8.in0","to":"dev13.out0"},
    {"from":"dev9.in0","to":"dev14.out0"},
    {"from":"dev10.in0","to":"dev1.out0"},
    {"from":"dev11.in0","to":"dev1.out1"},
    {"from":"dev12.in0","to":"dev15.out0"},
    {"from":"dev13.in0","to":"dev15.out0"},
    {"from":"dev14.in0","to":"dev15.out0"}
  ]
}
);

simcir.registerDevice('T-FF',
{
  "width":320,
  "height":160,
  "showToolbox":false,
  "toolbox":[
  ],
  "devices":[
    {"type":"JK-FF","id":"dev0","x":168,"y":48,"label":"JK-FF"},
    {"type":"In","id":"dev1","x":120,"y":32,"label":"T"},
    {"type":"In","id":"dev2","x":120,"y":80,"label":"CLK"},
    {"type":"Out","id":"dev3","x":248,"y":32,"label":"Q"},
    {"type":"Out","id":"dev4","x":248,"y":80,"label":"~Q"},
    {"type":"Toggle","id":"dev5","x":72,"y":32,"label":"Toggle"},
    {"type":"PushOn","id":"dev6","x":72,"y":80,"label":"PushOn"},
    {"type":"DC","id":"dev7","x":24,"y":56,"label":"DC"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev1.out0"},
    {"from":"dev0.in1","to":"dev2.out0"},
    {"from":"dev0.in2","to":"dev1.out0"},
    {"from":"dev1.in0","to":"dev5.out0"},
    {"from":"dev2.in0","to":"dev6.out0"},
    {"from":"dev3.in0","to":"dev0.out0"},
    {"from":"dev4.in0","to":"dev0.out1"},
    {"from":"dev5.in0","to":"dev7.out0"},
    {"from":"dev6.in0","to":"dev7.out0"}
  ]
}
);

simcir.registerDevice('D-FF',
{
  "width":540,
  "height":200,
  "showToolbox":false,
  "toolbox":[
  ],
  "devices":[
    {"type":"In","id":"dev0","x":128,"y":24,"label":"D"},
    {"type":"In","id":"dev1","x":168,"y":128,"label":"CLK"},
    {"type":"NOT","id":"dev2","x":176,"y":64,"label":"NOT"},
    {"type":"NAND","id":"dev3","x":224,"y":32,"label":"NAND"},
    {"type":"NAND","id":"dev4","x":224,"y":96,"label":"NAND"},
    {"type":"RS-FF","id":"dev5","x":272,"y":64,"label":"RS-FF"},
    {"type":"NOT","id":"dev6","x":296,"y":128,"label":"NOT"},
    {"type":"NAND","id":"dev7","x":352,"y":32,"label":"NAND"},
    {"type":"NAND","id":"dev8","x":352,"y":96,"label":"NAND"},
    {"type":"RS-FF","id":"dev9","x":400,"y":64,"label":"RS-FF"},
    {"type":"Out","id":"dev10","x":480,"y":32,"label":"Q"},
    {"type":"Out","id":"dev11","x":480,"y":96,"label":"~Q"},
    {"type":"Toggle","id":"dev12","x":80,"y":24,"label":"Toggle"},
    {"type":"PushOn","id":"dev13","x":80,"y":128,"label":"PushOn"},
    {"type":"DC","id":"dev14","x":32,"y":72,"label":"DC"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev12.out0"},
    {"from":"dev1.in0","to":"dev13.out0"},
    {"from":"dev2.in0","to":"dev0.out0"},
    {"from":"dev3.in0","to":"dev0.out0"},
    {"from":"dev3.in1","to":"dev1.out0"},
    {"from":"dev4.in0","to":"dev1.out0"},
    {"from":"dev4.in1","to":"dev2.out0"},
    {"from":"dev5.in0","to":"dev3.out0"},
    {"from":"dev5.in1","to":"dev4.out0"},
    {"from":"dev6.in0","to":"dev1.out0"},
    {"from":"dev7.in0","to":"dev5.out0"},
    {"from":"dev7.in1","to":"dev6.out0"},
    {"from":"dev8.in0","to":"dev6.out0"},
    {"from":"dev8.in1","to":"dev5.out1"},
    {"from":"dev9.in0","to":"dev7.out0"},
    {"from":"dev9.in1","to":"dev8.out0"},
    {"from":"dev10.in0","to":"dev9.out0"},
    {"from":"dev11.in0","to":"dev9.out1"},
    {"from":"dev12.in0","to":"dev14.out0"},
    {"from":"dev13.in0","to":"dev14.out0"}
  ]
}
);

simcir.registerDevice('8bitCounter',
{
  "width":320,
  "height":420,
  "showToolbox":false,
  "toolbox":[
  ],
  "devices":[
    {"type":"T-FF","id":"dev0","x":184,"y":16,"label":"T-FF"},
    {"type":"T-FF","id":"dev1","x":184,"y":64,"label":"T-FF"},
    {"type":"T-FF","id":"dev2","x":184,"y":112,"label":"T-FF"},
    {"type":"T-FF","id":"dev3","x":184,"y":160,"label":"T-FF"},
    {"type":"T-FF","id":"dev4","x":184,"y":208,"label":"T-FF"},
    {"type":"T-FF","id":"dev5","x":184,"y":256,"label":"T-FF"},
    {"type":"T-FF","id":"dev6","x":184,"y":304,"label":"T-FF"},
    {"type":"T-FF","id":"dev7","x":184,"y":352,"label":"T-FF"},
    {"type":"Out","id":"dev8","x":264,"y":16,"label":"D0"},
    {"type":"Out","id":"dev9","x":264,"y":64,"label":"D1"},
    {"type":"Out","id":"dev10","x":264,"y":112,"label":"D2"},
    {"type":"Out","id":"dev11","x":264,"y":160,"label":"D3"},
    {"type":"Out","id":"dev12","x":264,"y":208,"label":"D4"},
    {"type":"Out","id":"dev13","x":264,"y":256,"label":"D5"},
    {"type":"Out","id":"dev14","x":264,"y":304,"label":"D6"},
    {"type":"Out","id":"dev15","x":264,"y":352,"label":"D7"},
    {"type":"In","id":"dev16","x":120,"y":16,"label":"T"},
    {"type":"In","id":"dev17","x":120,"y":112,"label":"CLK"},
    {"type":"PushOn","id":"dev18","x":72,"y":112,"label":"PushOn"},
    {"type":"DC","id":"dev19","x":24,"y":16,"label":"DC"},
    {"type":"Toggle","id":"dev20","x":72,"y":16,"label":"Toggle"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev16.out0"},
    {"from":"dev0.in1","to":"dev17.out0"},
    {"from":"dev1.in0","to":"dev16.out0"},
    {"from":"dev1.in1","to":"dev0.out0"},
    {"from":"dev2.in0","to":"dev16.out0"},
    {"from":"dev2.in1","to":"dev1.out0"},
    {"from":"dev3.in0","to":"dev16.out0"},
    {"from":"dev3.in1","to":"dev2.out0"},
    {"from":"dev4.in0","to":"dev16.out0"},
    {"from":"dev4.in1","to":"dev3.out0"},
    {"from":"dev5.in0","to":"dev16.out0"},
    {"from":"dev5.in1","to":"dev4.out0"},
    {"from":"dev6.in0","to":"dev16.out0"},
    {"from":"dev6.in1","to":"dev5.out0"},
    {"from":"dev7.in0","to":"dev16.out0"},
    {"from":"dev7.in1","to":"dev6.out0"},
    {"from":"dev8.in0","to":"dev0.out0"},
    {"from":"dev9.in0","to":"dev1.out0"},
    {"from":"dev10.in0","to":"dev2.out0"},
    {"from":"dev11.in0","to":"dev3.out0"},
    {"from":"dev12.in0","to":"dev4.out0"},
    {"from":"dev13.in0","to":"dev5.out0"},
    {"from":"dev14.in0","to":"dev6.out0"},
    {"from":"dev15.in0","to":"dev7.out0"},
    {"from":"dev16.in0","to":"dev20.out0"},
    {"from":"dev17.in0","to":"dev18.out0"},
    {"from":"dev18.in0","to":"dev19.out0"},
    {"from":"dev20.in0","to":"dev19.out0"}
  ]
}
);

simcir.registerDevice('HalfAdder',
{
  "width":320,
  "height":160,
  "showToolbox":false,
  "toolbox":[
  ],
  "devices":[
    {"type":"Toggle","id":"dev0","x":96,"y":80,"label":"Toggle"},
    {"type":"DC","id":"dev1","x":48,"y":56,"label":"DC"},
    {"type":"AND","id":"dev2","x":192,"y":80,"label":"AND"},
    {"type":"XOR","id":"dev3","x":192,"y":32,"label":"XOR"},
    {"type":"In","id":"dev4","x":144,"y":32,"label":"A"},
    {"type":"In","id":"dev5","x":144,"y":80,"label":"B"},
    {"type":"Out","id":"dev6","x":240,"y":32,"label":"S"},
    {"type":"Out","id":"dev7","x":240,"y":80,"label":"C"},
    {"type":"Toggle","id":"dev8","x":96,"y":32,"label":"Toggle"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev1.out0"},
    {"from":"dev2.in0","to":"dev4.out0"},
    {"from":"dev2.in1","to":"dev5.out0"},
    {"from":"dev3.in0","to":"dev4.out0"},
    {"from":"dev3.in1","to":"dev5.out0"},
    {"from":"dev4.in0","to":"dev8.out0"},
    {"from":"dev5.in0","to":"dev0.out0"},
    {"from":"dev6.in0","to":"dev3.out0"},
    {"from":"dev7.in0","to":"dev2.out0"},
    {"from":"dev8.in0","to":"dev1.out0"}
  ]
}
);

simcir.registerDevice('FullAdder',
{
  "width":440,
  "height":200,
  "showToolbox":false,
  "toolbox":[
  ],
  "devices":[
    {"type":"In","id":"dev0","x":120,"y":32,"label":"Cin"},
    {"type":"In","id":"dev1","x":120,"y":80,"label":"A"},
    {"type":"In","id":"dev2","x":120,"y":128,"label":"B"},
    {"type":"Toggle","id":"dev3","x":72,"y":32,"label":"Toggle"},
    {"type":"Toggle","id":"dev4","x":72,"y":80,"label":"Toggle"},
    {"type":"Toggle","id":"dev5","x":72,"y":128,"label":"Toggle"},
    {"type":"DC","id":"dev6","x":24,"y":80,"label":"DC"},
    {"type":"HalfAdder","id":"dev7","x":168,"y":104,"label":"HalfAdder"},
    {"type":"HalfAdder","id":"dev8","x":248,"y":56,"label":"HalfAdder"},
    {"type":"OR","id":"dev9","x":328,"y":104,"label":"OR"},
    {"type":"Out","id":"dev10","x":376,"y":104,"label":"Cout"},
    {"type":"Out","id":"dev11","x":376,"y":48,"label":"S"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev3.out0"},
    {"from":"dev1.in0","to":"dev4.out0"},
    {"from":"dev2.in0","to":"dev5.out0"},
    {"from":"dev3.in0","to":"dev6.out0"},
    {"from":"dev4.in0","to":"dev6.out0"},
    {"from":"dev5.in0","to":"dev6.out0"},
    {"from":"dev7.in0","to":"dev1.out0"},
    {"from":"dev7.in1","to":"dev2.out0"},
    {"from":"dev8.in0","to":"dev0.out0"},
    {"from":"dev8.in1","to":"dev7.out0"},
    {"from":"dev9.in0","to":"dev8.out1"},
    {"from":"dev9.in1","to":"dev7.out1"},
    {"from":"dev10.in0","to":"dev9.out0"},
    {"from":"dev11.in0","to":"dev8.out0"}
  ]
}
);

simcir.registerDevice('4bitAdder',
{
  "width":280,
  "height":480,
  "showToolbox":false,
  "toolbox":[
  ],
  "devices":[
    {"type":"FullAdder","id":"dev0","x":120,"y":72,"label":"FullAdder"},
    {"type":"FullAdder","id":"dev1","x":120,"y":136,"label":"FullAdder"},
    {"type":"FullAdder","id":"dev2","x":120,"y":200,"label":"FullAdder"},
    {"type":"FullAdder","id":"dev3","x":120,"y":264,"label":"FullAdder"},
    {"type":"In","id":"dev4","x":40,"y":80,"label":"A0"},
    {"type":"In","id":"dev5","x":40,"y":128,"label":"A1"},
    {"type":"In","id":"dev6","x":40,"y":176,"label":"A2"},
    {"type":"In","id":"dev7","x":40,"y":224,"label":"A3"},
    {"type":"In","id":"dev8","x":40,"y":272,"label":"B0"},
    {"type":"In","id":"dev9","x":40,"y":320,"label":"B1"},
    {"type":"In","id":"dev10","x":40,"y":368,"label":"B2"},
    {"type":"In","id":"dev11","x":40,"y":416,"label":"B3"},
    {"type":"Out","id":"dev12","x":200,"y":72,"label":"S0"},
    {"type":"Out","id":"dev13","x":200,"y":120,"label":"S1"},
    {"type":"Out","id":"dev14","x":200,"y":168,"label":"S2"},
    {"type":"Out","id":"dev15","x":200,"y":216,"label":"S3"},
    {"type":"Out","id":"dev16","x":200,"y":280,"label":"Cout"},
    {"type":"In","id":"dev17","x":40,"y":24,"label":"Cin"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev17.out0"},
    {"from":"dev0.in1","to":"dev4.out0"},
    {"from":"dev0.in2","to":"dev8.out0"},
    {"from":"dev1.in0","to":"dev0.out1"},
    {"from":"dev1.in1","to":"dev5.out0"},
    {"from":"dev1.in2","to":"dev9.out0"},
    {"from":"dev2.in0","to":"dev1.out1"},
    {"from":"dev2.in1","to":"dev6.out0"},
    {"from":"dev2.in2","to":"dev10.out0"},
    {"from":"dev3.in0","to":"dev2.out1"},
    {"from":"dev3.in1","to":"dev7.out0"},
    {"from":"dev3.in2","to":"dev11.out0"},
    {"from":"dev12.in0","to":"dev0.out0"},
    {"from":"dev13.in0","to":"dev1.out0"},
    {"from":"dev14.in0","to":"dev2.out0"},
    {"from":"dev15.in0","to":"dev3.out0"},
    {"from":"dev16.in0","to":"dev3.out1"}
  ]
}
);

simcir.registerDevice('2to4Decoder',
{
  "width":400,
  "height":240,
  "showToolbox":false,
  "toolbox":[
  ],
  "devices":[
    {"type":"AND","numInputs":3,"id":"dev0","x":280,"y":24,"label":"AND"},
    {"type":"AND","numInputs":3,"id":"dev1","x":280,"y":72,"label":"AND"},
    {"type":"AND","numInputs":3,"id":"dev2","x":280,"y":120,"label":"AND"},
    {"type":"NOT","id":"dev3","x":192,"y":48,"label":"NOT"},
    {"type":"AND","numInputs":3,"id":"dev4","x":280,"y":168,"label":"AND"},
    {"type":"NOT","id":"dev5","x":192,"y":96,"label":"NOT"},
    {"type":"In","id":"dev6","x":192,"y":176,"label":"OE"},
    {"type":"In","id":"dev7","x":128,"y":48,"label":"D0"},
    {"type":"In","id":"dev8","x":128,"y":96,"label":"D1"},
    {"type":"Toggle","id":"dev9","x":80,"y":48,"label":"Toggle"},
    {"type":"Toggle","id":"dev10","x":80,"y":96,"label":"Toggle"},
    {"type":"DC","id":"dev11","x":32,"y":96,"label":"DC"},
    {"type":"Out","id":"dev12","x":328,"y":24,"label":"A0"},
    {"type":"Out","id":"dev13","x":328,"y":72,"label":"A1"},
    {"type":"Out","id":"dev14","x":328,"y":120,"label":"A2"},
    {"type":"Out","id":"dev15","x":328,"y":168,"label":"A3"},
    {"type":"Toggle","id":"dev16","x":80,"y":144,"label":"Toggle"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev3.out0"},
    {"from":"dev0.in1","to":"dev5.out0"},
    {"from":"dev0.in2","to":"dev6.out0"},
    {"from":"dev1.in0","to":"dev7.out0"},
    {"from":"dev1.in1","to":"dev5.out0"},
    {"from":"dev1.in2","to":"dev6.out0"},
    {"from":"dev2.in0","to":"dev3.out0"},
    {"from":"dev2.in1","to":"dev8.out0"},
    {"from":"dev2.in2","to":"dev6.out0"},
    {"from":"dev3.in0","to":"dev7.out0"},
    {"from":"dev4.in0","to":"dev7.out0"},
    {"from":"dev4.in1","to":"dev8.out0"},
    {"from":"dev4.in2","to":"dev6.out0"},
    {"from":"dev5.in0","to":"dev8.out0"},
    {"from":"dev6.in0","to":"dev16.out0"},
    {"from":"dev7.in0","to":"dev9.out0"},
    {"from":"dev8.in0","to":"dev10.out0"},
    {"from":"dev9.in0","to":"dev11.out0"},
    {"from":"dev10.in0","to":"dev11.out0"},
    {"from":"dev12.in0","to":"dev0.out0"},
    {"from":"dev13.in0","to":"dev1.out0"},
    {"from":"dev14.in0","to":"dev2.out0"},
    {"from":"dev15.in0","to":"dev4.out0"},
    {"from":"dev16.in0","to":"dev11.out0"}
  ]
}
);

simcir.registerDevice('3to8Decoder',
{
  "width":360,
  "height":440,
  "showToolbox":false,
  "toolbox":[
  ],
  "devices":[
    {"type":"In","id":"dev0","x":24,"y":144,"label":"D0"},
    {"type":"In","id":"dev1","x":24,"y":192,"label":"D1"},
    {"type":"In","id":"dev2","x":24,"y":240,"label":"D2"},
    {"type":"In","id":"dev3","x":24,"y":304,"label":"OE"},
    {"type":"NOT","id":"dev4","x":72,"y":240,"label":"NOT"},
    {"type":"AND","id":"dev5","x":120,"y":248,"label":"AND"},
    {"type":"AND","id":"dev6","x":120,"y":296,"label":"AND"},
    {"type":"2to4Decoder","id":"dev7","x":184,"y":144,"label":"2to4Decoder"},
    {"type":"2to4Decoder","id":"dev8","x":184,"y":224,"label":"2to4Decoder"},
    {"type":"Out","id":"dev9","x":296,"y":32,"label":"A0"},
    {"type":"Out","id":"dev10","x":296,"y":80,"label":"A1"},
    {"type":"Out","id":"dev11","x":296,"y":128,"label":"A2"},
    {"type":"Out","id":"dev12","x":296,"y":176,"label":"A3"},
    {"type":"Out","id":"dev13","x":296,"y":224,"label":"A4"},
    {"type":"Out","id":"dev14","x":296,"y":272,"label":"A5"},
    {"type":"Out","id":"dev15","x":296,"y":320,"label":"A6"},
    {"type":"Out","id":"dev16","x":296,"y":368,"label":"A7"}
  ],
  "connectors":[
    {"from":"dev4.in0","to":"dev2.out0"},
    {"from":"dev5.in0","to":"dev4.out0"},
    {"from":"dev5.in1","to":"dev3.out0"},
    {"from":"dev6.in0","to":"dev2.out0"},
    {"from":"dev6.in1","to":"dev3.out0"},
    {"from":"dev7.in0","to":"dev0.out0"},
    {"from":"dev7.in1","to":"dev1.out0"},
    {"from":"dev7.in2","to":"dev5.out0"},
    {"from":"dev8.in0","to":"dev0.out0"},
    {"from":"dev8.in1","to":"dev1.out0"},
    {"from":"dev8.in2","to":"dev6.out0"},
    {"from":"dev9.in0","to":"dev7.out0"},
    {"from":"dev10.in0","to":"dev7.out1"},
    {"from":"dev11.in0","to":"dev7.out2"},
    {"from":"dev12.in0","to":"dev7.out3"},
    {"from":"dev13.in0","to":"dev8.out0"},
    {"from":"dev14.in0","to":"dev8.out1"},
    {"from":"dev15.in0","to":"dev8.out2"},
    {"from":"dev16.in0","to":"dev8.out3"}
  ]
}
);

simcir.registerDevice('4to16Decoder',
{
  "width":440,
  "height":360,
  "showToolbox":false,
  "toolbox":[
  ],
  "devices":[
    {"type":"In","id":"dev0","x":32,"y":56,"label":"D0"},
    {"type":"In","id":"dev1","x":32,"y":104,"label":"D1"},
    {"type":"In","id":"dev2","x":32,"y":152,"label":"D2"},
    {"type":"In","id":"dev3","x":32,"y":200,"label":"D3"},
    {"type":"In","id":"dev4","x":32,"y":264,"label":"OE"},
    {"type":"NOT","id":"dev5","x":80,"y":200,"label":"NOT"},
    {"type":"AND","id":"dev6","x":136,"y":208,"label":"AND"},
    {"type":"AND","id":"dev7","x":136,"y":256,"label":"AND"},
    {"type":"3to8Decoder","id":"dev8","x":208,"y":32,"label":"3to8Decoder"},
    {"type":"3to8Decoder","id":"dev9","x":208,"y":184,"label":"3to8Decoder"},
    {"type":"BusOut","id":"dev10","x":320,"y":88,"label":"BusOut"},
    {"type":"BusOut","id":"dev11","x":320,"y":184,"label":"BusOut"},
    {"type":"Out","id":"dev12","x":376,"y":128,"label":"A0"},
    {"type":"Out","id":"dev13","x":376,"y":184,"label":"A1"}
  ],
  "connectors":[
    {"from":"dev5.in0","to":"dev3.out0"},
    {"from":"dev6.in0","to":"dev5.out0"},
    {"from":"dev6.in1","to":"dev4.out0"},
    {"from":"dev7.in0","to":"dev3.out0"},
    {"from":"dev7.in1","to":"dev4.out0"},
    {"from":"dev8.in0","to":"dev0.out0"},
    {"from":"dev8.in1","to":"dev1.out0"},
    {"from":"dev8.in2","to":"dev2.out0"},
    {"from":"dev8.in3","to":"dev6.out0"},
    {"from":"dev9.in0","to":"dev0.out0"},
    {"from":"dev9.in1","to":"dev1.out0"},
    {"from":"dev9.in2","to":"dev2.out0"},
    {"from":"dev9.in3","to":"dev7.out0"},
    {"from":"dev10.in0","to":"dev8.out0"},
    {"from":"dev10.in1","to":"dev8.out1"},
    {"from":"dev10.in2","to":"dev8.out2"},
    {"from":"dev10.in3","to":"dev8.out3"},
    {"from":"dev10.in4","to":"dev8.out4"},
    {"from":"dev10.in5","to":"dev8.out5"},
    {"from":"dev10.in6","to":"dev8.out6"},
    {"from":"dev10.in7","to":"dev8.out7"},
    {"from":"dev11.in0","to":"dev9.out0"},
    {"from":"dev11.in1","to":"dev9.out1"},
    {"from":"dev11.in2","to":"dev9.out2"},
    {"from":"dev11.in3","to":"dev9.out3"},
    {"from":"dev11.in4","to":"dev9.out4"},
    {"from":"dev11.in5","to":"dev9.out5"},
    {"from":"dev11.in6","to":"dev9.out6"},
    {"from":"dev11.in7","to":"dev9.out7"},
    {"from":"dev12.in0","to":"dev10.out0"},
    {"from":"dev13.in0","to":"dev11.out0"}
  ]
}
);

//
// Décodeurs/encodeurs
//

simcir.registerDevice('2to4DecoderBus',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"In","id":"dev0","x":40,"y":392,"label":"D"},
    {"type":"Out","id":"dev1","x":360,"y":304,"label":"A0"},
    {"type":"Out","id":"dev2","x":360,"y":368,"label":"A1"},
    {"type":"Out","id":"dev3","x":360,"y":432,"label":"A2"},
    {"type":"2to4Decoder","id":"dev4","x":224,"y":384,"label":"2to4Decoder"},
    {"type":"BusIn","id":"dev5","x":136,"y":392,"label":"BusIn","numOutputs":2},
    {"type":"Out","id":"dev6","x":360,"y":496,"label":"A3"},
    {"type":"DC","id":"dev7","x":160,"y":472,"label":"DC"}
  ],
  "connectors":[
    {"from":"dev1.in0","to":"dev4.out0"},
    {"from":"dev2.in0","to":"dev4.out1"},
    {"from":"dev3.in0","to":"dev4.out2"},
    {"from":"dev4.in0","to":"dev5.out0"},
    {"from":"dev4.in1","to":"dev5.out1"},
    {"from":"dev4.in2","to":"dev7.out0"},
    {"from":"dev5.in0","to":"dev0.out0"},
    {"from":"dev6.in0","to":"dev4.out3"}
  ]
}
);

simcir.registerDevice('4to2PrioEncoder',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"In","id":"dev0","x":216,"y":368,"label":"D1"},
    {"type":"In","id":"dev1","x":216,"y":424,"label":"D2"},
    {"type":"In","id":"dev2","x":216,"y":480,"label":"D3"},
    {"type":"In","id":"dev3","x":216,"y":312,"label":"D0"},
    {"type":"RotaryEncoder","id":"dev4","x":96,"y":376,"label":"RotaryEncoder"},
    {"type":"DC","id":"dev5","x":40,"y":392,"label":"DC"},
    {"type":"Out","id":"dev6","x":624,"y":352,"label":"S0"},
    {"type":"Out","id":"dev7","x":624,"y":432,"label":"S1"},
    {"type":"OR","id":"dev8","x":304,"y":440,"label":"OR"},
    {"type":"NOT","id":"dev9","x":376,"y":400,"label":"NOT"},
    {"type":"AND","id":"dev10","x":448,"y":368,"label":"AND"},
    {"type":"OR","id":"dev11","x":528,"y":360,"label":"OR"},
    {"type":"4bit7seg","id":"dev12","x":712,"y":392,"label":"4bit7seg"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev4.out1"},
    {"from":"dev1.in0","to":"dev4.out2"},
    {"from":"dev2.in0","to":"dev4.out3"},
    {"from":"dev3.in0","to":"dev4.out0"},
    {"from":"dev4.in0","to":"dev5.out0"},
    {"from":"dev6.in0","to":"dev11.out0"},
    {"from":"dev7.in0","to":"dev8.out0"},
    {"from":"dev8.in0","to":"dev1.out0"},
    {"from":"dev8.in1","to":"dev2.out0"},
    {"from":"dev9.in0","to":"dev8.out0"},
    {"from":"dev10.in0","to":"dev0.out0"},
    {"from":"dev10.in1","to":"dev9.out0"},
    {"from":"dev11.in0","to":"dev10.out0"},
    {"from":"dev11.in1","to":"dev2.out0"},
    {"from":"dev12.in0","to":"dev6.out0"},
    {"from":"dev12.in1","to":"dev7.out0"}
  ]
}
);

//
// Multiplexeurs/démultiplexeurs
//

simcir.registerDevice('Mux',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"In","id":"dev0","x":136,"y":400,"label":"D1"},
    {"type":"2to4Decoder","id":"dev1","x":248,"y":176,"label":"2to4Decoder"},
    {"type":"In","id":"dev2","x":120,"y":192,"label":"Sel"},
    {"type":"BusIn","id":"dev3","x":184,"y":192,"label":"BusIn","numOutputs":2},
    {"type":"In","id":"dev4","x":136,"y":472,"label":"D2"},
    {"type":"In","id":"dev5","x":136,"y":544,"label":"D3"},
    {"type":"AND","id":"dev6","x":336,"y":328,"label":"AND"},
    {"type":"AND","id":"dev7","x":336,"y":472,"label":"AND"},
    {"type":"AND","id":"dev8","x":336,"y":544,"label":"AND"},
    {"type":"In","id":"dev9","x":136,"y":328,"label":"D0"},
    {"type":"DC","id":"dev10","x":184,"y":264,"label":"DC"},
    {"type":"AND","id":"dev11","x":336,"y":400,"label":"AND"},
    {"type":"OR","numInputs":4,"id":"dev12","x":456,"y":424,"label":"OR"},
    {"type":"Out","id":"dev13","x":536,"y":424,"label":"S"}
  ],
  "connectors":[
    {"from":"dev1.in0","to":"dev3.out0"},
    {"from":"dev1.in1","to":"dev3.out1"},
    {"from":"dev1.in2","to":"dev10.out0"},
    {"from":"dev3.in0","to":"dev2.out0"},
    {"from":"dev6.in0","to":"dev1.out0"},
    {"from":"dev6.in1","to":"dev9.out0"},
    {"from":"dev7.in0","to":"dev1.out2"},
    {"from":"dev7.in1","to":"dev4.out0"},
    {"from":"dev8.in0","to":"dev1.out3"},
    {"from":"dev8.in1","to":"dev5.out0"},
    {"from":"dev11.in0","to":"dev1.out1"},
    {"from":"dev11.in1","to":"dev0.out0"},
    {"from":"dev12.in0","to":"dev6.out0"},
    {"from":"dev12.in1","to":"dev11.out0"},
    {"from":"dev12.in2","to":"dev7.out0"},
    {"from":"dev12.in3","to":"dev8.out0"},
    {"from":"dev13.in0","to":"dev12.out0"}
  ]
}
);

simcir.registerDevice('Mux2',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"In","id":"dev0","x":208,"y":168,"label":"Sel"},
    {"type":"NOT","id":"dev1","x":264,"y":168,"label":"NOT"},
    {"type":"AND","id":"dev2","x":336,"y":256,"label":"AND"},
    {"type":"Out","id":"dev3","x":496,"y":304,"label":"S"},
    {"type":"OR","id":"dev4","x":424,"y":304,"label":"OR"},
    {"type":"In","id":"dev5","x":208,"y":264,"label":"D0"},
    {"type":"In","id":"dev6","x":208,"y":344,"label":"D1"},
    {"type":"AND","id":"dev7","x":336,"y":336,"label":"AND"},
    {"type":"Toggle","id":"dev8","x":152,"y":168,"label":"Toggle"},
    {"type":"DC","id":"dev9","x":72,"y":264,"label":"DC"},
    {"type":"Toggle","id":"dev10","x":152,"y":264,"label":"Toggle"},
    {"type":"Toggle","id":"dev11","x":152,"y":344,"label":"Toggle"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev8.out0"},
    {"from":"dev1.in0","to":"dev0.out0"},
    {"from":"dev2.in0","to":"dev1.out0"},
    {"from":"dev2.in1","to":"dev5.out0"},
    {"from":"dev3.in0","to":"dev4.out0"},
    {"from":"dev4.in0","to":"dev2.out0"},
    {"from":"dev4.in1","to":"dev7.out0"},
    {"from":"dev5.in0","to":"dev10.out0"},
    {"from":"dev6.in0","to":"dev11.out0"},
    {"from":"dev7.in0","to":"dev0.out0"},
    {"from":"dev7.in1","to":"dev6.out0"},
    {"from":"dev8.in0","to":"dev9.out0"},
    {"from":"dev10.in0","to":"dev9.out0"},
    {"from":"dev11.in0","to":"dev9.out0"}
  ]
}
);

simcir.registerDevice('MuxBus',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"In","id":"dev0","x":136,"y":328,"label":"D0"},
    {"type":"In","id":"dev1","x":136,"y":400,"label":"D1"},
    {"type":"2to4Decoder","id":"dev2","x":248,"y":176,"label":"2to4Decoder"},
    {"type":"In","id":"dev3","x":120,"y":192,"label":"Sel"},
    {"type":"BusIn","id":"dev4","x":184,"y":192,"label":"BusIn","numOutputs":2},
    {"type":"AndBus1","id":"dev5","x":352,"y":336,"label":"AndBus1"},
    {"type":"AndBus1","id":"dev6","x":352,"y":408,"label":"AndBus1"},
    {"type":"AndBus1","id":"dev7","x":352,"y":552,"label":"AndBus1"},
    {"type":"AndBus1","id":"dev8","x":352,"y":480,"label":"AndBus1"},
    {"type":"In","id":"dev9","x":136,"y":472,"label":"D2"},
    {"type":"In","id":"dev10","x":136,"y":544,"label":"D3"},
    {"type":"OrBus","id":"dev11","x":480,"y":376,"label":"OrBus"},
    {"type":"OrBus","id":"dev12","x":480,"y":512,"label":"OrBus"},
    {"type":"OrBus","id":"dev13","x":584,"y":440,"label":"OrBus"},
    {"type":"Out","id":"dev14","x":680,"y":440,"label":"S"},
    {"type":"DC","id":"dev15","x":192,"y":280,"label":"DC"}
  ],
  "connectors":[
    {"from":"dev2.in0","to":"dev4.out0"},
    {"from":"dev2.in1","to":"dev4.out1"},
    {"from":"dev2.in2","to":"dev15.out0"},
    {"from":"dev4.in0","to":"dev3.out0"},
    {"from":"dev5.in0","to":"dev0.out0"},
    {"from":"dev5.in1","to":"dev2.out0"},
    {"from":"dev6.in0","to":"dev1.out0"},
    {"from":"dev6.in1","to":"dev2.out1"},
    {"from":"dev7.in0","to":"dev10.out0"},
    {"from":"dev7.in1","to":"dev2.out3"},
    {"from":"dev8.in0","to":"dev9.out0"},
    {"from":"dev8.in1","to":"dev2.out2"},
    {"from":"dev11.in0","to":"dev5.out0"},
    {"from":"dev11.in1","to":"dev6.out0"},
    {"from":"dev12.in0","to":"dev8.out0"},
    {"from":"dev12.in1","to":"dev7.out0"},
    {"from":"dev13.in0","to":"dev11.out0"},
    {"from":"dev13.in1","to":"dev12.out0"},
    {"from":"dev14.in0","to":"dev13.out0"}
  ]
}
);

simcir.registerDevice('MuxBus2',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"AndBus1","id":"dev0","x":352,"y":216,"label":"AndBus1"},
    {"type":"OrBus","id":"dev1","x":480,"y":248,"label":"OrBus"},
    {"type":"Out","id":"dev2","x":592,"y":248,"label":"S"},
    {"type":"AndBus1","id":"dev3","x":352,"y":288,"label":"AndBus1"},
    {"type":"In","id":"dev4","x":208,"y":96,"label":"Sel"},
    {"type":"In","id":"dev5","x":208,"y":208,"label":"D0"},
    {"type":"In","id":"dev6","x":208,"y":288,"label":"D1"},
    {"type":"NOT","id":"dev7","x":288,"y":96,"label":"NOT"},
    {"type":"4bit7segBus","id":"dev8","x":664,"y":232,"label":"4bit7segBus"},
    {"type":"RotaryEncoderBus","id":"dev9","x":104,"y":192,"label":"RotaryEncoderBus"},
    {"type":"RotaryEncoderBus","id":"dev10","x":104,"y":272,"label":"RotaryEncoderBus"},
    {"type":"DC","id":"dev11","x":16,"y":208,"label":"DC"},
    {"type":"Toggle","id":"dev12","x":104,"y":96,"label":"Toggle"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev5.out0"},
    {"from":"dev0.in1","to":"dev7.out0"},
    {"from":"dev1.in0","to":"dev0.out0"},
    {"from":"dev1.in1","to":"dev3.out0"},
    {"from":"dev2.in0","to":"dev1.out0"},
    {"from":"dev3.in0","to":"dev6.out0"},
    {"from":"dev3.in1","to":"dev4.out0"},
    {"from":"dev4.in0","to":"dev12.out0"},
    {"from":"dev5.in0","to":"dev9.out0"},
    {"from":"dev6.in0","to":"dev10.out0"},
    {"from":"dev7.in0","to":"dev4.out0"},
    {"from":"dev8.in0","to":"dev2.out0"},
    {"from":"dev9.in0","to":"dev11.out0"},
    {"from":"dev10.in0","to":"dev11.out0"},
    {"from":"dev12.in0","to":"dev11.out0"}
  ]
}
);

simcir.registerDevice('Demux',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"2to4Decoder","id":"dev0","x":248,"y":176,"label":"2to4Decoder"},
    {"type":"In","id":"dev1","x":120,"y":192,"label":"S"},
    {"type":"BusIn","id":"dev2","x":184,"y":192,"label":"BusIn","numOutputs":2},
    {"type":"Out","id":"dev3","x":464,"y":328,"label":"S0"},
    {"type":"Out","id":"dev4","x":464,"y":408,"label":"S1"},
    {"type":"Out","id":"dev5","x":464,"y":480,"label":"S2"},
    {"type":"Out","id":"dev6","x":464,"y":552,"label":"S3"},
    {"type":"AND","id":"dev7","x":368,"y":328,"label":"AND"},
    {"type":"AND","id":"dev8","x":368,"y":408,"label":"AND"},
    {"type":"AND","id":"dev9","x":368,"y":480,"label":"AND"},
    {"type":"AND","id":"dev10","x":368,"y":552,"label":"AND"},
    {"type":"In","id":"dev11","x":176,"y":400,"label":"D"},
    {"type":"DC","id":"dev12","x":192,"y":280,"label":"DC"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev2.out0"},
    {"from":"dev0.in1","to":"dev2.out1"},
    {"from":"dev0.in2","to":"dev12.out0"},
    {"from":"dev2.in0","to":"dev1.out0"},
    {"from":"dev3.in0","to":"dev7.out0"},
    {"from":"dev4.in0","to":"dev8.out0"},
    {"from":"dev5.in0","to":"dev9.out0"},
    {"from":"dev6.in0","to":"dev10.out0"},
    {"from":"dev7.in0","to":"dev11.out0"},
    {"from":"dev7.in1","to":"dev0.out0"},
    {"from":"dev8.in0","to":"dev11.out0"},
    {"from":"dev8.in1","to":"dev0.out1"},
    {"from":"dev9.in0","to":"dev11.out0"},
    {"from":"dev9.in1","to":"dev0.out2"},
    {"from":"dev10.in0","to":"dev11.out0"},
    {"from":"dev10.in1","to":"dev0.out3"}
  ]
}
);

simcir.registerDevice('DemuxBus',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"2to4Decoder","id":"dev0","x":248,"y":176,"label":"2to4Decoder"},
    {"type":"In","id":"dev1","x":120,"y":192,"label":"S"},
    {"type":"BusIn","id":"dev2","x":184,"y":192,"label":"BusIn","numOutputs":2},
    {"type":"In","id":"dev3","x":176,"y":400,"label":"D"},
    {"type":"AndBus1","id":"dev4","x":360,"y":328,"label":"AndBus1"},
    {"type":"Out","id":"dev5","x":464,"y":328,"label":"S0"},
    {"type":"Out","id":"dev6","x":464,"y":408,"label":"S1"},
    {"type":"Out","id":"dev7","x":464,"y":480,"label":"S2"},
    {"type":"AndBus1","id":"dev8","x":360,"y":408,"label":"AndBus1"},
    {"type":"Out","id":"dev9","x":464,"y":552,"label":"S3"},
    {"type":"AndBus1","id":"dev10","x":360,"y":480,"label":"AndBus1"},
    {"type":"AndBus1","id":"dev11","x":360,"y":552,"label":"AndBus1"},
    {"type":"DC","id":"dev12","x":176,"y":288,"label":"DC"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev2.out0"},
    {"from":"dev0.in1","to":"dev2.out1"},
    {"from":"dev0.in2","to":"dev12.out0"},
    {"from":"dev2.in0","to":"dev1.out0"},
    {"from":"dev4.in0","to":"dev3.out0"},
    {"from":"dev4.in1","to":"dev0.out0"},
    {"from":"dev5.in0","to":"dev4.out0"},
    {"from":"dev6.in0","to":"dev8.out0"},
    {"from":"dev7.in0","to":"dev10.out0"},
    {"from":"dev8.in0","to":"dev3.out0"},
    {"from":"dev8.in1","to":"dev0.out1"},
    {"from":"dev9.in0","to":"dev11.out0"},
    {"from":"dev10.in0","to":"dev3.out0"},
    {"from":"dev10.in1","to":"dev0.out2"},
    {"from":"dev11.in0","to":"dev3.out0"},
    {"from":"dev11.in1","to":"dev0.out3"}
  ]
}
);

//
// Calculs
//

simcir.registerDevice('Inc',
{
  "width":1000,
  "height":600,
  "showToolbox":false,
  "devices":[
    {"type":"FullAdder","id":"dev0","x":472,"y":248,"label":"FullAdder"},
    {"type":"FullAdder","id":"dev1","x":472,"y":320,"label":"FullAdder"},
    {"type":"FullAdder","id":"dev2","x":472,"y":384,"label":"FullAdder"},
    {"type":"In","id":"dev3","x":232,"y":184,"label":"D0"},
    {"type":"Out","id":"dev4","x":624,"y":168,"label":"A0"},
    {"type":"In","id":"dev5","x":232,"y":232,"label":"D1"},
    {"type":"Out","id":"dev6","x":624,"y":232,"label":"A1"},
    {"type":"In","id":"dev7","x":232,"y":280,"label":"D2"},
    {"type":"Out","id":"dev8","x":624,"y":320,"label":"A2"},
    {"type":"In","id":"dev9","x":232,"y":328,"label":"D3"},
    {"type":"Out","id":"dev10","x":632,"y":384,"label":"A3"},
    {"type":"DC","id":"dev11","x":32,"y":224,"label":"DC"},
    {"type":"Toggle","id":"dev12","x":112,"y":184,"label":"Toggle"},
    {"type":"Toggle","id":"dev13","x":112,"y":232,"label":"Toggle"},
    {"type":"Toggle","id":"dev14","x":112,"y":280,"label":"Toggle"},
    {"type":"Toggle","id":"dev15","x":112,"y":328,"label":"Toggle"},
    {"type":"FullAdder","id":"dev16","x":472,"y":168,"label":"FullAdder"},
    {"type":"NOT","id":"dev17","x":400,"y":408,"label":"NOT"},
    {"type":"Out","id":"dev18","x":632,"y":456,"label":"C"},
    {"type":"DC","id":"dev19","x":328,"y":408,"label":"DC"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev16.out1"},
    {"from":"dev0.in1","to":"dev5.out0"},
    {"from":"dev0.in2","to":"dev17.out0"},
    {"from":"dev1.in0","to":"dev0.out1"},
    {"from":"dev1.in1","to":"dev7.out0"},
    {"from":"dev1.in2","to":"dev17.out0"},
    {"from":"dev2.in0","to":"dev1.out1"},
    {"from":"dev2.in1","to":"dev9.out0"},
    {"from":"dev2.in2","to":"dev17.out0"},
    {"from":"dev3.in0","to":"dev12.out0"},
    {"from":"dev4.in0","to":"dev16.out0"},
    {"from":"dev5.in0","to":"dev13.out0"},
    {"from":"dev6.in0","to":"dev0.out0"},
    {"from":"dev7.in0","to":"dev14.out0"},
    {"from":"dev8.in0","to":"dev1.out0"},
    {"from":"dev9.in0","to":"dev15.out0"},
    {"from":"dev10.in0","to":"dev2.out0"},
    {"from":"dev12.in0","to":"dev11.out0"},
    {"from":"dev13.in0","to":"dev11.out0"},
    {"from":"dev14.in0","to":"dev11.out0"},
    {"from":"dev15.in0","to":"dev11.out0"},
    {"from":"dev16.in0","to":"dev17.out0"},
    {"from":"dev16.in1","to":"dev3.out0"},
    {"from":"dev16.in2","to":"dev19.out0"},
    {"from":"dev17.in0","to":"dev19.out0"},
    {"from":"dev18.in0","to":"dev2.out1"}
  ]
}
);

simcir.registerDevice('IncBus',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"Inc","id":"dev0","x":248,"y":392,"label":"Inc"},
    {"type":"BusOut","id":"dev1","x":360,"y":400,"label":"BusOut","numInputs":4},
    {"type":"BusIn","id":"dev2","x":176,"y":400,"label":"BusIn","numOutputs":4},
    {"type":"Out","id":"dev3","x":464,"y":416,"label":"A"},
    {"type":"In","id":"dev4","x":88,"y":416,"label":"D"},
    {"type":"Out","id":"dev5","x":464,"y":488,"label":"C"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev2.out0"},
    {"from":"dev0.in1","to":"dev2.out1"},
    {"from":"dev0.in2","to":"dev2.out2"},
    {"from":"dev0.in3","to":"dev2.out3"},
    {"from":"dev1.in0","to":"dev0.out0"},
    {"from":"dev1.in1","to":"dev0.out1"},
    {"from":"dev1.in2","to":"dev0.out2"},
    {"from":"dev1.in3","to":"dev0.out3"},
    {"from":"dev2.in0","to":"dev4.out0"},
    {"from":"dev3.in0","to":"dev1.out0"},
    {"from":"dev5.in0","to":"dev0.out4"}
  ]
}
);

simcir.registerDevice('AddBus',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"4bitAdder","id":"dev0","x":432,"y":240,"label":"4bitAdder"},
    {"type":"BusOut","id":"dev1","x":560,"y":288,"label":"BusOut"},
    {"type":"BusIn","id":"dev2","x":344,"y":264,"label":"BusIn"},
    {"type":"BusIn","id":"dev3","x":344,"y":336,"label":"BusIn"},
    {"type":"In","id":"dev4","x":320,"y":192,"label":"Cin"},
    {"type":"In","id":"dev5","x":224,"y":272,"label":"A"},
    {"type":"In","id":"dev6","x":224,"y":344,"label":"B"},
    {"type":"Out","id":"dev7","x":664,"y":352,"label":"Cout"},
    {"type":"Out","id":"dev8","x":664,"y":288,"label":"S"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev4.out0"},
    {"from":"dev0.in1","to":"dev2.out0"},
    {"from":"dev0.in2","to":"dev2.out1"},
    {"from":"dev0.in3","to":"dev2.out2"},
    {"from":"dev0.in4","to":"dev2.out3"},
    {"from":"dev0.in5","to":"dev3.out0"},
    {"from":"dev0.in6","to":"dev3.out1"},
    {"from":"dev0.in7","to":"dev3.out2"},
    {"from":"dev0.in8","to":"dev3.out3"},
    {"from":"dev1.in0","to":"dev0.out0"},
    {"from":"dev1.in1","to":"dev0.out1"},
    {"from":"dev1.in2","to":"dev0.out2"},
    {"from":"dev1.in3","to":"dev0.out3"},
    {"from":"dev2.in0","to":"dev5.out0"},
    {"from":"dev3.in0","to":"dev6.out0"},
    {"from":"dev7.in0","to":"dev0.out4"},
    {"from":"dev8.in0","to":"dev1.out0"}
  ]
}
);

simcir.registerDevice('NegBus',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"NOT","id":"dev0","x":352,"y":88,"label":"NOT"},
    {"type":"NOT","id":"dev1","x":352,"y":136,"label":"NOT"},
    {"type":"NOT","id":"dev2","x":352,"y":184,"label":"NOT"},
    {"type":"NOT","id":"dev3","x":352,"y":232,"label":"NOT"},
    {"type":"IncBus","id":"dev4","x":520,"y":160,"label":"IncBus"},
    {"type":"Out","id":"dev5","x":616,"y":152,"label":"D"},
    {"type":"BusIn","id":"dev6","x":264,"y":152,"label":"BusIn"},
    {"type":"In","id":"dev7","x":200,"y":160,"label":"A"},
    {"type":"BusOut","id":"dev8","x":440,"y":152,"label":"BusOut"},
    {"type":"RotaryEncoderBus","id":"dev9","x":88,"y":144,"label":"RotaryEncoderBus"},
    {"type":"4bit7segBus","id":"dev10","x":184,"y":16,"label":"4bit7segBus"},
    {"type":"4bit7segBus","id":"dev11","x":688,"y":24,"label":"4bit7segBus"},
    {"type":"DC","id":"dev12","x":16,"y":160,"label":"DC"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev6.out0"},
    {"from":"dev1.in0","to":"dev6.out1"},
    {"from":"dev2.in0","to":"dev6.out2"},
    {"from":"dev3.in0","to":"dev6.out3"},
    {"from":"dev4.in0","to":"dev8.out0"},
    {"from":"dev5.in0","to":"dev4.out0"},
    {"from":"dev6.in0","to":"dev7.out0"},
    {"from":"dev7.in0","to":"dev9.out0"},
    {"from":"dev8.in0","to":"dev0.out0"},
    {"from":"dev8.in1","to":"dev1.out0"},
    {"from":"dev8.in2","to":"dev2.out0"},
    {"from":"dev8.in3","to":"dev3.out0"},
    {"from":"dev9.in0","to":"dev12.out0"},
    {"from":"dev10.in0","to":"dev9.out0"},
    {"from":"dev11.in0","to":"dev5.out0"}
  ]
}
);

simcir.registerDevice('SubBus',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"AddBus","id":"dev0","x":456,"y":192,"label":"AddBus"},
    {"type":"In","id":"dev1","x":232,"y":208,"label":"B"},
    {"type":"In","id":"dev2","x":232,"y":152,"label":"A"},
    {"type":"4bit7segBus","id":"dev3","x":216,"y":304,"label":"4bit7segBus"},
    {"type":"RotaryEncoderBus","id":"dev4","x":112,"y":120,"label":"RotaryEncoderBus"},
    {"type":"RotaryEncoderBus","id":"dev5","x":112,"y":208,"label":"RotaryEncoderBus"},
    {"type":"4bit7segBus","id":"dev6","x":216,"y":16,"label":"4bit7segBus"},
    {"type":"DC","id":"dev7","x":24,"y":184,"label":"DC"},
    {"type":"In","id":"dev8","x":376,"y":280,"label":"Cin"},
    {"type":"4bit7segBus","id":"dev9","x":584,"y":72,"label":"4bit7segBus"},
    {"type":"Out","id":"dev10","x":552,"y":192,"label":"S"},
    {"type":"Out","id":"dev11","x":552,"y":280,"label":"Cout"},
    {"type":"NegBus","id":"dev12","x":328,"y":168,"label":"NegBus"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev12.out0"},
    {"from":"dev0.in1","to":"dev1.out0"},
    {"from":"dev0.in2","to":"dev8.out0"},
    {"from":"dev1.in0","to":"dev5.out0"},
    {"from":"dev2.in0","to":"dev4.out0"},
    {"from":"dev3.in0","to":"dev5.out0"},
    {"from":"dev4.in0","to":"dev7.out0"},
    {"from":"dev5.in0","to":"dev7.out0"},
    {"from":"dev6.in0","to":"dev4.out0"},
    {"from":"dev9.in0","to":"dev0.out0"},
    {"from":"dev10.in0","to":"dev0.out0"},
    {"from":"dev11.in0","to":"dev0.out1"},
    {"from":"dev12.in0","to":"dev2.out0"}
  ]
}
);

simcir.registerDevice('EqualBus',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"In","id":"dev0","x":232,"y":304,"label":"In"},
    {"type":"RotaryEncoderBus","id":"dev1","x":120,"y":288,"label":"RotaryEncoderBus"},
    {"type":"RotaryEncoderBus","id":"dev2","x":120,"y":400,"label":"RotaryEncoderBus"},
    {"type":"DC","id":"dev3","x":32,"y":360,"label":"DC"},
    {"type":"In","id":"dev4","x":232,"y":416,"label":"In"},
    {"type":"BusIn","id":"dev5","x":296,"y":408,"label":"BusIn"},
    {"type":"BusIn","id":"dev6","x":296,"y":304,"label":"BusIn"},
    {"type":"XNOR","id":"dev7","x":376,"y":280,"label":"XNOR"},
    {"type":"XNOR","id":"dev8","x":376,"y":336,"label":"XNOR"},
    {"type":"XNOR","id":"dev9","x":376,"y":392,"label":"XNOR"},
    {"type":"XNOR","id":"dev10","x":376,"y":448,"label":"XNOR"},
    {"type":"AND","id":"dev11","x":456,"y":360,"label":"AND","numInputs":4},
    {"type":"Out","id":"dev12","x":512,"y":360,"label":"Out"},
    {"type":"LED","id":"dev13","x":568,"y":360,"label":"LED"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev1.out0"},
    {"from":"dev1.in0","to":"dev3.out0"},
    {"from":"dev2.in0","to":"dev3.out0"},
    {"from":"dev4.in0","to":"dev2.out0"},
    {"from":"dev5.in0","to":"dev4.out0"},
    {"from":"dev6.in0","to":"dev0.out0"},
    {"from":"dev7.in0","to":"dev6.out0"},
    {"from":"dev7.in1","to":"dev5.out0"},
    {"from":"dev8.in0","to":"dev6.out1"},
    {"from":"dev8.in1","to":"dev5.out1"},
    {"from":"dev9.in0","to":"dev6.out2"},
    {"from":"dev9.in1","to":"dev5.out2"},
    {"from":"dev10.in0","to":"dev6.out3"},
    {"from":"dev10.in1","to":"dev5.out3"},
    {"from":"dev11.in0","to":"dev7.out0"},
    {"from":"dev11.in1","to":"dev8.out0"},
    {"from":"dev11.in2","to":"dev9.out0"},
    {"from":"dev11.in3","to":"dev10.out0"},
    {"from":"dev12.in0","to":"dev11.out0"},
    {"from":"dev13.in0","to":"dev12.out0"}
  ]
}
);

// Ancienne version, ne fonctionne pas bien car apparemment DC n'est pas inclut
// dans le circuit...
//{
//  "width":1000,
//  "height":600,
//  "showToolbox":false,
//  "toolbox":[
//  ],
//     "devices":[
//    {"type":"FullAdder","id":"dev0","x":472,"y":168,"label":"FullAdder"},
//    {"type":"FullAdder","id":"dev1","x":472,"y":248,"label":"FullAdder"},
//    {"type":"FullAdder","id":"dev2","x":472,"y":320,"label":"FullAdder"},
//    {"type":"FullAdder","id":"dev3","x":472,"y":384,"label":"FullAdder"},
//    {"type":"DC","id":"dev4","x":344,"y":408,"label":"DC"},
//    {"type":"NOT","id":"dev5","x":400,"y":408,"label":"NOT"},
//    {"type":"In","id":"dev6","x":384,"y":176,"label":"D0"},
//    {"type":"Out","id":"dev7","x":584,"y":168,"label":"A0"},
//    {"type":"In","id":"dev8","x":384,"y":224,"label":"D1"},
//    {"type":"Out","id":"dev9","x":584,"y":232,"label":"A1"},
//    {"type":"In","id":"dev10","x":384,"y":272,"label":"D2"},
//    {"type":"Out","id":"dev11","x":584,"y":320,"label":"A2"},
//    {"type":"In","id":"dev12","x":384,"y":320,"label":"D3"},
//    {"type":"Out","id":"dev13","x":592,"y":384,"label":"A3"},
//    {"type":"DC","id":"dev14","x":240,"y":224,"label":"DC"},
//    {"type":"Toggle","id":"dev15","x":312,"y":176,"label":"Toggle"},
//    {"type":"Toggle","id":"dev16","x":320,"y":232,"label":"Toggle"},
//    {"type":"Toggle","id":"dev17","x":320,"y":280,"label":"Toggle"},
//    {"type":"Toggle","id":"dev18","x":320,"y":328,"label":"Toggle"}
//  ],
//  "connectors":[
//    {"from":"dev0.in0","to":"dev5.out0"},
//    {"from":"dev0.in1","to":"dev6.out0"},
//    {"from":"dev0.in2","to":"dev4.out0"},
//    {"from":"dev1.in0","to":"dev0.out1"},
//    {"from":"dev1.in1","to":"dev8.out0"},
//    {"from":"dev1.in2","to":"dev5.out0"},
//    {"from":"dev2.in0","to":"dev1.out1"},
//    {"from":"dev2.in1","to":"dev10.out0"},
//    {"from":"dev2.in2","to":"dev5.out0"},
//    {"from":"dev3.in0","to":"dev2.out1"},
//    {"from":"dev3.in1","to":"dev12.out0"},
//    {"from":"dev3.in2","to":"dev5.out0"},
//    {"from":"dev5.in0","to":"dev4.out0"},
//    {"from":"dev6.in0","to":"dev15.out0"},
//    {"from":"dev7.in0","to":"dev0.out0"},
//    {"from":"dev8.in0","to":"dev16.out0"},
//    {"from":"dev9.in0","to":"dev1.out0"},
//    {"from":"dev10.in0","to":"dev17.out0"},
//    {"from":"dev11.in0","to":"dev2.out0"},
//    {"from":"dev12.in0","to":"dev18.out0"},
//    {"from":"dev13.in0","to":"dev3.out0"},
//    {"from":"dev15.in0","to":"dev14.out0"},
//    {"from":"dev16.in0","to":"dev14.out0"},
//    {"from":"dev17.in0","to":"dev14.out0"},
//    {"from":"dev18.in0","to":"dev14.out0"}
//  ]
//}

simcir.registerDevice('AndBus1',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"AND","id":"dev0","x":264,"y":280,"label":"AND"},
    {"type":"BusIn","id":"dev1","x":176,"y":280,"label":"BusIn"},
    {"type":"AND","id":"dev2","x":264,"y":216,"label":"AND"},
    {"type":"AND","id":"dev3","x":264,"y":344,"label":"AND"},
    {"type":"AND","id":"dev4","x":264,"y":408,"label":"AND"},
    {"type":"In","id":"dev5","x":96,"y":280,"label":"Dx"},
    {"type":"In","id":"dev6","x":184,"y":200,"label":"D0"},
    {"type":"BusOut","id":"dev7","x":368,"y":280,"label":"BusOut"},
    {"type":"Out","id":"dev8","x":456,"y":288,"label":"A"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev6.out0"},
    {"from":"dev0.in1","to":"dev1.out1"},
    {"from":"dev1.in0","to":"dev5.out0"},
    {"from":"dev2.in0","to":"dev6.out0"},
    {"from":"dev2.in1","to":"dev1.out0"},
    {"from":"dev3.in0","to":"dev6.out0"},
    {"from":"dev3.in1","to":"dev1.out2"},
    {"from":"dev4.in0","to":"dev6.out0"},
    {"from":"dev4.in1","to":"dev1.out3"},
    {"from":"dev7.in0","to":"dev2.out0"},
    {"from":"dev7.in1","to":"dev0.out0"},
    {"from":"dev7.in2","to":"dev3.out0"},
    {"from":"dev7.in3","to":"dev4.out0"},
    {"from":"dev8.in0","to":"dev7.out0"}
  ]
}
);

simcir.registerDevice('OrBus',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"OR","id":"dev0","x":304,"y":240,"label":"OR"},
    {"type":"OR","id":"dev1","x":304,"y":296,"label":"OR"},
    {"type":"OR","id":"dev2","x":304,"y":360,"label":"OR"},
    {"type":"OR","id":"dev3","x":304,"y":432,"label":"OR"},
    {"type":"BusIn","id":"dev4","x":192,"y":360,"label":"BusIn"},
    {"type":"BusIn","id":"dev5","x":192,"y":280,"label":"BusIn"},
    {"type":"BusOut","id":"dev6","x":424,"y":296,"label":"BusOut"},
    {"type":"In","id":"dev7","x":112,"y":288,"label":"In"},
    {"type":"In","id":"dev8","x":112,"y":368,"label":"In"},
    {"type":"Out","id":"dev9","x":520,"y":304,"label":"Out"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev5.out0"},
    {"from":"dev0.in1","to":"dev4.out0"},
    {"from":"dev1.in0","to":"dev5.out1"},
    {"from":"dev1.in1","to":"dev4.out1"},
    {"from":"dev2.in0","to":"dev5.out2"},
    {"from":"dev2.in1","to":"dev4.out2"},
    {"from":"dev3.in0","to":"dev5.out3"},
    {"from":"dev3.in1","to":"dev4.out3"},
    {"from":"dev4.in0","to":"dev8.out0"},
    {"from":"dev5.in0","to":"dev7.out0"},
    {"from":"dev6.in0","to":"dev0.out0"},
    {"from":"dev6.in1","to":"dev1.out0"},
    {"from":"dev6.in2","to":"dev2.out0"},
    {"from":"dev6.in3","to":"dev3.out0"},
    {"from":"dev9.in0","to":"dev6.out0"}
  ]
}
);

//
// Registres
//

simcir.registerDevice('D',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"In","id":"dev0","x":152,"y":272,"label":"CLK"},
    {"type":"NOT","id":"dev1","x":216,"y":264,"label":"NOT"},
    {"type":"In","id":"dev2","x":152,"y":208,"label":"D"},
    {"type":"D-FF","id":"dev3","x":280,"y":248,"label":"D-FF"},
    {"type":"Out","id":"dev4","x":384,"y":208,"label":"Q"},
    {"type":"Out","id":"dev5","x":384,"y":272,"label":"~Q"},
    {"type":"DC","id":"dev6","x":48,"y":272,"label":"DC"},
    {"type":"Toggle","id":"dev7","x":104,"y":272,"label":"Toggle"},
    {"type":"1>1","id":"dev8","x":432,"y":136,"label":""},
    {"type":"1<1","id":"dev9","x":432,"y":280,"label":""},
    {"type":"1>1","id":"dev10","x":152,"y":136,"label":""}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev7.out0"},
    {"from":"dev1.in0","to":"dev0.out0"},
    {"from":"dev2.in0","to":"dev10.out0"},
    {"from":"dev3.in0","to":"dev2.out0"},
    {"from":"dev3.in1","to":"dev1.out0"},
    {"from":"dev4.in0","to":"dev3.out0"},
    {"from":"dev5.in0","to":"dev3.out1"},
    {"from":"dev7.in0","to":"dev6.out0"},
    {"from":"dev8.in0","to":"dev9.out0"},
    {"from":"dev9.in0","to":"dev5.out0"},
    {"from":"dev10.in0","to":"dev8.out0"}
  ]
}
);

simcir.registerDevice('D-E',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"D","id":"dev0","x":392,"y":352,"label":"D"},
    {"type":"Out","id":"dev1","x":520,"y":384,"label":"~Q"},
    {"type":"Mux2","id":"dev2","x":296,"y":336,"label":"Mux2"},
    {"type":"1>1","id":"dev3","x":264,"y":256,"label":""},
    {"type":"In","id":"dev4","x":360,"y":504,"label":"CLK"},
    {"type":"Out","id":"dev5","x":520,"y":328,"label":"Q"},
    {"type":"1>1","id":"dev6","x":472,"y":256,"label":""},
    {"type":"In","id":"dev7","x":176,"y":312,"label":"E"},
    {"type":"In","id":"dev8","x":176,"y":368,"label":"D"},
    {"type":"DC","id":"dev9","x":32,"y":336,"label":"DC"},
    {"type":"Toggle","id":"dev10","x":104,"y":312,"label":"Toggle"},
    {"type":"Toggle","id":"dev11","x":104,"y":368,"label":"Toggle"},
    {"type":"PushOn","id":"dev12","x":104,"y":440,"label":"PushOn"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev2.out0"},
    {"from":"dev0.in1","to":"dev4.out0"},
    {"from":"dev1.in0","to":"dev0.out1"},
    {"from":"dev2.in0","to":"dev7.out0"},
    {"from":"dev2.in1","to":"dev3.out0"},
    {"from":"dev2.in2","to":"dev8.out0"},
    {"from":"dev3.in0","to":"dev6.out0"},
    {"from":"dev4.in0","to":"dev12.out0"},
    {"from":"dev5.in0","to":"dev0.out0"},
    {"from":"dev6.in0","to":"dev0.out0"},
    {"from":"dev7.in0","to":"dev10.out0"},
    {"from":"dev8.in0","to":"dev11.out0"},
    {"from":"dev10.in0","to":"dev9.out0"},
    {"from":"dev11.in0","to":"dev9.out0"},
    {"from":"dev12.in0","to":"dev9.out0"}
  ]
}
);

simcir.registerDevice('Reg4',
{
  "width":800,
  "height":600,
  "showToolbox":false,
  "toolbox":[
  ],
  "devices":[
    {"type":"D","id":"dev0","x":304,"y":200,"label":"D"},
    {"type":"D","id":"dev1","x":304,"y":264,"label":"D"},
    {"type":"D","id":"dev2","x":304,"y":336,"label":"D"},
    {"type":"D","id":"dev3","x":304,"y":408,"label":"D"},
    {"type":"In","id":"dev4","x":232,"y":336,"label":"D0"},
    {"type":"In","id":"dev5","x":232,"y":408,"label":"D1"},
    {"type":"In","id":"dev6","x":232,"y":200,"label":"D2"},
    {"type":"In","id":"dev7","x":232,"y":264,"label":"D3"},
    {"type":"In","id":"dev8","x":232,"y":472,"label":"CLK"},
    {"type":"Out","id":"dev9","x":416,"y":200,"label":"Q0"},
    {"type":"Out","id":"dev10","x":416,"y":264,"label":"Q1"},
    {"type":"Out","id":"dev11","x":416,"y":336,"label":"Q2"},
    {"type":"Out","id":"dev12","x":416,"y":408,"label":"Q3"},
    {"type":"Toggle","id":"dev13","x":176,"y":200,"label":"Toggle"},
    {"type":"Toggle","id":"dev14","x":176,"y":264,"label":"Toggle"},
    {"type":"Toggle","id":"dev15","x":176,"y":336,"label":"Toggle"},
    {"type":"Toggle","id":"dev16","x":176,"y":408,"label":"Toggle"},
    {"type":"DC","id":"dev17","x":104,"y":304,"label":"DC"},
    {"type":"PushOn","id":"dev18","x":176,"y":472,"label":"PushOn"},
    {"type":"LED","id":"dev19","x":496,"y":200,"label":"LED"},
    {"type":"LED","id":"dev20","x":496,"y":264,"label":"LED"},
    {"type":"LED","id":"dev21","x":496,"y":336,"label":"LED"},
    {"type":"LED","id":"dev22","x":496,"y":408,"label":"LED"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev6.out0"},
    {"from":"dev0.in1","to":"dev8.out0"},
    {"from":"dev1.in0","to":"dev7.out0"},
    {"from":"dev1.in1","to":"dev8.out0"},
    {"from":"dev2.in0","to":"dev4.out0"},
    {"from":"dev2.in1","to":"dev8.out0"},
    {"from":"dev3.in0","to":"dev5.out0"},
    {"from":"dev3.in1","to":"dev8.out0"},
    {"from":"dev4.in0","to":"dev15.out0"},
    {"from":"dev5.in0","to":"dev16.out0"},
    {"from":"dev6.in0","to":"dev13.out0"},
    {"from":"dev7.in0","to":"dev14.out0"},
    {"from":"dev8.in0","to":"dev18.out0"},
    {"from":"dev9.in0","to":"dev0.out0"},
    {"from":"dev10.in0","to":"dev1.out0"},
    {"from":"dev11.in0","to":"dev2.out0"},
    {"from":"dev12.in0","to":"dev3.out0"},
    {"from":"dev13.in0","to":"dev17.out0"},
    {"from":"dev14.in0","to":"dev17.out0"},
    {"from":"dev15.in0","to":"dev17.out0"},
    {"from":"dev16.in0","to":"dev17.out0"},
    {"from":"dev18.in0","to":"dev17.out0"},
    {"from":"dev19.in0","to":"dev9.out0"},
    {"from":"dev20.in0","to":"dev10.out0"},
    {"from":"dev21.in0","to":"dev11.out0"},
    {"from":"dev22.in0","to":"dev12.out0"}
  ]
}
);

simcir.registerDevice('RegBus',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"BusIn","id":"dev0","x":312,"y":320,"label":"BusIn"},
    {"type":"BusOut","id":"dev1","x":536,"y":312,"label":"BusOut"},
    {"type":"Reg4","id":"dev2","x":408,"y":304,"label":"Reg4"},
    {"type":"In","id":"dev3","x":216,"y":328,"label":"D"},
    {"type":"Out","id":"dev4","x":632,"y":320,"label":"Q"},
    {"type":"In","id":"dev5","x":312,"y":392,"label":"Clk"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev3.out0"},
    {"from":"dev1.in0","to":"dev2.out0"},
    {"from":"dev1.in1","to":"dev2.out1"},
    {"from":"dev1.in2","to":"dev2.out2"},
    {"from":"dev1.in3","to":"dev2.out3"},
    {"from":"dev2.in0","to":"dev0.out0"},
    {"from":"dev2.in1","to":"dev0.out1"},
    {"from":"dev2.in2","to":"dev0.out2"},
    {"from":"dev2.in3","to":"dev0.out3"},
    {"from":"dev2.in4","to":"dev5.out0"},
    {"from":"dev4.in0","to":"dev1.out0"}
  ]
}
);

simcir.registerDevice('RegBus-E',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"RegBus","id":"dev0","x":392,"y":352,"label":"RegBus"},
    {"type":"MuxBus2","id":"dev1","x":296,"y":336,"label":"MuxBus2"},
    {"type":"4>4","id":"dev2","x":264,"y":256,"label":""},
    {"type":"In","id":"dev3","x":360,"y":504,"label":"CLK"},
    {"type":"Out","id":"dev4","x":520,"y":328,"label":"Q"},
    {"type":"4>4","id":"dev5","x":472,"y":256,"label":""},
    {"type":"In","id":"dev6","x":176,"y":312,"label":"E"},
    {"type":"In","id":"dev7","x":176,"y":368,"label":"D"},
    {"type":"4bit7segBus","id":"dev8","x":616,"y":312,"label":"4bit7segBus"},
    {"type":"RotaryEncoderBus","id":"dev9","x":88,"y":352,"label":"RotaryEncoderBus"},
    {"type":"DC","id":"dev10","x":8,"y":328,"label":"DC"},
    {"type":"Toggle","id":"dev11","x":88,"y":296,"label":"Toggle"},
    {"type":"OSC","id":"dev12","x":248,"y":504,"label":"OSC"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev1.out0"},
    {"from":"dev0.in1","to":"dev3.out0"},
    {"from":"dev1.in0","to":"dev6.out0"},
    {"from":"dev1.in1","to":"dev2.out0"},
    {"from":"dev1.in2","to":"dev7.out0"},
    {"from":"dev2.in0","to":"dev5.out0"},
    {"from":"dev3.in0","to":"dev12.out0"},
    {"from":"dev4.in0","to":"dev0.out0"},
    {"from":"dev5.in0","to":"dev0.out0"},
    {"from":"dev6.in0","to":"dev11.out0"},
    {"from":"dev7.in0","to":"dev9.out0"},
    {"from":"dev8.in0","to":"dev4.out0"},
    {"from":"dev9.in0","to":"dev10.out0"},
    {"from":"dev11.in0","to":"dev10.out0"}
  ]
}
);

simcir.registerDevice('CPU0',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"RegBus-E","id":"dev0","x":304,"y":320,"label":"R1"},
    {"type":"RegBus-E","id":"dev1","x":304,"y":568,"label":"R3"},
    {"type":"RotaryEncoderBus","id":"dev2","x":40,"y":416,"label":"dstE"},
    {"type":"4bit7segBus","id":"dev3","x":104,"y":320,"label":"dstE"},
    {"type":"RotaryEncoderBus","id":"dev4","x":552,"y":256,"label":"srcA"},
    {"type":"RotaryEncoderBus","id":"dev5","x":552,"y":440,"label":"srcB"},
    {"type":"4bit7segBus","id":"dev6","x":1000,"y":24,"label":"valE"},
    {"type":"Toggle","id":"dev7","x":1000,"y":752,"label":"CLK"},
    {"type":"SubBus","id":"dev8","x":848,"y":504,"label":"SubBus"},
    {"type":"AddBus","id":"dev9","x":848,"y":392,"label":"AddBus"},
    {"type":"RotaryEncoderBus","id":"dev10","x":552,"y":640,"label":"valC"},
    {"type":"Toggle","id":"dev11","x":744,"y":192,"label":"Carry"},
    {"type":"DC","id":"dev12","x":520,"y":456,"label":"DC"},
    {"type":"DC","id":"dev13","x":520,"y":272,"label":"DC"},
    {"type":"DC","id":"dev14","x":8,"y":432,"label":"DC"},
    {"type":"MuxBus2","id":"dev15","x":1000,"y":440,"label":"MuxBus2"},
    {"type":"DC","id":"dev16","x":968,"y":752,"label":"DC"},
    {"type":"DC","id":"dev17","x":520,"y":656,"label":"DC"},
    {"type":"4bit7segBus","id":"dev18","x":664,"y":256,"label":"srcA"},
    {"type":"4bit7segBus","id":"dev19","x":664,"y":440,"label":"srcB"},
    {"type":"MuxBus","id":"dev20","x":664,"y":520,"label":"MuxBus"},
    {"type":"MuxBus","id":"dev21","x":664,"y":336,"label":"MuxBus"},
    {"type":"4<4","id":"dev22","x":464,"y":464,"label":""},
    {"type":"4<4","id":"dev23","x":464,"y":584,"label":""},
    {"type":"4<4","id":"dev24","x":464,"y":336,"label":""},
    {"type":"4<4","id":"dev25","x":504,"y":400,"label":""},
    {"type":"4<4","id":"dev26","x":512,"y":528,"label":""},
    {"type":"4>4","id":"dev27","x":1048,"y":136,"label":""},
    {"type":"4bit7segBus","id":"dev28","x":736,"y":440,"label":"valB"},
    {"type":"4bit7segBus","id":"dev29","x":736,"y":256,"label":"valA"},
    {"type":"1<1","id":"dev30","x":816,"y":424,"label":""},
    {"type":"4<4","id":"dev31","x":264,"y":336,"label":""},
    {"type":"4<4","id":"dev32","x":264,"y":464,"label":""},
    {"type":"4<4","id":"dev33","x":264,"y":584,"label":""},
    {"type":"4>4","id":"dev34","x":264,"y":136,"label":""},
    {"type":"1<1","id":"dev35","x":232,"y":352,"label":""},
    {"type":"1<1","id":"dev36","x":232,"y":600,"label":""},
    {"type":"Toggle","id":"dev37","x":876,"y":324,"label":"A/S"},
    {"type":"DC","id":"dev38","x":844,"y":324,"label":"DC"},
    {"type":"Out","id":"dev39","x":368,"y":272,"label":"R1"},
    {"type":"4bit7segBus","id":"dev40","x":400,"y":256,"label":"R1"},
    {"type":"Out","id":"dev41","x":368,"y":400,"label":"R2"},
    {"type":"4bit7segBus","id":"dev42","x":400,"y":512,"label":"R3"},
    {"type":"Out","id":"dev43","x":368,"y":528,"label":"R3"},
    {"type":"4bit7segBus","id":"dev44","x":400,"y":384,"label":"R2"},
    {"type":"RegBus-E","id":"dev45","x":304,"y":448,"label":"R2"},
    {"type":"In","id":"dev46","x":112,"y":432,"label":"dstE"},
    {"type":"In","id":"dev47","x":624,"y":272,"label":"srcA"},
    {"type":"In","id":"dev48","x":624,"y":456,"label":"srcB"},
    {"type":"DC","id":"dev49","x":712,"y":192,"label":"DC"},
    {"type":"In","id":"dev50","x":784,"y":192,"label":"Carry"},
    {"type":"In","id":"dev51","x":916,"y":324,"label":"Add/Sub"},
    {"type":"2to4DecoderBus","id":"dev52","x":152,"y":416,"label":"2to4DecoderBus"},
    {"type":"1<1","id":"dev53","x":232,"y":480,"label":""},
    {"type":"In","id":"dev54","x":1040,"y":752,"label":"CLK"},
    {"type":"1>1","id":"dev55","x":232,"y":720,"label":""},
    {"type":"1>1","id":"dev56","x":1056,"y":720,"label":""},
    {"type":"In","id":"dev57","x":624,"y":656,"label":"valC"},
    {"type":"4bit7segBus","id":"dev58","x":664,"y":640,"label":"valC"},
    {"type":"4>4","id":"dev59","x":928,"y":136,"label":""},
    {"type":"Out","id":"dev60","x":928,"y":40,"label":"valE"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev52.out1"},
    {"from":"dev0.in1","to":"dev31.out0"},
    {"from":"dev0.in2","to":"dev35.out0"},
    {"from":"dev1.in0","to":"dev52.out3"},
    {"from":"dev1.in1","to":"dev33.out0"},
    {"from":"dev1.in2","to":"dev36.out0"},
    {"from":"dev2.in0","to":"dev14.out0"},
    {"from":"dev3.in0","to":"dev2.out0"},
    {"from":"dev4.in0","to":"dev13.out0"},
    {"from":"dev5.in0","to":"dev12.out0"},
    {"from":"dev6.in0","to":"dev60.out0"},
    {"from":"dev7.in0","to":"dev16.out0"},
    {"from":"dev8.in0","to":"dev21.out0"},
    {"from":"dev8.in1","to":"dev20.out0"},
    {"from":"dev9.in0","to":"dev21.out0"},
    {"from":"dev9.in1","to":"dev20.out0"},
    {"from":"dev9.in2","to":"dev30.out0"},
    {"from":"dev10.in0","to":"dev17.out0"},
    {"from":"dev11.in0","to":"dev49.out0"},
    {"from":"dev15.in0","to":"dev51.out0"},
    {"from":"dev15.in1","to":"dev9.out0"},
    {"from":"dev15.in2","to":"dev8.out0"},
    {"from":"dev18.in0","to":"dev47.out0"},
    {"from":"dev19.in0","to":"dev48.out0"},
    {"from":"dev20.in0","to":"dev48.out0"},
    {"from":"dev20.in2","to":"dev26.out0"},
    {"from":"dev20.in3","to":"dev22.out0"},
    {"from":"dev20.in4","to":"dev23.out0"},
    {"from":"dev21.in0","to":"dev47.out0"},
    {"from":"dev21.in1","to":"dev57.out0"},
    {"from":"dev21.in2","to":"dev24.out0"},
    {"from":"dev21.in3","to":"dev22.out0"},
    {"from":"dev21.in4","to":"dev25.out0"},
    {"from":"dev22.in0","to":"dev45.out0"},
    {"from":"dev23.in0","to":"dev1.out0"},
    {"from":"dev24.in0","to":"dev0.out0"},
    {"from":"dev25.in0","to":"dev23.out0"},
    {"from":"dev26.in0","to":"dev24.out0"},
    {"from":"dev27.in0","to":"dev15.out0"},
    {"from":"dev28.in0","to":"dev20.out0"},
    {"from":"dev29.in0","to":"dev21.out0"},
    {"from":"dev30.in0","to":"dev50.out0"},
    {"from":"dev31.in0","to":"dev34.out0"},
    {"from":"dev32.in0","to":"dev34.out0"},
    {"from":"dev33.in0","to":"dev34.out0"},
    {"from":"dev34.in0","to":"dev59.out0"},
    {"from":"dev35.in0","to":"dev55.out0"},
    {"from":"dev36.in0","to":"dev55.out0"},
    {"from":"dev37.in0","to":"dev38.out0"},
    {"from":"dev39.in0","to":"dev0.out0"},
    {"from":"dev40.in0","to":"dev39.out0"},
    {"from":"dev41.in0","to":"dev45.out0"},
    {"from":"dev42.in0","to":"dev43.out0"},
    {"from":"dev43.in0","to":"dev1.out0"},
    {"from":"dev44.in0","to":"dev41.out0"},
    {"from":"dev45.in0","to":"dev52.out2"},
    {"from":"dev45.in1","to":"dev32.out0"},
    {"from":"dev45.in2","to":"dev53.out0"},
    {"from":"dev46.in0","to":"dev2.out0"},
    {"from":"dev47.in0","to":"dev4.out0"},
    {"from":"dev48.in0","to":"dev5.out0"},
    {"from":"dev50.in0","to":"dev11.out0"},
    {"from":"dev51.in0","to":"dev37.out0"},
    {"from":"dev52.in0","to":"dev46.out0"},
    {"from":"dev53.in0","to":"dev55.out0"},
    {"from":"dev54.in0","to":"dev7.out0"},
    {"from":"dev55.in0","to":"dev56.out0"},
    {"from":"dev56.in0","to":"dev54.out0"},
    {"from":"dev57.in0","to":"dev10.out0"},
    {"from":"dev58.in0","to":"dev57.out0"},
    {"from":"dev59.in0","to":"dev27.out0"},
    {"from":"dev60.in0","to":"dev59.out0"}
  ]
}
);

simcir.registerDevice('CPU1',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"AndBus1","id":"dev0","x":208,"y":264,"label":"AndBus1"},
    {"type":"4bit7segBus","id":"dev1","x":512,"y":48,"label":"srcA"},
    {"type":"CPU0","id":"dev2","x":792,"y":240,"label":"CPU0"},
    {"type":"ROM0","id":"dev3","x":496,"y":240,"label":"ROM0"},
    {"type":"IncBus","id":"dev4","x":288,"y":224,"label":"IncBus"},
    {"type":"4>4","id":"dev5","x":336,"y":184,"label":""},
    {"type":"4>4","id":"dev6","x":96,"y":184,"label":""},
    {"type":"4bit7segBus","id":"dev7","x":576,"y":48,"label":"srcB"},
    {"type":"4bit7segBus","id":"dev8","x":640,"y":48,"label":"valC"},
    {"type":"4bit7segBus","id":"dev9","x":448,"y":48,"label":"dstE"},
    {"type":"LED","id":"dev10","x":704,"y":80,"label":"Sub"},
    {"type":"RegBus","id":"dev11","x":96,"y":256,"label":"PC"},
    {"type":"Toggle","id":"dev12","x":144,"y":336,"label":"~Reset"},
    {"type":"Toggle","id":"dev13","x":32,"y":472,"label":"CLK"},
    {"type":"1<1","id":"dev14","x":776,"y":480,"label":""},
    {"type":"DC","id":"dev15","x":112,"y":336,"label":"DC"},
    {"type":"DC","id":"dev16","x":0,"y":472,"label":"DC"},
    {"type":"In","id":"dev17","x":64,"y":472,"label":"CLK"},
    {"type":"Out","id":"dev18","x":912,"y":216,"label":"R1"},
    {"type":"Out","id":"dev19","x":912,"y":296,"label":"R2"},
    {"type":"Out","id":"dev20","x":912,"y":376,"label":"R3"},
    {"type":"4bit7segBus","id":"dev21","x":896,"y":472,"label":"valE"},
    {"type":"Out","id":"dev22","x":296,"y":320,"label":"PC"},
    {"type":"4bit7segBus","id":"dev23","x":944,"y":200,"label":"R1"},
    {"type":"4bit7segBus","id":"dev24","x":944,"y":280,"label":"R2"},
    {"type":"4bit7segBus","id":"dev25","x":944,"y":360,"label":"R3"},
    {"type":"4bit7segBus","id":"dev26","x":328,"y":304,"label":"PC"},
    {"type":"In","id":"dev27","x":176,"y":336,"label":"~Reset"},
    {"type":"In","id":"dev28","x":664,"y":272,"label":"srcB"},
    {"type":"In","id":"dev29","x":664,"y":176,"label":"dstE"},
    {"type":"In","id":"dev30","x":664,"y":224,"label":"srcA"},
    {"type":"In","id":"dev31","x":664,"y":320,"label":"valC"},
    {"type":"In","id":"dev32","x":664,"y":368,"label":"Add/Sub"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev11.out0"},
    {"from":"dev0.in1","to":"dev27.out0"},
    {"from":"dev1.in0","to":"dev3.out1"},
    {"from":"dev2.in0","to":"dev29.out0"},
    {"from":"dev2.in1","to":"dev30.out0"},
    {"from":"dev2.in2","to":"dev28.out0"},
    {"from":"dev2.in3","to":"dev31.out0"},
    {"from":"dev2.in5","to":"dev32.out0"},
    {"from":"dev2.in6","to":"dev14.out0"},
    {"from":"dev3.in0","to":"dev0.out0"},
    {"from":"dev4.in0","to":"dev0.out0"},
    {"from":"dev5.in0","to":"dev4.out0"},
    {"from":"dev6.in0","to":"dev5.out0"},
    {"from":"dev7.in0","to":"dev3.out2"},
    {"from":"dev8.in0","to":"dev3.out3"},
    {"from":"dev9.in0","to":"dev3.out0"},
    {"from":"dev10.in0","to":"dev3.out4"},
    {"from":"dev11.in0","to":"dev6.out0"},
    {"from":"dev11.in1","to":"dev17.out0"},
    {"from":"dev12.in0","to":"dev15.out0"},
    {"from":"dev13.in0","to":"dev16.out0"},
    {"from":"dev14.in0","to":"dev17.out0"},
    {"from":"dev17.in0","to":"dev13.out0"},
    {"from":"dev18.in0","to":"dev2.out0"},
    {"from":"dev19.in0","to":"dev2.out1"},
    {"from":"dev20.in0","to":"dev2.out2"},
    {"from":"dev21.in0","to":"dev2.out3"},
    {"from":"dev22.in0","to":"dev0.out0"},
    {"from":"dev23.in0","to":"dev18.out0"},
    {"from":"dev24.in0","to":"dev19.out0"},
    {"from":"dev25.in0","to":"dev20.out0"},
    {"from":"dev26.in0","to":"dev22.out0"},
    {"from":"dev27.in0","to":"dev12.out0"},
    {"from":"dev28.in0","to":"dev3.out2"},
    {"from":"dev29.in0","to":"dev3.out0"},
    {"from":"dev30.in0","to":"dev3.out1"},
    {"from":"dev31.in0","to":"dev3.out3"},
    {"from":"dev32.in0","to":"dev3.out4"}
  ]
}
);

simcir.registerDevice('ROM0',
{
  "width":1200,
  "height":800,
  "showToolbox":false,
  "devices":[
    {"type":"Out","id":"dev0","x":192,"y":120,"label":"dstE"},
    {"type":"RotaryEncoderBus","id":"dev1","x":32,"y":232,"label":"dstE0","value":1},
    {"type":"4bit7segBus","id":"dev2","x":120,"y":232,"label":"dstE0"},
    {"type":"MuxBus","id":"dev3","x":120,"y":96,"label":"MuxBus"},
    {"type":"RotaryEncoderBus","id":"dev4","x":32,"y":352,"label":"dstE1","value":2},
    {"type":"4bit7segBus","id":"dev5","x":120,"y":352,"label":"dstE1"},
    {"type":"RotaryEncoderBus","id":"dev6","x":32,"y":592,"label":"dstE3","value":3},
    {"type":"RotaryEncoderBus","id":"dev7","x":32,"y":472,"label":"dstE2","value":3},
    {"type":"4bit7segBus","id":"dev8","x":120,"y":472,"label":"dstE2"},
    {"type":"4bit7segBus","id":"dev9","x":120,"y":592,"label":"dstE3"},
    {"type":"In","id":"dev10","x":16,"y":32,"label":"Addr"},
    {"type":"DC","id":"dev11","x":0,"y":744,"label":"DC"},
    {"type":"4<4","id":"dev12","x":104,"y":40,"label":""},
    {"type":"Out","id":"dev13","x":592,"y":120,"label":"srcB"},
    {"type":"Out","id":"dev14","x":392,"y":120,"label":"srcA"},
    {"type":"MuxBus","id":"dev15","x":320,"y":96,"label":"MuxBus"},
    {"type":"MuxBus","id":"dev16","x":520,"y":96,"label":"MuxBus"},
    {"type":"MuxBus","id":"dev17","x":720,"y":96,"label":"MuxBus"},
    {"type":"Out","id":"dev18","x":792,"y":120,"label":"valC"},
    {"type":"Mux","id":"dev19","x":920,"y":96,"label":"Mux"},
    {"type":"Out","id":"dev20","x":992,"y":120,"label":"Add/Sub"},
    {"type":"4<4","id":"dev21","x":304,"y":40,"label":""},
    {"type":"4<4","id":"dev22","x":504,"y":40,"label":""},
    {"type":"4<4","id":"dev23","x":704,"y":40,"label":""},
    {"type":"4<4","id":"dev24","x":904,"y":40,"label":""},
    {"type":"RotaryEncoderBus","id":"dev25","x":232,"y":232,"label":"srcA0"},
    {"type":"RotaryEncoderBus","id":"dev26","x":232,"y":352,"label":"srcA1"},
    {"type":"RotaryEncoderBus","id":"dev27","x":232,"y":472,"label":"srcA2","value":1},
    {"type":"RotaryEncoderBus","id":"dev28","x":232,"y":592,"label":"srcA3","value":0},
    {"type":"4bit7segBus","id":"dev29","x":320,"y":232,"label":"srcA0"},
    {"type":"4bit7segBus","id":"dev30","x":320,"y":352,"label":"srcA1"},
    {"type":"4bit7segBus","id":"dev31","x":320,"y":472,"label":"srcA2"},
    {"type":"4bit7segBus","id":"dev32","x":320,"y":592,"label":"srcA3"},
    {"type":"RotaryEncoderBus","id":"dev33","x":432,"y":232,"label":"srcB0"},
    {"type":"RotaryEncoderBus","id":"dev34","x":432,"y":352,"label":"srcB1"},
    {"type":"RotaryEncoderBus","id":"dev35","x":432,"y":472,"label":"srcB2","value":2},
    {"type":"RotaryEncoderBus","id":"dev36","x":432,"y":592,"label":"srcB3","value":3},
    {"type":"4bit7segBus","id":"dev37","x":520,"y":232,"label":"srcB0"},
    {"type":"4bit7segBus","id":"dev38","x":520,"y":352,"label":"srcB1"},
    {"type":"4bit7segBus","id":"dev39","x":520,"y":472,"label":"srcB2"},
    {"type":"4bit7segBus","id":"dev40","x":520,"y":592,"label":"srcB3"},
    {"type":"RotaryEncoderBus","id":"dev41","x":632,"y":232,"label":"valC0","value":2},
    {"type":"RotaryEncoderBus","id":"dev42","x":632,"y":352,"label":"valC1","value":3},
    {"type":"RotaryEncoderBus","id":"dev43","x":632,"y":472,"label":"valC2","value":0},
    {"type":"RotaryEncoderBus","id":"dev44","x":632,"y":592,"label":"valC3","value":1},
    {"type":"4bit7segBus","id":"dev45","x":720,"y":232,"label":"valC0"},
    {"type":"4bit7segBus","id":"dev46","x":720,"y":352,"label":"valC1"},
    {"type":"4bit7segBus","id":"dev47","x":720,"y":472,"label":"valC2"},
    {"type":"4bit7segBus","id":"dev48","x":720,"y":592,"label":"valC3"},
    {"type":"DC","id":"dev49","x":200,"y":744,"label":"DC"},
    {"type":"DC","id":"dev50","x":400,"y":744,"label":"DC"},
    {"type":"DC","id":"dev51","x":600,"y":744,"label":"DC"},
    {"type":"DC","id":"dev52","x":800,"y":744,"label":"DC"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev3.out0"},
    {"from":"dev1.in0","to":"dev11.out0"},
    {"from":"dev2.in0","to":"dev1.out0"},
    {"from":"dev3.in0","to":"dev12.out0"},
    {"from":"dev3.in1","to":"dev1.out0"},
    {"from":"dev3.in2","to":"dev4.out0"},
    {"from":"dev3.in3","to":"dev7.out0"},
    {"from":"dev3.in4","to":"dev6.out0"},
    {"from":"dev4.in0","to":"dev11.out0"},
    {"from":"dev5.in0","to":"dev4.out0"},
    {"from":"dev6.in0","to":"dev11.out0"},
    {"from":"dev7.in0","to":"dev11.out0"},
    {"from":"dev8.in0","to":"dev7.out0"},
    {"from":"dev9.in0","to":"dev6.out0"},
    {"from":"dev12.in0","to":"dev10.out0"},
    {"from":"dev13.in0","to":"dev16.out0"},
    {"from":"dev14.in0","to":"dev15.out0"},
    {"from":"dev15.in0","to":"dev21.out0"},
    {"from":"dev15.in1","to":"dev25.out0"},
    {"from":"dev15.in2","to":"dev26.out0"},
    {"from":"dev15.in3","to":"dev27.out0"},
    {"from":"dev15.in4","to":"dev28.out0"},
    {"from":"dev16.in0","to":"dev22.out0"},
    {"from":"dev16.in1","to":"dev33.out0"},
    {"from":"dev16.in2","to":"dev34.out0"},
    {"from":"dev16.in3","to":"dev35.out0"},
    {"from":"dev16.in4","to":"dev36.out0"},
    {"from":"dev17.in0","to":"dev23.out0"},
    {"from":"dev17.in1","to":"dev41.out0"},
    {"from":"dev17.in2","to":"dev42.out0"},
    {"from":"dev17.in3","to":"dev43.out0"},
    {"from":"dev17.in4","to":"dev44.out0"},
    {"from":"dev18.in0","to":"dev17.out0"},
    {"from":"dev19.in0","to":"dev24.out0"},
    {"from":"dev19.in4","to":"dev52.out0"},
    {"from":"dev20.in0","to":"dev19.out0"},
    {"from":"dev21.in0","to":"dev12.out0"},
    {"from":"dev22.in0","to":"dev21.out0"},
    {"from":"dev23.in0","to":"dev22.out0"},
    {"from":"dev24.in0","to":"dev23.out0"},
    {"from":"dev25.in0","to":"dev49.out0"},
    {"from":"dev26.in0","to":"dev49.out0"},
    {"from":"dev27.in0","to":"dev49.out0"},
    {"from":"dev28.in0","to":"dev49.out0"},
    {"from":"dev29.in0","to":"dev25.out0"},
    {"from":"dev30.in0","to":"dev26.out0"},
    {"from":"dev31.in0","to":"dev27.out0"},
    {"from":"dev32.in0","to":"dev28.out0"},
    {"from":"dev33.in0","to":"dev50.out0"},
    {"from":"dev34.in0","to":"dev50.out0"},
    {"from":"dev35.in0","to":"dev50.out0"},
    {"from":"dev36.in0","to":"dev50.out0"},
    {"from":"dev37.in0","to":"dev33.out0"},
    {"from":"dev38.in0","to":"dev34.out0"},
    {"from":"dev39.in0","to":"dev35.out0"},
    {"from":"dev40.in0","to":"dev36.out0"},
    {"from":"dev41.in0","to":"dev51.out0"},
    {"from":"dev42.in0","to":"dev51.out0"},
    {"from":"dev43.in0","to":"dev51.out0"},
    {"from":"dev44.in0","to":"dev51.out0"},
    {"from":"dev45.in0","to":"dev41.out0"},
    {"from":"dev46.in0","to":"dev42.out0"},
    {"from":"dev47.in0","to":"dev43.out0"},
    {"from":"dev48.in0","to":"dev44.out0"}
  ]
}
);
};
M.mod_circuits.addDevice = function(params) {
	var simcir = M.mod_circuits.simcir;
	var text = params.replace(/^\s+|\s+$/g, '');
  	if(text === ""){ return;}
	var d = JSON.parse(text || '{}');
	d.forEach(function(entry) {
		M.mod_circuits.simcir.registerDevice(entry.id, entry.json);
	});
};
M.mod_circuits.form= function(params) {
 	$(params.form).submit(function(){
		$(params.dst).val(M.mod_circuits.simcir.controller($(params.src).find('.simcir-workspace') ).text());
	return true; // return false to cancel form action
    	});       
};
return M.mod_circuits;
});
