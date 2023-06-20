
/**
 * @license
 * Copyright 2022 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
OpenBlock.AddNativeTypes({ 'Vector2': [], 'Image': [], 'ImageFile': [] });
OpenBlock.nativeFunctionJson('canvas2d', 'canvas2d', [
    { method_name: 'Canvas2d_fillRect', arguments: [{ type: 'Number', name: 'x' }, { type: 'Number', name: 'y' }, { type: 'Number', name: 'width' }, { type: 'Number', name: 'height' },], returnType: 'void' },
    { method_name: 'Canvas2d_clearRect', arguments: [{ type: 'Number', name: 'x' }, { type: 'Number', name: 'y' }, { type: 'Number', name: 'width' }, { type: 'Number', name: 'height' },], returnType: 'void' },
    { method_name: 'Canvas2d_setFillStyleColor', arguments: [{ type: 'Colour', name: 'colour' }], returnType: 'void' },
    { method_name: 'Canvas2d_strokeRect', arguments: [{ type: 'Number', name: 'x' }, { type: 'Number', name: 'y' }, { type: 'Number', name: 'width' }, { type: 'Number', name: 'height' },], returnType: 'void' },
    { method_name: 'Canvas2d_fillText', arguments: [{ type: 'String', name: 'text' }, { type: 'Number', name: 'x' }, { type: 'Number', name: 'y' },], returnType: 'void' },
    { method_name: 'Canvas2d_beginPath', arguments: [], returnType: 'void' },
    { method_name: 'Canvas2d_arc', arguments: [{ type: 'Number', name: 'x' }, { type: 'Number', name: 'y' }, { type: 'Number', name: 'radius' }, { type: 'Number', name: 'startAngle' }, { type: 'Number', name: 'endAngle' }, { type: 'Boolean', name: 'anticlockwise' },], returnType: 'void' },
    { method_name: 'Canvas2d_fill', arguments: [], returnType: 'void' },
    { method_name: 'Canvas2d_closePath', arguments: [], returnType: 'void' },
    { method_name: 'Canvas2d_setFont', arguments: [{ type: 'String', name: 'font' }], returnType: 'void' },
    { method_name: 'Canvas2d_getFont', arguments: [], returnType: 'String' },
    { method_name: 'Canvas2d_arcTo', arguments: [{ type: 'Number', name: 'x1' }, { type: 'Number', name: 'y1' }, { type: 'Number', name: 'x2' }, { type: 'Number', name: 'y2' }, { type: 'Number', name: 'radius' }], returnType: 'void' },
    { method_name: 'Canvas2d_bezierCurveTo', arguments: [{ type: 'Number', name: 'cp1x' }, { type: 'Number', name: 'cp1y' }, { type: 'Number', name: 'cp2x' }, { type: 'Number', name: 'cp2y' }, { type: 'Number', name: 'x' }, { type: 'Number', name: 'y' }], returnType: 'void' },
    { method_name: 'Canvas2d_moveTo', arguments: [{ type: 'Number', name: 'x' }, { type: 'Number', name: 'y' }], returnType: 'void' },
    { method_name: 'Canvas2d_lineTo', arguments: [{ type: 'Number', name: 'x' }, { type: 'Number', name: 'y' }], returnType: 'void' },
    { method_name: 'Canvas2d_setTextAlign', arguments: [{ type: 'String', name: 'align' }], returnType: 'void' },
    { method_name: 'Canvas2d_getTextAlign', arguments: [], returnType: 'String' },
    { method_name: 'Canvas2d_setTextBaseline', arguments: [{ type: 'String', name: 'align' }], returnType: 'void' },
    { method_name: 'Canvas2d_getTextBaseline', arguments: [], returnType: 'String' },
    {
        method_name: 'Canvas2d_ellipse', arguments: [{ type: 'Number', name: 'x' }, { type: 'Number', name: 'y' }, { type: 'Number', name: 'radiusX' }, { type: 'Number', name: 'radiusY' },
        { type: 'Number', name: 'rotation' }, { type: 'Number', name: 'startAngle' }, { type: 'Number', name: 'endAngle' }, { type: 'Boolean', name: 'anticlockwise' },], returnType: 'void'
    },
    { method_name: 'Canvas2d_rect', arguments: [{ type: 'Number', name: 'x' }, { type: 'Number', name: 'y' }, { type: 'Number', name: 'width' }, { type: 'Number', name: 'height' },], returnType: 'void' },
    { method_name: 'Canvas2d_rotate', arguments: [{ type: 'Number', name: 'radian' }], returnType: 'void' },
    { method_name: 'Canvas2d_scale', arguments: [{ type: 'Number', name: 'x' }, { type: 'Number', name: 'y' }], returnType: 'void' },
    { method_name: 'Canvas2d_setStrokeStyleColor', arguments: [{ type: 'Colour', name: 'colour' }], returnType: 'void' },
    { method_name: 'Canvas2d_stroke', arguments: [], returnType: 'void' },
    { method_name: 'Vector2_x', arguments: [{ type: 'Vector2', name: 'vector2' }], returnType: 'Number' },
    { method_name: 'Vector2_y', arguments: [{ type: 'Vector2', name: 'vector2' }], returnType: 'Number' },
    { method_name: 'Canvas2d_height', arguments: [], returnType: 'Integer' },
    { method_name: 'Canvas2d_width', arguments: [], returnType: 'Integer' },
    { method_name: 'Canvas2d_setLineWidth', arguments: [{ type: 'Number', name: 'width' }], returnType: 'void' },
    { method_name: 'Canvas2d_getLineWidth', arguments: [], returnType: 'Number' },
    {
        method_name: 'Canvas2d_drawImage', arguments: [
            { name: 'imageFileName', type: 'String', },
            { name: 'SourceX', type: 'Number' },
            { name: 'SourceY', type: 'Number' },
            { name: 'SourceWidth', type: 'Number' },
            { name: 'SourceHeight', type: 'Number' },
            { name: 'DestX', type: 'Number' },
            { name: 'DestY', type: 'Number' },
            { name: 'DestWidth', type: 'Number' },
            { name: 'DestHeight', type: 'Number' }
        ], returnType: 'void'
    },
    {
        method_name: 'Canvas2d_drawImage4', arguments: [
            { name: 'imageFileName', type: 'String', },
            { name: 'DestX', type: 'Number' },
            { name: 'DestY', type: 'Number' },
            { name: 'DestWidth', type: 'Number' },
            { name: 'DestHeight', type: 'Number' }
        ], returnType: 'void'
    },
    {
        method_name: 'Canvas2d_drawImage2', arguments: [
            { name: 'imageFileName', type: 'String', },
            { name: 'DestX', type: 'Number' },
            { name: 'DestY', type: 'Number' }
        ], returnType: 'void'
    },
    {
        method_name: 'Canvas2d_ImageWidth', arguments: [
            { name: 'imageFileName', type: 'String', },
        ], returnType: 'Number'
    },
    {
        method_name: 'Canvas2d_ImageHeight', arguments: [
            { name: 'imageFileName', type: 'String', },
        ], returnType: 'Number'
    },
    {
        method_name: 'Canvas2d_Save', arguments: [
        ], returnType: 'void'
    },
    {
        method_name: 'Canvas2d_Restore', arguments: [
        ], returnType: 'void'
    },
    {
        method_name: 'Canvas2d_SetTransform', arguments: [
            { name: 'HorizontalScaling', type: 'Number', },
            { name: 'VerticalSkewing', type: 'Number', },
            { name: 'HorizontalSkewing', type: 'Number', },
            { name: 'VerticalScaling', type: 'Number', },
            { name: 'HorizontalTranslation', type: 'Number', },
            { name: 'VerticalTranslation', type: 'Number', },
        ], returnType: 'void'
    },
    {
        method_name: 'Canvas2d_Transform', arguments: [
            { name: 'HorizontalScaling', type: 'Number', },
            { name: 'VerticalSkewing', type: 'Number', },
            { name: 'HorizontalSkewing', type: 'Number', },
            { name: 'VerticalScaling', type: 'Number', },
            { name: 'HorizontalTranslation', type: 'Number', },
            { name: 'VerticalTranslation', type: 'Number', },
        ], returnType: 'void'
    },
    {
        method_name: 'Canvas2d_Translate', arguments: [
            { name: 'x', type: 'Number', },
            { name: 'y', type: 'Number', },
        ], returnType: 'void'
    },
    {
        method_name: 'Canvas2d_Clip', arguments: [
        ], returnType: 'void'
    },
    { method_name: 'Canvas2d_setLineCap', arguments: [{ type: 'String', name: 'lineCap' }], returnType: 'void' },
    { method_name: 'Canvas2d_getLineCap', arguments: [], returnType: 'String' },
    { method_name: 'Canvas2d_doublePropertyOfCanvas', arguments: [{ type: 'String', name: 'propertyName' }], returnType: 'Number' },
    { method_name: 'Canvas2d_setGlobalAlpha', arguments: [{ type: 'Number', name: 'value' }], returnType: 'void' },
    { method_name: 'Canvas2d_getGlobalAlpha', arguments: [], returnType: 'Number' },
    { method_name: 'Canvas2d_setLineDash', arguments: [{ type: 'list<Number>', name: 'segments' }], returnType: 'void' },
    { method_name: 'Canvas2d_getLineDash', arguments: [], returnType: 'list<Number>' },
    { method_name: 'Canvas2d_isPointInPath', arguments: [{ type: 'Number', name: 'x' }, { type: 'Number', name: 'y' }], returnType: 'Boolean' },
    { method_name: 'Canvas2d_isPointInStroke', arguments: [{ type: 'Number', name: 'x' }, { type: 'Number', name: 'y' }], returnType: 'Boolean' },
    { method_name: 'Canvas2d_textWidth', arguments: [{ type: 'String', name: 'string' }], returnType: 'Number' },
    { method_name: 'Canvas2d_quadraticCurveTo', arguments: [{ type: 'Number', name: 'cpx' }, { type: 'Number', name: 'cpy' }, { type: 'Number', name: 'x' }, { type: 'Number', name: 'y' }], returnType: 'void' },
    { method_name: 'Canvas2d_strokeText', arguments: [{ type: 'String', name: 'text' }, { type: 'Number', name: 'x' }, { type: 'Number', name: 'y' },], returnType: 'void' },
    { method_name: 'Canvas2d_setLineDashOffset', arguments: [{ type: 'Number', name: 'offset' }], returnType: 'void' },
    { method_name: 'Canvas2d_getLineDashOffset', arguments: [], returnType: 'Number' },
    { method_name: 'Canvas2d_loadImage', arguments: [{ type: 'String', name: 'messageTitle' }], returnType: 'void' },
    {
        method_name: 'Canvas2d_drawImageObject', arguments: [
            { name: 'image', type: 'Image', },
            { name: 'SourceX', type: 'Number' },
            { name: 'SourceY', type: 'Number' },
            { name: 'SourceWidth', type: 'Number' },
            { name: 'SourceHeight', type: 'Number' },
            { name: 'DestX', type: 'Number' },
            { name: 'DestY', type: 'Number' },
            { name: 'DestWidth', type: 'Number' },
            { name: 'DestHeight', type: 'Number' }
        ], returnType: 'void'
    },
    {
        method_name: 'Canvas2d_imageObjectWidth', arguments:
            [{ type: 'Image', name: 'image' }], returnType: 'Number'
    },
    {
        method_name: 'Canvas2d_imageObjectHeight', arguments:
            [{ type: 'Image', name: 'image' }], returnType: 'Number'
    },
    {
        method_name: 'Canvas2d_fileName', arguments:
            [{ type: 'ImageFile', name: 'file' }], returnType: 'String'
    },
    {
        method_name: 'Canvas2d_fileContent', arguments:
            [{ type: 'ImageFile', name: 'file' }], returnType: 'Image'
    },
]);

OpenBlock.AddNativeTypes({ 'Network_target': [], });
OpenBlock.nativeFunctionJson('network', 'network', [
    { method_name: 'Network_join', arguments: [], returnType: 'void' },
    { method_name: 'Network_leave', arguments: [], returnType: 'void' },
    { method_name: 'Network_is_joined', arguments: [], returnType: 'Boolean' },
    { method_name: 'Network_set_enable', arguments: [{ type: 'Boolean', name: 'enabled' }], returnType: 'void' },
    { method_name: 'Network_is_enabled', arguments: [], returnType: 'Boolean' },
    { method_name: 'Network_send_message', arguments: [{ type: 'Network_target', name: 'target' }, { type: 'String', name: 'title' }, { type: 'any', name: 'data' }], returnType: 'void' },
    { method_name: 'Network_is_network_message', arguments: [], returnType: 'Boolean' }
]);

OpenBlock.AddNativeTypes({
    'Float32Array': [],
});
OpenBlock.AddNativeTypes({
    'WebAudio_AudioFile': [],
    'WebAudio_SimpleAudio': [],
    'WebAudio_AudioNode': [],
    'WebAudio_AudioBuffer': [],
    'WebAudio_AudioScheduledSourceNode': ['WebAudio_AudioNode'],
    'WebAudio_AudioParam': [],
    'WebAudio_AudioBufferSourceNode': ['WebAudio_AudioScheduledSourceNode'],
    'WebAudio_OscillatorNode': ['WebAudio_AudioScheduledSourceNode'],
    'WebAudio_BiquadFilterNode': ['WebAudio_AudioNode'],
    'WebAudio_ConvolverNode': ['WebAudio_AudioNode'],
    'WebAudio_DynamicsCompressorNode': ['WebAudio_AudioNode'],
    'WebAudio_MediaStreamAudioSourceNode': ['WebAudio_AudioNode'],
    'WebAudio_DelayNode': ['WebAudio_AudioNode'],
});
OpenBlock.nativeFunctionJson('WebAudio', 'WebAudio', [
    // simple
    { method_name: 'WebAudio_playAudio', arguments: [{ type: 'String', name: 'name' }], returnType: 'void' },
    { method_name: 'WebAudio_createSimpleAudio', arguments: [{ type: 'String', name: 'name' }], returnType: 'WebAudio_SimpleAudio' },
    { method_name: 'WebAudio_playSimpleAudio', arguments: [{ type: 'WebAudio_SimpleAudio', name: 'audio' }], returnType: 'void' },

    { method_name: 'WebAudio_getGlobalVolume', arguments: [], returnType: 'Number' },
    { method_name: 'WebAudio_setGlobalVolume', arguments: [{ type: 'Number', name: 'volume' }], returnType: 'void' },
    { method_name: 'WebAudio_getGlobalPan', arguments: [], returnType: 'Number' },
    { method_name: 'WebAudio_setGlobalPan', arguments: [{ type: 'Number', name: 'pan' }], returnType: 'void' },

    { method_name: 'WebAudio_getVolume', arguments: [{ type: 'WebAudio_SimpleAudio', name: 'audio' }], returnType: 'Number' },
    { method_name: 'WebAudio_setVolume', arguments: [{ type: 'WebAudio_SimpleAudio', name: 'audio' }, { type: 'Number', name: 'volume' }], returnType: 'void' },
    { method_name: 'WebAudio_getPan', arguments: [{ type: 'WebAudio_SimpleAudio', name: 'audio' }], returnType: 'Number' },
    { method_name: 'WebAudio_setPan', arguments: [{ type: 'WebAudio_SimpleAudio', name: 'audio' }, { type: 'Number', name: 'pan' }], returnType: 'void' },
    { method_name: 'WebAudio_setLoop', arguments: [{ type: 'WebAudio_SimpleAudio', name: 'audio' }, { type: 'Boolean', name: 'loop' }], returnType: 'void' },
    { method_name: 'WebAudio_isLoop', arguments: [{ type: 'WebAudio_SimpleAudio', name: 'audio' }], returnType: 'Boolean' },
    { method_name: 'WebAudio_suspend', arguments: [{ type: 'WebAudio_SimpleAudio', name: 'audio' }], returnType: 'void' },
    { method_name: 'WebAudio_resume', arguments: [{ type: 'WebAudio_SimpleAudio', name: 'audio' }], returnType: 'void' },
    { method_name: 'WebAudio_onended', arguments: [{ type: 'WebAudio_SimpleAudio', name: 'audio' }, { type: 'String', name: 'title' }], returnType: 'void' },
]);

OpenBlock.nativeFunctionJson('WebAudio_advanced', 'WebAudio_advanced', [
    // advanced
    { method_name: 'WebAudio_getAudioBuffer', arguments: [{ type: 'String', name: 'filename' }], returnType: 'WebAudio_AudioBuffer' },
    { method_name: 'WebAudio_getCurrentTime', arguments: [], returnType: 'Number' },
    { method_name: 'WebAudio_globalNode', arguments: [], returnType: 'WebAudio_DynamicsCompressorNode' },
    { method_name: 'WebAudio_reset', arguments: [], returnType: 'void' },
    // AudioNode
    { method_name: 'WebAudio_connectAudioNode', arguments: [{ type: 'WebAudio_AudioNode', name: 'self' }, { type: 'WebAudio_AudioNode', name: 'target' }], returnType: 'void' },
    { method_name: 'WebAudio_connectAudioParam', arguments: [{ type: 'WebAudio_AudioNode', name: 'self' }, { type: 'WebAudio_AudioParam', name: 'target' }], returnType: 'void' },
    { method_name: 'WebAudio_disconnectAllAudioNode', arguments: [{ type: 'WebAudio_AudioNode', name: 'self' }], returnType: 'void' },
    { method_name: 'WebAudio_disconnectAudioNode', arguments: [{ type: 'WebAudio_AudioNode', name: 'self' }, { type: 'WebAudio_AudioNode', name: 'target' }], returnType: 'void' },
    { method_name: 'WebAudio_disconnectAudioParam', arguments: [{ type: 'WebAudio_AudioNode', name: 'self' }, { type: 'WebAudio_AudioParam', name: 'target' }], returnType: 'void' },
    // -audio param
    { method_name: 'WebAudio_AudioParam_getDefaultValue', arguments: [{ type: 'WebAudio_AudioParam', name: 'param' }], returnType: 'Number' },
    { method_name: 'WebAudio_AudioParam_getMaxValue', arguments: [{ type: 'WebAudio_AudioParam', name: 'param' }], returnType: 'Number' },
    { method_name: 'WebAudio_AudioParam_getMinValue', arguments: [{ type: 'WebAudio_AudioParam', name: 'param' }], returnType: 'Number' },
    { method_name: 'WebAudio_AudioParam_getValue', arguments: [{ type: 'WebAudio_AudioParam', name: 'param' }], returnType: 'Number' },
    { method_name: 'WebAudio_AudioParam_setValue', arguments: [{ type: 'WebAudio_AudioParam', name: 'param' }, { type: 'Number', name: 'value' }], returnType: 'void' },
    {
        method_name: 'WebAudio_AudioParam_cancelAndHoldAtTime',
        arguments: [{ type: 'WebAudio_AudioParam', name: 'param' }, { type: 'Number', name: 'time' }], returnType: 'void'
    },
    {
        method_name: 'WebAudio_AudioParam_cancelScheduledValues', arguments:
            [{ type: 'WebAudio_AudioParam', name: 'param' }, { type: 'Number', name: 'startTime' }], returnType: 'void'
    },
    {
        method_name: 'WebAudio_AudioParam_setValueCurveAtTime', arguments:
            [{ type: 'WebAudio_AudioParam', name: 'param' }, { type: 'list<Number>', name: 'values' }, { type: 'Number', name: 'startTime' }, { type: 'Number', name: 'duration' }], returnType: 'void'
    },
    {
        method_name: 'WebAudio_AudioParam_setTargetAtTime', arguments:
            [{ type: 'WebAudio_AudioParam', name: 'param' }, { type: 'Number', name: 'target' }, { type: 'Number', name: 'startTime' }, { type: 'Number', name: 'timeConstant' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_AudioParam_setValueAtTime', arguments:
            [{ type: 'WebAudio_AudioParam', name: 'param' }, { type: 'Number', name: 'target' }, { type: 'Number', name: 'startTime' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_AudioParam_exponentialRampToValueAtTime', arguments:
            [{ type: 'WebAudio_AudioParam', name: 'param' }, { type: 'Number', name: 'value' }, { type: 'Number', name: 'endTime' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_AudioParam_linearRampToValueAtTime', arguments:
            [{ type: 'WebAudio_AudioParam', name: 'param' }, { type: 'Number', name: 'value' }, { type: 'Number', name: 'endTime' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_startScheduledSource', arguments:
            [{ type: 'WebAudio_AudioScheduledSourceNode', name: 'param' }, { type: 'Number', name: 'when' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_stopScheduledSource', arguments:
            [{ type: 'WebAudio_AudioScheduledSourceNode', name: 'param' }, { type: 'Number', name: 'when' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_ScheduledSourceSetOnendMsgTitle', arguments:
            [{ type: 'WebAudio_AudioScheduledSourceNode', name: 'param' }, { type: 'String', name: 'title' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_createBufferSource', arguments:
            [],
        returnType: 'WebAudio_AudioBufferSourceNode'
    },
    {
        method_name: 'WebAudio_AudioBufferSourceNode_getBuffer', arguments:
            [{ type: 'WebAudio_AudioBufferSourceNode', name: 'node' }],
        returnType: 'WebAudio_AudioBuffer'
    },
    {
        method_name: 'WebAudio_AudioBufferSourceNode_detune', arguments:
            [{ type: 'WebAudio_AudioBufferSourceNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_AudioBufferSourceNode_playbackRate', arguments:
            [{ type: 'WebAudio_AudioBufferSourceNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_AudioBufferSourceNode_isLoop', arguments:
            [{ type: 'WebAudio_AudioBufferSourceNode', name: 'node' }],
        returnType: 'Boolean'
    },
    {
        method_name: 'WebAudio_AudioBufferSourceNode_getLoopStart', arguments:
            [{ type: 'WebAudio_AudioBufferSourceNode', name: 'node' }],
        returnType: 'Number'
    },
    {
        method_name: 'WebAudio_AudioBufferSourceNode_getLoopEnd', arguments:
            [{ type: 'WebAudio_AudioBufferSourceNode', name: 'node' }],
        returnType: 'Number'
    },
    {
        method_name: 'WebAudio_AudioBufferSourceNode_setBuffer', arguments:
            [{ type: 'WebAudio_AudioBufferSourceNode', name: 'node' }, { type: 'WebAudio_AudioBuffer', name: 'buffer' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_AudioBufferSourceNode_setLoop', arguments:
            [{ type: 'WebAudio_AudioBufferSourceNode', name: 'node' }, { type: 'Boolean', name: 'loop' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_AudioBufferSourceNode_setLoopStart', arguments:
            [{ type: 'WebAudio_AudioBufferSourceNode', name: 'node' }, { type: 'Number', name: 'startTime' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_AudioBufferSourceNode_setLoopEnd', arguments:
            [{ type: 'WebAudio_AudioBufferSourceNode', name: 'node' }, { type: 'Number', name: 'endTime' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_createOscillator', arguments:
            [],
        returnType: 'WebAudio_OscillatorNode'
    },
    {
        method_name: 'WebAudio_OscillatorNode_frequency', arguments:
            [{ type: 'WebAudio_OscillatorNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_OscillatorNode_detune', arguments:
            [{ type: 'WebAudio_OscillatorNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_OscillatorNode_getType', arguments:
            [{ type: 'WebAudio_OscillatorNode', name: 'node' }],
        returnType: 'String'
    },
    {
        method_name: 'WebAudio_OscillatorNode_setType', arguments:
            [{ type: 'WebAudio_OscillatorNode', name: 'node' }, { type: 'String', name: 'type' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_createBiquadFilter', arguments:
            [],
        returnType: 'WebAudio_BiquadFilterNode'
    },
    {
        method_name: 'WebAudio_BiquadFilterNode_frequency', arguments:
            [{ type: 'WebAudio_BiquadFilterNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_BiquadFilterNode_detune', arguments:
            [{ type: 'WebAudio_BiquadFilterNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_BiquadFilterNode_Q', arguments:
            [{ type: 'WebAudio_BiquadFilterNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_BiquadFilterNode_gain', arguments:
            [{ type: 'WebAudio_BiquadFilterNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_BiquadFilterNode_getType', arguments:
            [{ type: 'WebAudio_BiquadFilterNode', name: 'node' }],
        returnType: 'String'
    },
    {
        method_name: 'WebAudio_BiquadFilterNode_setType', arguments:
            [{ type: 'WebAudio_BiquadFilterNode', name: 'node' }, { type: 'String', name: 'type' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_createConvolver', arguments:
            [],
        returnType: 'WebAudio_ConvolverNode'
    },
    {
        method_name: 'WebAudio_ConvolverNode_getBuffer', arguments:
            [{ type: 'WebAudio_ConvolverNode', name: 'node' }],
        returnType: 'WebAudio_AudioBuffer'
    },
    {
        method_name: 'WebAudio_ConvolverNode_getNormalize', arguments:
            [{ type: 'WebAudio_ConvolverNode', name: 'node' }],
        returnType: 'Boolean'
    },
    {
        method_name: 'WebAudio_ConvolverNode_setBuffer', arguments:
            [{ type: 'WebAudio_ConvolverNode', name: 'node' }, { type: 'WebAudio_AudioBuffer', name: 'buffer' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_ConvolverNode_setNormalize', arguments:
            [{ type: 'WebAudio_ConvolverNode', name: 'node' }, { type: 'Boolean', name: 'normalize' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_createGain', arguments:
            [],
        returnType: 'WebAudio_GainNode'
    },
    {
        method_name: 'WebAudio_GainNode_gain', arguments:
            [{ type: 'WebAudio_GainNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_createStereoPanner', arguments:
            [],
        returnType: 'WebAudio_StereoPannerNode'
    },
    {
        method_name: 'WebAudio_StereoPannerNode_pan', arguments:
            [{ type: 'WebAudio_StereoPannerNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_createDynamicsCompressor', arguments:
            [],
        returnType: 'WebAudio_DynamicsCompressorNode'
    },
    {
        method_name: 'WebAudio_DynamicsCompressorNode_threshold', arguments:
            [{ type: 'WebAudio_DynamicsCompressorNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_DynamicsCompressorNode_knee', arguments:
            [{ type: 'WebAudio_DynamicsCompressorNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_DynamicsCompressorNode_ratio', arguments:
            [{ type: 'WebAudio_DynamicsCompressorNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_DynamicsCompressorNode_reduction', arguments:
            [{ type: 'WebAudio_DynamicsCompressorNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_DynamicsCompressorNode_attack', arguments:
            [{ type: 'WebAudio_DynamicsCompressorNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_DynamicsCompressorNode_release', arguments:
            [{ type: 'WebAudio_DynamicsCompressorNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_createDelay', arguments:
            [{ type: 'Number', name: '最大延迟(小于180秒)' }],
        returnType: 'WebAudio_DelayNode'
    },
    {
        method_name: 'WebAudio_DelayNode_delayTime', arguments:
            [{ type: 'WebAudio_DelayNode', name: 'node' }],
        returnType: 'WebAudio_AudioParam'
    },
    {
        method_name: 'WebAudio_createWaveShaper', arguments:
            [],
        returnType: 'WebAudio_WaveShaperNode'
    },
    {
        method_name: 'WebAudio_WaveShaperNode_getOversample', arguments:
            [{ type: 'WebAudio_WaveShaperNode', name: 'node' }],
        returnType: 'String'
    },
    {
        method_name: 'WebAudio_WaveShaperNode_setOversample', arguments:
            [{ type: 'WebAudio_WaveShaperNode', name: 'node' }, { type: 'String', name: 'oversample' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_WaveShaperNode_getCurve', arguments:
            [{ type: 'WebAudio_WaveShaperNode', name: 'node' }],
        returnType: 'list<Number>'
    },
    {
        method_name: 'WebAudio_WaveShaperNode_setCurve', arguments:
            [{ type: 'WebAudio_WaveShaperNode', name: 'node' }, { type: 'list<Number>', name: 'curve' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_openMic', arguments:
            [{ type: 'String', name: 'messageTitle' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_loadAudioFile', arguments:
            [{ type: 'String', name: 'messageTitle' }],
        returnType: 'void'
    },
    {
        method_name: 'WebAudio_fileName', arguments:
            [{ type: 'WebAudio_AudioFile', name: 'file' }], returnType: 'String'
    },
    {
        method_name: 'WebAudio_fileContent', arguments:
            [{ type: 'WebAudio_AudioFile', name: 'file' }], returnType: 'WebAudio_AudioBuffer'
    },
    {
        method_name: 'WebAudio_createAudioBuffer', arguments:
            [{ type: 'Integer', name: 'numOfChannels' }, { type: 'Integer', name: 'length' }, { type: 'Integer', name: 'sampleRate' }], returnType: 'WebAudio_AudioBuffer'
    },
    {
        method_name: 'WebAudio_AudioBuffer_sampleRate', arguments:
            [{ type: 'WebAudio_AudioBuffer', name: 'buffer' }], returnType: 'Number'
    },
    {
        method_name: 'WebAudio_AudioBuffer_length', arguments:
            [{ type: 'WebAudio_AudioBuffer', name: 'buffer' }], returnType: 'Number'
    },
    {
        method_name: 'WebAudio_AudioBuffer_duration', arguments:
            [{ type: 'WebAudio_AudioBuffer', name: 'buffer' }], returnType: 'Number'
    },
    {
        method_name: 'WebAudio_AudioBuffer_numberOfChannels', arguments:
            [{ type: 'WebAudio_AudioBuffer', name: 'buffer' }], returnType: 'Number'
    },
    {
        method_name: 'WebAudio_AudioBuffer_getChannelData', arguments:
            [{ type: 'WebAudio_AudioBuffer', name: 'buffer' }, { type: 'Integer', name: 'channelNumber' }], returnType: 'Float32Array'
    },
    {
        method_name: 'WebAudio_AudioBuffer_copyFromChannel', arguments:
            [{ type: 'WebAudio_AudioBuffer', name: 'buffer' }, { type: 'Float32Array', name: 'destination' }, { type: 'Integer', name: 'channelNumber' }, { type: 'Integer', name: 'startInChannel' }], returnType: 'void'
    },
    {
        method_name: 'WebAudio_AudioBuffer_copyToChannel', arguments:
            [{ type: 'WebAudio_AudioBuffer', name: 'buffer' }, { type: 'Float32Array', name: 'destination' }, { type: 'Integer', name: 'channelNumber' }, { type: 'Integer', name: 'startInChannel' }], returnType: 'void'
    },
    {
        method_name: 'Float32ArrayToArray', arguments:
            [{ type: 'Float32Array', name: 'buffer' }], returnType: 'list<Number>'
    },
    {
        method_name: 'ArrayToFloat32Array', arguments:
            [{ type: 'list<Number>', name: 'buffer' }], returnType: 'Float32Array'
    },
]);

OpenBlock.AddNativeTypes({ 'ArrayBuffer': [] });
OpenBlock.nativeFunctionJson('sys_file', 'sys_file', [
    {
        method_name: 'sys_file_select_open_as_string', arguments:
            [{ type: 'String', name: 'extensions' }, { type: 'String', name: 'title' }], returnType: 'void'
    },
    {
        method_name: 'sys_file_select_open_as_struct_data', arguments:
            [{ type: 'String', name: 'extensions' }, { type: 'String', name: 'title' }], returnType: 'void'
    },
    {
        method_name: 'sys_file_select_open_as_bin', arguments:
            [{ type: 'String', name: 'extensions' }, { type: 'String', name: 'title' }], returnType: 'void'
    },
    {
        method_name: 'sys_file_save_struct', arguments:
            [{ type: 'String', name: 'filename' }, { type: 'any', name: 'content' }], returnType: 'void'
    },
    {
        method_name: 'sys_file_save_text', arguments:
            [{ type: 'String', name: 'filename' }, { type: 'String', name: 'content' }], returnType: 'void'
    },
]);
OpenBlock.nativeFunctionJson('sys_io', 'sys_io', [
    {
        method_name: 'sys_io_prompt', arguments:
            [{ type: 'String', name: 'question' }, { type: 'String', name: 'title' }], returnType: 'void'
    },
]);
OpenBlock.nativeFunctionJson('sys_window', 'sys_window', [
    {
        method_name: 'sys_window_set_width', arguments:
            [{ type: 'Number', name: 'width' }], returnType: 'void'
    },
    {
        method_name: 'sys_window_set_height', arguments:
            [{ type: 'Number', name: 'height' }], returnType: 'void'
    },
    {
        method_name: 'sys_window_get_width', arguments:
            [], returnType: 'Number'
    },
    {
        method_name: 'sys_window_get_height', arguments:
            [], returnType: 'Number'
    },
]);

OpenBlock.AddNativeTypes({ 'Date': [] });
OpenBlock.nativeFunctionJson('sys_time', 'sys_time', [
    {
        method_name: 'sys_time_timestamp', arguments:
            [], returnType: 'Integer'
    },
    {
        method_name: 'sys_time_new_date', arguments:
            [], returnType: 'Date'
    },
    {
        method_name: 'sys_time_new_date_by_timestamp', arguments:
            [{ type: 'Integer', name: "timestamp" }], returnType: 'Date'
    },
    {
        method_name: 'sys_time_date_getDate', arguments:
            [{ type: 'Date', name: "DATE" }], returnType: 'Integer'
    },
    {
        method_name: 'sys_time_date_getDay', arguments:
            [{ type: 'Date', name: "DATE" }], returnType: 'Integer'
    },
    {
        method_name: 'sys_time_date_getFullYear', arguments:
            [{ type: 'Date', name: "DATE" }], returnType: 'Integer'
    },
    {
        method_name: 'sys_time_date_getHours', arguments:
            [{ type: 'Date', name: "DATE" }], returnType: 'Integer'
    },
    {
        method_name: 'sys_time_date_getMilliseconds', arguments:
            [{ type: 'Date', name: "DATE" }], returnType: 'Integer'
    },
    {
        method_name: 'sys_time_date_getMinutes', arguments:
            [{ type: 'Date', name: "DATE" }], returnType: 'Integer'
    },
    {
        method_name: 'sys_time_date_getMonth', arguments:
            [{ type: 'Date', name: "DATE" }], returnType: 'Integer'
    },
    {
        method_name: 'sys_time_date_getSeconds', arguments:
            [{ type: 'Date', name: "DATE" }], returnType: 'Integer'
    },
    {
        method_name: 'sys_time_date_getTime', arguments:
            [{ type: 'Date', name: "DATE" }], returnType: 'String'
    },


    {
        method_name: 'sys_time_date_setDate', arguments:
            [{ type: 'Date', name: "DATE" }, { type: 'Integer', name: 'VALUE' }]
    },
    {
        method_name: 'sys_time_date_setFullYear', arguments:
            [{ type: 'Date', name: "DATE" }, { type: 'Integer', name: 'VALUE' }],
    },
    {
        method_name: 'sys_time_date_setHours', arguments:
            [{ type: 'Date', name: "DATE" }, { type: 'Integer', name: 'VALUE' }],
    },
    {
        method_name: 'sys_time_date_setMilliseconds', arguments:
            [{ type: 'Date', name: "DATE" }, { type: 'Integer', name: 'VALUE' }],
    },
    {
        method_name: 'sys_time_date_setMinutes', arguments:
            [{ type: 'Date', name: "DATE" }, { type: 'Integer', name: 'VALUE' }],
    },
    {
        method_name: 'sys_time_date_setMonth', arguments:
            [{ type: 'Date', name: "DATE" }, { type: 'Integer', name: 'VALUE' }],
    },
    {
        method_name: 'sys_time_date_setSeconds', arguments:
            [{ type: 'Date', name: "DATE" }, { type: 'Integer', name: 'VALUE' }],
    },
    {
        method_name: 'sys_time_date_setTime', arguments:
            [{ type: 'Date', name: "DATE" }, { type: 'Integer', name: 'VALUE' }]
    },
]);