
/**
 * @license
 * Copyright 2022 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"
class CanvasRenderingContext2D {
    constructor() {
        let methods = [
            'fillRect',
            'clearRect',
            'setFillStyleColor',
            'strokeRect',
            'fillText',
            'beginPath',
            'arc',
            'fill',
            'closePath',
            'arcTo',
            'bezierCurveTo',
            'moveTo',
            'lineTo',
            'ellipse',
            'rect',
            'rotate',
            'scale',
            'setStrokeStyleColor',
            'stroke',

        ];
        let fields = [
            'font',
            'textAlign',
            'textBaseline',
            'lineWidth',
        ];
        this.addMethods(methods);
        this.addFields(fields);
    }
    invoke(name) {
        return function () {
            console.log(name + "(" + JSON.stringify(arguments) + ")");
        }
    }
    addFields(fields) {
        fields.forEach(field => {
            this.addField(field);
        });
    }
    addField(fieldName) {
        this[fieldName] = null;
    }
    addMethods(methods) {
        methods.forEach(method => {
            this.addMethod(method);
        });
    }
    addMethod(methodName) {
        this[methodName] = this.invoke(methodName);
    }
}
class CanvasMock {
    constructor(data) {
        this.x = 0;
        this.y = 0;
        this.height = 1080;
        this.width = 750;
        Object.assign(this, data);
    }
    getContext(type) {
        if (type === '2d') {
            return new CanvasRenderingContext2D(this);
        }
    }
}


// module.exports = { CanvasMock };
export { CanvasMock };