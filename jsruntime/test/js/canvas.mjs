/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"
import * as obvm from '../../runtime/vm.mjs'
import * as util from '../../runtime/util.mjs'

class Vector2 {
    // x; y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class OBCanvas2D {
    // /**
    //  * @type {HTMLCanvasElement}
    //  */
    // canvas;
    // /**
    //  * @type {CanvasRenderingContext2D}
    //  */
    // canvas2dctx;
    // /**
    //  * 
    //  * @param {HTMLCanvasElement} canvas 
    //  */
    constructor(canvas) {
        this.canvas = canvas;
        this.canvas2dctx = canvas.getContext('2d');
    }
    /**
     *
     * @param {Number} color
     */
    setFillStyleColor(color) {
        let str_color;
        if (color < 0) {
            str_color = (Number.MAX_SAFE_INTEGER + color + 1).toString(16).substr(-8)
            str_color = '#' + str_color;
        } else {
            str_color = '#' + color.toString(16).padStart(8, '0');
        }
        this.canvas2dctx.fillStyle = str_color;
    }
    /**
     *
     * @param {Number} color
     */
    setStrokeStyleColor(color) {
        let str_color;
        if (color < 0) {
            str_color = (Number.MAX_SAFE_INTEGER + color + 1).toString(16).substr(-8)
            str_color = '#' + str_color;
        } else {
            str_color = '#' + color.toString(16).padStart(8, '0');
        }
        this.canvas2dctx.strokeStyle = str_color;
    }
    getVector2X(v) {
        return v.x;
    }
    getVector2Y(v) {
        return v.y;
    }
    getImageFromAssets(imageName, st) {
        if (!imageName) {
            return;
        }
        let vm = st.fsm.VM;
        let asset = vm.assets[imageName];
        if (!asset) {
            vm.Log('no asset named ' + imageName);
            return;
        }
        if (!(asset instanceof Image)) {
            vm.Log('asset named ' + imageName + ' is not Image');
            return;
        }
        return asset;
    }
    drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, st) {
        if (!(image instanceof Image)) {
            st.fsm.VM.Log('argument is not Image');
            return;
        }
        let rx = dWidth < 0;
        if (rx) {
            dx = -dx;
        }
        let ry = dHeight < 0;
        if (ry) {
            dy = -dy;
        }
        if (rx || ry) {
            this.canvas2dctx.save();
            this.canvas2dctx.scale(rx ? -1 : 1, ry ? -1 : 1);
        }
        this.canvas2dctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        if (rx || ry) {
            this.canvas2dctx.restore();
        }
    }
    drawImage8arg(imageName, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, st) {
        let asset = this.getImageFromAssets(imageName, st);
        if (!asset) {
            return;
        }
        this.drawImage(asset, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    }
    drawImage4arg(imageName, dx, dy, dWidth, dHeight, st) {
        let asset = this.getImageFromAssets(imageName, st);
        if (!asset) {
            return;
        }
        this.drawImage8arg(imageName, 0, 0, asset.width, asset.height, dx, dy, dWidth, dHeight, st);
    }
    drawImage2arg(imageName, dx, dy, st) {
        let asset = this.getImageFromAssets(imageName, st);
        if (!asset) {
            return;
        }
        this.drawImage4arg(imageName, dx, dy, asset.width, asset.height, st);
    }
    imageWidth(imageName, st) {
        let asset = this.getImageFromAssets(imageName, st);
        if (!asset) {
            return 0;
        }
        return asset.width;
    }
    imageHeight(imageName, st) {
        let asset = this.getImageFromAssets(imageName, st);
        if (!asset) {
            return 0;
        }
        return asset.height;
    }
    imageObjectWidth(asset) {
        if (asset) {
            return asset.width;
        } else {
            return 0;
        }
    }
    imageObjectHeight(asset) {
        if (asset) {
            return asset.height;
        } else {
            return 0;
        }
    }
    doublePropertyOfCanvas(name) {
        return this.canvas[name];
    }
    textWidth(str) {
        return this.canvas2dctx.measureText(str).width;
    }
    /**
     * 安装到脚本库
     * @param {OBScript} script 
     */
    install(script) {
        script.InstallLib("canvas2d", "canvas2d", [
            script.NativeUtil.closureVoid(this.canvas2dctx.fillRect.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.clearRect.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister']),
            // canvas2dctx.fillStyle=color
            script.NativeUtil.closureVoid(this.setFillStyleColor.bind(this), ['LongRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.strokeRect.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.fillText.bind(this.canvas2dctx), ['StringRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.beginPath.bind(this.canvas2dctx), []),
            script.NativeUtil.closureVoid(this.canvas2dctx.arc.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.fill.bind(this.canvas2dctx), []),
            script.NativeUtil.closureVoid(this.canvas2dctx.closePath.bind(this.canvas2dctx), []),
            script.NativeUtil.fieldSetter(this.canvas2dctx, 'font', 'StringRegister'),
            script.NativeUtil.fieldGetter(this.canvas2dctx, 'font', 'StringRegister'),
            script.NativeUtil.closureVoid(this.canvas2dctx.arcTo.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.bezierCurveTo.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.moveTo.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.lineTo.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.fieldSetter(this.canvas2dctx, 'textAlign', 'StringRegister'),
            script.NativeUtil.fieldGetter(this.canvas2dctx, 'textAlign', 'StringRegister'),
            script.NativeUtil.fieldSetter(this.canvas2dctx, 'textBaseline', 'StringRegister'),
            script.NativeUtil.fieldGetter(this.canvas2dctx, 'textBaseline', 'StringRegister'),
            script.NativeUtil.closureVoid(this.canvas2dctx.ellipse.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'LongRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.rect.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.rotate.bind(this.canvas2dctx), ['DoubleRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.scale.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.setStrokeStyleColor.bind(this), ['LongRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.stroke.bind(this.canvas2dctx), []),
            script.NativeUtil.objFieldGetter('x', 'DoubleRegister'),
            script.NativeUtil.objFieldGetter('y', 'DoubleRegister'),
            script.NativeUtil.fieldGetter(this.canvas, 'height', 'LongRegister'),
            script.NativeUtil.fieldGetter(this.canvas, 'width', 'LongRegister'),
            script.NativeUtil.fieldSetter(this.canvas2dctx, 'lineWidth', 'DoubleRegister'),
            script.NativeUtil.fieldGetter(this.canvas2dctx, 'lineWidth', 'DoubleRegister'),
            script.NativeUtil.closureVoid(this.drawImage8arg.bind(this), ['StringRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister'], true),
            script.NativeUtil.closureVoid(this.drawImage4arg.bind(this), ['StringRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister'], true),
            script.NativeUtil.closureVoid(this.drawImage2arg.bind(this), ['StringRegister', 'DoubleRegister', 'DoubleRegister'], true),
            script.NativeUtil.closureReturnValue(this.imageWidth.bind(this), 'DoubleRegister', ['StringRegister'], true),
            script.NativeUtil.closureReturnValue(this.imageHeight.bind(this), 'DoubleRegister', ['StringRegister'], true),
            script.NativeUtil.closureVoid(this.canvas2dctx.save.bind(this.canvas2dctx), []),
            script.NativeUtil.closureVoid(this.canvas2dctx.restore.bind(this.canvas2dctx), []),
            script.NativeUtil.closureVoid(this.canvas2dctx.setTransform.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.transform.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.translate.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.clip.bind(this.canvas2dctx), []),
            script.NativeUtil.fieldSetter(this.canvas2dctx, 'lineCap', 'StringRegister'),
            script.NativeUtil.fieldGetter(this.canvas2dctx, 'lineCap', 'StringRegister'),
            script.NativeUtil.closureReturnValue(this.doublePropertyOfCanvas.bind(this), 'DoubleRegister', ['StringRegister'], true),
            script.NativeUtil.fieldSetter(this.canvas2dctx, 'globalAlpha', 'DoubleRegister'),
            script.NativeUtil.fieldGetter(this.canvas2dctx, 'globalAlpha', 'DoubleRegister'),
            script.NativeUtil.closureVoid(this.setLineDash.bind(this), ['StructRegister']),
            script.NativeUtil.closureReturnValue(this.getLineDash.bind(this), 'StructRegister', []),
            script.NativeUtil.closureReturnValue(this.canvas2dctx.isPointInPath.bind(this.canvas2dctx), 'LongRegister', ['DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureReturnValue(this.canvas2dctx.isPointInStroke.bind(this.canvas2dctx), 'LongRegister', ['DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureReturnValue(this.textWidth.bind(this), 'DoubleRegister', ['StringRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.quadraticCurveTo.bind(this.canvas2dctx), ['DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.closureVoid(this.canvas2dctx.strokeText.bind(this.canvas2dctx), ['StringRegister', 'DoubleRegister', 'DoubleRegister']),
            script.NativeUtil.fieldSetter(this.canvas2dctx, 'lineDashOffset', 'DoubleRegister'),
            script.NativeUtil.fieldGetter(this.canvas2dctx, 'lineDashOffset', 'DoubleRegister'),
            script.NativeUtil.closureVoid(this.loadImageFile.bind(this.this), ['StringRegister'], true),
            script.NativeUtil.closureVoid(this.drawImage.bind(this),
                ['NObjectRegister', 'DoubleRegister', 'DoubleRegister',
                    'DoubleRegister', 'DoubleRegister', 'DoubleRegister', 'DoubleRegister',
                    'DoubleRegister', 'DoubleRegister'], true),
            script.NativeUtil.closureReturnValue(this.imageObjectWidth.bind(this),
                'DoubleRegister', ['NObjectRegister']),
            script.NativeUtil.closureReturnValue(this.imageObjectHeight.bind(this),
                'DoubleRegister', ['NObjectRegister']),
            script.NativeUtil.objFieldGetter('name', 'StringRegister'),
            script.NativeUtil.objFieldGetter('content', 'NObjectRegister'),
        ]);
    }
    setLineDash(oblist) {
        let array = oblist.toArray();
        this.canvas2dctx.setLineDash(array);
    }
    getLineDash(oblist) {
        let v = this.canvas2dctx.getLineDash();
        let ol = obvm.OBList.fromArray(v);
        return ol;
    }
    loadImageFile(callbackTitle, st) {
        let fsm = st.fsm
        let fileOD = window.FileOD;
        fileOD.Open('.jpg,.jpeg,.png', 'ArrayBuffer', (file) => {
            if (file) {
                let buf = file.content;
                let name = file.name;
                let img = new Image();
                let base64 = util.arrayBufferToBase64(buf);
                let fileType = util.fileType(name).substring(1);
                img.src = 'data:image/' + fileType + ';base64,' + base64;
                img.onload = () => {
                    fsm.PostMessage(new obvm.UserMessage(callbackTitle, 'ImageFile', { name, content: img }, null));
                };
                img.onerror = (e) => {
                    console.warn(e);
                };
            }
        });
    }
}

// module.exports = {OBCanvas2D};
export { OBCanvas2D, Vector2 };