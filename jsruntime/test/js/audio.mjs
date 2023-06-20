/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"
import * as obvm from '../../runtime/vm.mjs'
class SimpleAudio {
    constructor(source, gainNode, pannerNode) {
        this.source = source;
        this.gainNode = gainNode;
        this.pannerNode = pannerNode;
    }
}
class OBAudio {
    static reset() {
        if (!OBAudio.mainAudioCtx) {
            let audioCtx = OBAudio.createAudioContext();
            OBAudio.mainAudioCtx = audioCtx;
            // volume
            OBAudio.mainGainNode = audioCtx.createGain();
            // panning
            OBAudio.mainPanner = audioCtx.createStereoPanner();
            OBAudio.mainGainNode.connect(OBAudio.mainPanner);
            OBAudio.mainPanner.connect(OBAudio.mainAudioCtx.destination);
        } else {
            OBAudio.mainGainNode.gain.value = 1;
            OBAudio.mainPanner.pan.value = 0;
        }
        if (OBAudio.mainCompressor) {
            OBAudio.mainCompressor.disconnect();
        }
        // Create a compressor node
        const compressor = OBAudio.mainAudioCtx.createDynamicsCompressor();
        compressor.connect(OBAudio.mainGainNode);
        OBAudio.mainCompressor = compressor;
    }
    install(script) {
        OBAudio.reset();
        let gettype = script.NativeUtil.objFieldGetter('type', 'StringRegister');
        let settype = script.NativeUtil.objFieldSetter('type', 'StringRegister');
        script.InstallLib("WebAudio", "WebAudio", [
            // Simple
            script.NativeUtil.closureVoid(this.playAudio.bind(this),
                ['StringRegister'], true),
            script.NativeUtil.closureReturnValue(this.createSimpleAudio.bind(this),
                'NObjectRegister', ['StringRegister'], true),
            script.NativeUtil.closureVoid(this.playSimpleAudio.bind(this),
                ['NObjectRegister']),

            script.NativeUtil.closureReturnValue(this.getGlobalVolume.bind(this),
                'DoubleRegister', []),
            script.NativeUtil.closureVoid(this.setGlobalVolume.bind(this),
                ['DoubleRegister']),
            script.NativeUtil.closureReturnValue(this.getGlobalPan.bind(this),
                'DoubleRegister', []),
            script.NativeUtil.closureVoid(this.setGlobalPan.bind(this),
                ['DoubleRegister']),

            script.NativeUtil.closureReturnValue(this.getVolume.bind(this),
                'DoubleRegister', ['NObjectRegister']),
            script.NativeUtil.closureVoid(this.setVolume.bind(this),
                ['NObjectRegister', 'DoubleRegister']),
            script.NativeUtil.closureReturnValue(this.getPan.bind(this),
                'DoubleRegister', ['NObjectRegister']),
            script.NativeUtil.closureVoid(this.setPan.bind(this),
                ['NObjectRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.setLoop.bind(this),
                ['NObjectRegister', 'LongRegister']),
            script.NativeUtil.closureReturnValue(this.isLoop.bind(this),
                'LongRegister', ['NObjectRegister']),
            script.NativeUtil.closureVoid(this.suspend.bind(this),
                ['NObjectRegister']),
            script.NativeUtil.closureVoid(this.resume.bind(this),
                ['NObjectRegister']),
            script.NativeUtil.closureVoid(this.onended.bind(this),
                ['NObjectRegister', 'StringRegister'], true),]);

        script.InstallLib("WebAudio_advanced", "WebAudio_advanced", [
            // advanced
            // - global
            script.NativeUtil.closureReturnValue(this.getAudioBuffer.bind(this),
                'NObjectRegister', ['StringRegister'], true),
            script.NativeUtil.closureReturnValue(this.getCurrentTime.bind(this),
                'DoubleRegister', []),
            script.NativeUtil.closureReturnValue(this.globalNode.bind(this),
                'NObjectRegister', []),
            script.NativeUtil.closureVoid(OBAudio.reset.bind(OBAudio), []),
            // - audio node
            script.NativeUtil.closureVoid(this.connectAudioNode.bind(this),
                ['NObjectRegister', 'NObjectRegister']),
            script.NativeUtil.closureVoid(this.connectAudioParam.bind(this),
                ['NObjectRegister', 'NObjectRegister']),
            script.NativeUtil.closureVoid(this.disconnectAllAudioNode.bind(this),
                ['NObjectRegister']),
            script.NativeUtil.closureVoid(this.disconnectAudioNode.bind(this),
                ['NObjectRegister', 'NObjectRegister']),
            script.NativeUtil.closureVoid(this.disconnectAudioNode.bind(this),
                ['NObjectRegister', 'NObjectRegister']),
            // -audio param
            script.NativeUtil.objFieldGetter('defaultValue', 'DoubleRegister'),
            script.NativeUtil.objFieldGetter('maxValue', 'DoubleRegister'),
            script.NativeUtil.objFieldGetter('minValue', 'DoubleRegister'),
            script.NativeUtil.objFieldGetter('value', 'DoubleRegister'),
            script.NativeUtil.objFieldSetter('value', 'DoubleRegister'),
            script.NativeUtil.closureVoid(this.AudioParam_cancelAndHoldAtTime.bind(this),
                ['NObjectRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.AudioParam_cancelScheduledValues.bind(this),
                ['NObjectRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.AudioParam_setValueCurveAtTime.bind(this),
                ['NObjectRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.AudioParam_setTargetAtTime.bind(this),
                ['NObjectRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.AudioParam_setValueAtTime.bind(this),
                ['NObjectRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.AudioParam_exponentialRampToValueAtTime.bind(this),
                ['NObjectRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.AudioParam_linearRampToValueAtTime.bind(this),
                ['NObjectRegister', 'DoubleRegister', 'DoubleRegister']),
            // - scheduledSource
            script.NativeUtil.closureVoid(this.startScheduledSource.bind(this),
                ['NObjectRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.stopScheduledSource.bind(this),
                ['NObjectRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.ScheduledSourceSetOnendMsgTitle.bind(this),
                ['NObjectRegister', 'StringRegister'], true),
            // - nodes
            // -- AudioBufferSourceNode
            script.NativeUtil.closureReturnValue(
                OBAudio.mainAudioCtx.createBufferSource.bind(OBAudio.mainAudioCtx),
                'NObjectRegister', []),
            script.NativeUtil.objFieldGetter('buffer', 'NObjectRegister'),
            script.NativeUtil.objFieldGetter('detune', 'NObjectRegister'),
            script.NativeUtil.objFieldGetter('playbackRate', 'NObjectRegister'),
            script.NativeUtil.objFieldGetter('loop', 'LongRegister'),
            script.NativeUtil.objFieldGetter('loopStart', 'DoubleRegister'),
            script.NativeUtil.objFieldGetter('loopEnd', 'DoubleRegister'),
            script.NativeUtil.objFieldSetter('buffer', 'NObjectRegister'),
            script.NativeUtil.objFieldSetter('loop', 'LongRegister'),
            script.NativeUtil.objFieldSetter('loopStart', 'DoubleRegister'),
            script.NativeUtil.objFieldSetter('loopEnd', 'DoubleRegister'),
            // -- OscillatorNode
            script.NativeUtil.closureReturnValue(
                OBAudio.mainAudioCtx.createOscillator.bind(OBAudio.mainAudioCtx),
                'NObjectRegister', []),
            script.NativeUtil.objFieldGetter('frequency', 'NObjectRegister'),
            script.NativeUtil.objFieldGetter('detune', 'NObjectRegister'),
            gettype,
            settype,
            // -- BiquadFilterNode
            script.NativeUtil.closureReturnValue(
                OBAudio.mainAudioCtx.createBiquadFilter.bind(OBAudio.mainAudioCtx),
                'NObjectRegister', []),
            script.NativeUtil.objFieldGetter('frequency', 'NObjectRegister'),
            script.NativeUtil.objFieldGetter('detune', 'NObjectRegister'),
            script.NativeUtil.objFieldGetter('Q', 'NObjectRegister'),
            script.NativeUtil.objFieldGetter('gain', 'NObjectRegister'),
            gettype,
            settype,
            // -- ConvolverNode
            script.NativeUtil.closureReturnValue(
                OBAudio.mainAudioCtx.createConvolver.bind(OBAudio.mainAudioCtx),
                'NObjectRegister', []),
            script.NativeUtil.objFieldGetter('buffer', 'NObjectRegister'),
            script.NativeUtil.objFieldGetter('normalize', 'LongRegister'),
            script.NativeUtil.objFieldSetter('buffer', 'NObjectRegister'),
            script.NativeUtil.objFieldSetter('normalize', 'LongRegister'),
            // -- GainNode
            script.NativeUtil.closureReturnValue(
                OBAudio.mainAudioCtx.createGain.bind(OBAudio.mainAudioCtx),
                'NObjectRegister', []),
            script.NativeUtil.objFieldGetter('gain', 'LongRegister'),
            // -- StereoPannerNode
            script.NativeUtil.closureReturnValue(
                OBAudio.mainAudioCtx.createStereoPanner.bind(OBAudio.mainAudioCtx),
                'NObjectRegister', []),
            script.NativeUtil.objFieldGetter('pan', 'NObjectRegister'),
            // -- DynamicsCompressorNode
            script.NativeUtil.closureReturnValue(
                OBAudio.mainAudioCtx.createDynamicsCompressor.bind(OBAudio.mainAudioCtx),
                'NObjectRegister', []),
            script.NativeUtil.objFieldGetter('threshold', 'NObjectRegister'),
            script.NativeUtil.objFieldGetter('knee', 'NObjectRegister'),
            script.NativeUtil.objFieldGetter('ratio', 'NObjectRegister'),
            script.NativeUtil.objFieldGetter('reduction', 'NObjectRegister'),
            script.NativeUtil.objFieldGetter('attack', 'NObjectRegister'),
            script.NativeUtil.objFieldGetter('release', 'NObjectRegister'),
            // -- DelayNode
            script.NativeUtil.closureReturnValue(
                OBAudio.mainAudioCtx.createDelay.bind(OBAudio.mainAudioCtx),
                'NObjectRegister', ['DoubleRegister']),
            script.NativeUtil.objFieldGetter('delayTime', 'NObjectRegister'),
            // -- WaveShaperNode
            script.NativeUtil.closureReturnValue(
                OBAudio.mainAudioCtx.createWaveShaper.bind(OBAudio.mainAudioCtx),
                'NObjectRegister', []),
            script.NativeUtil.objFieldGetter('oversample', 'StringRegister'),
            // none,2x,4x
            script.NativeUtil.objFieldSetter('oversample', 'StringRegister'),
            script.NativeUtil.closureReturnValue(this.getCurve,
                'StructRegister', ['NObjectRegister']),
            script.NativeUtil.closureVoid(this.setCurve,
                ['NObjectRegister', 'StructRegister']),
            // MediaStreamAudioSourceNode
            script.NativeUtil.closureVoid(this.openMic.bind(this),
                ['StringRegister'], true),
            script.NativeUtil.closureVoid(this.loadAudioFile.bind(this.this), ['StringRegister'], true),
            script.NativeUtil.objFieldGetter('name', 'StringRegister'),
            script.NativeUtil.objFieldGetter('content', 'NObjectRegister'),
            // AudioBuffer
            script.NativeUtil.closureReturnValue(
                OBAudio.mainAudioCtx.createBuffer.bind(OBAudio.mainAudioCtx),
                'NObjectRegister', ['LongRegister', 'LongRegister', 'LongRegister']),
            script.NativeUtil.objFieldGetter('sampleRate', 'DoubleRegister'),
            script.NativeUtil.objFieldGetter('length', 'DoubleRegister'),
            script.NativeUtil.objFieldGetter('duration', 'DoubleRegister'),
            script.NativeUtil.objFieldGetter('numberOfChannels', 'DoubleRegister'),
            script.NativeUtil.objMethodInvoke(AudioBuffer, 'getChannelData', 'NObjectRegister',
                ['LongRegister'], undefined, false),
            script.NativeUtil.objMethodInvoke(AudioBuffer, 'copyFromChannel', null,
                ['NObjectRegister', 'LongRegister', 'LongRegister'], undefined, false),
            script.NativeUtil.objMethodInvoke(AudioBuffer, 'copyToChannel', null,
                ['NObjectRegister', 'LongRegister', 'LongRegister'], undefined, false),
            // Float32Array
            script.NativeUtil.closureReturnValue(this.Float32ArrayToArray,
                'StructRegister', ['NObjectRegister']),
            script.NativeUtil.closureReturnValue(this.ArrayToFloat32Array,
                'NObjectRegister', ['StructRegister']),
        ]);
    }
    Float32ArrayToArray(fa) {
        return obvm.OBList.fromArray(Array.from(fa));
    }
    ArrayToFloat32Array(a) {
        return Float32Array.from(a.toArray());
    }
    loadAudioFile(callbackTitle, st) {
        let fsm = st.fsm
        let fileOD = window.FileOD;
        fileOD.Open('.wav,.mp3', 'ArrayBuffer', (file) => {
            if (file) {
                let buf = file.content;
                let name = file.name;
                OBAudio.mainAudioCtx.decodeAudioData(buf, (buffer) => {
                    fsm.PostMessage(new obvm.UserMessage(callbackTitle,
                        'WebAudio_AudioFile', { name, content: buffer }, null));
                }, (e) => {
                    console.error("Error with decoding audio data" + e.err + ":" + name);
                });
            }
        });
    }
    /**
     * 
     * @param {*} title 
     * @returns 
     */
    openMic(title, st) {
        let fsm = st.fsm;
        navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {
            if (stream) {
                var audioCtx = OBAudio.mainAudioCtx;
                var source = audioCtx.createMediaStreamSource(stream);
                fsm.PostMessage(new obvm.UserMessage(title,
                    'WebAudio_MediaStreamAudioSourceNode', source, null));
            }
        }).catch(e => {
            console.error(e);
        });

        // let stream = navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        // var audioCtx = OBAudio.mainAudioCtx;
        // var source = audioCtx.createMediaStreamSource(stream);
        // return source;
    }
    getCurve(waveshper) {
        if (waveshper) {
            return obvm.OBList.fromArray(waveshper.curve);
        } else {
            return obvm.OBList.fromArray([]);
        }
    }
    setCurve(waveshper, arr) {
        if (!waveshper) {
            return;
        }
        if (arr) {
            let f32arr = Float32Array.from(arr);
            waveshper.curve = f32arr;
        } else {
            waveshper.curve = new Float32Array(0);
        }
    }
    AudioParam_cancelAndHoldAtTime(param, time) {
        if (param) {
            param.cancelAndHoldAtTime(time);
        }
    }
    AudioParam_cancelScheduledValues(param, time) {
        if (param) {
            param.cancelScheduledValues(time);
        }
    }
    AudioParam_setValueCurveAtTime(param, value, time) {
        if (param) {
            param.setValueCurveAtTime(value, time);
        }
    }
    AudioParam_setTargetAtTime(param, value, time) {
        if (param) {
            param.setTargetAtTime(value, time);
        }
    }
    AudioParam_exponentialRampToValueAtTime(param, value, time) {
        if (param) {
            param.exponentialRampToValueAtTime(value, time);
        }
    }
    AudioParam_linearRampToValueAtTime(param, value, time) {
        if (param) {
            param.linearRampToValueAtTime(value, time);
        }
    }
    AudioParam_setValueAtTime(param, value, time) {
        if (param) {
            param.setValueAtTime(value, time);
        }
    }
    ScheduledSourceSetOnendMsgTitle(sds, title, state) {
        if (sds) {
            if (!title) {
                sds.onendedMsgTitle = null;
                return;
            }
            if (!sds.listenningFSM) {
                sds.addEventListener('ended', event => {
                    sds.listenningFSM.PostMessage(new obvm.UserMessage(sds.onendedMsgTitle, null, null, null));
                });
            }
            sds.onendedMsgTitle = title;
            sds.listenningFSM = state.fsm;
        }
    }
    getCurrentTime() {
        return OBAudio.mainAudioCtx.currentTime;
    }
    globalNode() {
        return OBAudio.mainCompressor;
    }
    connectAudioNode(srcNode, targetNode) {
        if (srcNode && targetNode) {
            srcNode.connect(targetNode);
        }
    }
    connectAudioParam(srcNode, targetNode) {
        if (srcNode && targetNode) {
            srcNode.connect(targetNode);
        }
    }
    disconnectAllAudioNode(srcNode) {
        if (srcNode) {
            srcNode.connect();
        }
    }
    disconnectAudioNode(srcNode, targetNode) {
        if (srcNode && targetNode) {
            srcNode.connect(targetNode);
        }
    }
    startScheduledSource(schSre, when) {
        if (schSre) {
            schSre.start(when);
        }
    }
    stopScheduledSource(schSre, when) {
        if (schSre) {
            schSre.stop(when);
        }
    }
    getAudioBuffer(name, st) {
        let vm = st.fsm.VM;
        let asset = vm.assets[name];
        return asset;
    }
    createBufferSource(name, st) {
        let asset = this.getAudioBuffer(name, st);
        if (asset instanceof AudioBuffer) {

            let audioCtx = OBAudio.mainAudioCtx;
            // Get an AudioBufferSourceNode.
            // This is the AudioNode to use when we want to play an AudioBuffer
            var source = audioCtx.createBufferSource();

            // set the buffer in the AudioBufferSourceNode
            source.buffer = asset;
            return source;
        } else {
            st.fsm.VM.Log('Can\'t find audio ' + name);
        }
    }
    playAudio(name, state) {
        if (!name) {
            return;
        }
        let source = this.createBufferSource(name, state);
        if (source) {
            // connect the AudioBufferSourceNode to the
            // destination so we can hear the sound
            source.connect(OBAudio.mainCompressor);

            // start the source playing
            source.start();
        }
    }
    setGlobalPan(pan) {
        OBAudio.mainPanner.pan.linearRampToValueAtTime(pan, OBAudio.mainAudioCtx.currentTime + 0.1);
    }
    getGlobalPan() {
        return OBAudio.mainPanner.pan.value;
    }
    setGlobalVolume(volume) {
        OBAudio.mainGainNode.gain.value = volume;
    }
    getGlobalVolume() {
        return OBAudio.mainGainNode.gain.value;
    }
    createSimpleAudio(name, state) {
        if (!name) {
            return;
        }
        let source = this.createBufferSource(name, state);
        if (source) {
            let audioCtx = OBAudio.mainAudioCtx;
            // volume
            let gainNode = audioCtx.createGain();
            // panning
            const panner = audioCtx.createStereoPanner();
            source.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(OBAudio.mainCompressor);
            let sa = new SimpleAudio(source, gainNode, panner);
            return sa;
        }
    }
    playSimpleAudio(audio) {
        if (audio) {
            if (audio.source.started) {
                let audioCtx = OBAudio.mainAudioCtx;
                audio.source.stop();
                let buffer = audio.source.buffer;
                var source = audioCtx.createBufferSource();
                source.loop = audio.source.loop;
                source.buffer = buffer;
                audio.source = source;
                source.connect(audio.gainNode);
            }
            audio.source.started = true;
            audio.source.start();
        }
    }
    setVolume(audio, volume) {
        if (audio) {
            audio.gainNode.gain.value = volume;
            // audio.gainNode.gain.linearRampToValueAtTime(volume, OBAudio.mainAudioCtx.currentTime + 0.05);
        }
    }
    getVolume(audio) {
        if (audio) {
            return audio.gainNode.gain.value;
        }
    }
    setPan(audio, pan) {
        if (audio) {
            audio.pannerNode.pan.linearRampToValueAtTime(pan, OBAudio.mainAudioCtx.currentTime + 0.1);
        }
    }
    getPan(audio) {
        if (audio) {
            return audio.pannerNode.pan.value;
        }
    }
    setLoop(audio, l) {
        if (audio) {
            audio.source.loop = l;
        }
    }
    isLoop(audio) {
        if (audio) {
            return audio.source.loop;
        }
    }
    suspend(audio) {
        if (audio) {
            audio.source.disconnect();
        }
    }
    resume(audio) {
        if (audio) {
            try {
                audio.source.connect(audio.gainNode);
            } catch (e) {

            }
        }
    }
    onended(audio, messageTitle, state) {
        if (audio) {
            if (!messageTitle) {
                audio.onendedMsgTitle = null;
                return;
            }
            if (!audio.listenningFSM) {
                audio.source.addEventListener('ended', event => {
                    audio.listenningFSM.PostMessage(new obvm.UserMessage(audio.onendedMsgTitle, null, null, null));
                });
            }
            audio.onendedMsgTitle = messageTitle;
            audio.listenningFSM = state.fsm;
        }
    }
}
(function () {
    OBAudio.createAudioContext = () => {
        let AudioContext = window.AudioContext || window.webkitAudioContext;
        return new AudioContext();
    };
    OBAudio.reset();
})();
export { OBAudio };