/**
 * 异步询问
 * 
 * settings:
 * 
 * mask        是否显示遮罩，布尔，默认 true
 * 
 * maskColor   遮罩背景色，字符串，css颜色格式，默认 #000000aa
 * 
 * dialogClass 对话框class,字符串 css类名称，默认值 null
 * 
 * dialogTop   对话框top，字符串，css表达式，默认 '20%'，dialogClass 有效时，此设置无效
 * 
 * dialogWidth   对话框宽度，字符串，css表达式，默认 '30%'，dialogClass 有效时，此设置无效
 * 
 * dialogMinWidth   对话框最小宽度，字符串，css表达式，默认 '30%'，dialogClass 有效时，此设置无效
 * 
 * dialogHeight   对话框高度，字符串，css表达式，默认 'auto'，dialogClass 有效时，此设置无效
 * 
 * dialogMinHeight   对话框最小高度，字符串，css表达式，默认 '10px'，dialogClass 有效时，此设置无效
 * 
 * dialogBackgroundColor 对话框颜色，字符串，css表达式，默认 'white'，dialogClass 有效时，此设置无效
 * 
 * dialogBroderRadius  对话框圆角，字符串 默认 '6px'
 * 
 * 更多选项查看代码
 */
class AsyncPrompt {
    static ui;
    static requests = [];
    settings;
    /**
     * 
     * @param {String} text 提示内容
     * @param {String} value 默认回答，可选
     * @param {Object} settings 提示参数，可选
     * @returns {Promise<String>} 用户答案，取消为null
     */
    static prompt(text, value, settings) {
        return (new AsyncPrompt(settings)).prompt(text, value);
    }
    /**
     * 
     * @param {Object} settings 提示参数，可选
     * @returns 
     */
    constructor(settings) {
        this.settings = Object.assign({
            yes: '确定',
            no: '取消',
            mask: true,
            maskColor: '#000000aa',
            dialogClass: null,
            dialogPadding: '15px',
            dialogTop: '20%',
            dialogWidth: '30%',
            dialogMinWidth: '10%',
            dialogMaxWidth: '50%',
            dialogHeight: 'auto',
            dialogMinHeight: '10px',
            dialogMaxHeight: '90%',
            dialogBackgroundColor: 'white',
            dialogBroderRadius: '6px',
            textElement: 'span',
            textAsHtml: false,
            textClass: null,
            textSize: '35px',
            textFontFamily: 'system-ui',
            textFontWeight: 'normal',
            valueClass: null,
            valueSize: '35px',
            valueFontFamily: 'system-ui',
            valueFontWeight: 'normal',
            buttonStyle: 'font-size:30px;margin:7px;padding:5px;'
        }, settings);
    }
    /**
     * 
     * @param {String} text 提示内容
     * @param {String} value 默认回答，可选
     * @returns {Promise<String>} 用户答案，取消为null
     */
    prompt(text, value) {
        return AsyncPrompt._createRequests(this.settings, text, value);
    }
    static _createRequests(settings, text, value) {
        value = typeof (value) != 'string' ? '' : value;
        settings = settings || {};
        let request = { settings, text, value };
        let p = new Promise((resolve, reject) => {
            request.resolve = resolve;
            AsyncPrompt.requests.push(request);
        });
        AsyncPrompt._checkRequests();
        return p;
    }
    static _checkRequests() {
        // 有正在显示的提示，则不显示
        if (AsyncPrompt.ui) {
            return;
        }
        if (AsyncPrompt.requests.length == 0) {
            return;
        }
        let req = AsyncPrompt.requests.shift();
        AsyncPrompt._showUI(req);
    }
    static _showUI(req) {
        let ui = document.createElement('div');
        ui.setAttribute('id', 'AsyncPrompt');
        let settings = req.settings;
        if (req.settings.mask) {
            ui.setAttribute('style', `position:fixed;height:100%;width:100%;background-color:${settings.maskColor};z-index:10000000;top:0;margin:0`);
        } else {
            ui.setAttribute('style', `position:fixed;height:100%;width:100%;z-index:10000000;top:0;margin:0;pointer-events:none;`);
        }
        let dialog = document.createElement('div');
        dialog.setAttribute('id', 'AsyncPrompt-dialog');
        if (settings.dialogClass) {
            dialog.setAttribute('class', settings.dialogClass);
        } else {
            dialog.setAttribute('style', `padding:${settings.dialogPadding};position:absolute;left:50%;transform:translate(-50%,0);border-radius:${settings.dialogBroderRadius};background-color:${settings.dialogBackgroundColor};margin:auto;top:${settings.dialogTop};width:${settings.dialogWidth};min-width:${settings.dialogMinWidth};max-width:${settings.dialogMaxWidth};height:${settings.dialogHeight};min-height:${settings.dialogMinHeight};max-height:${settings.dialogMaxHeight}`);
        }
        if (req.text) {
            let text_ui = document.createElement(settings.textElement);
            if (settings.textClass) {
                text_ui.setAttribute('class', settings.textClass);
            } else {
                text_ui.setAttribute('style', `font-size:${settings.textSize};font-family:${settings.textFontFamily};font-weight:${settings.textFontWeight};`);
            }
            if (settings.textAsHtml) {
                text_ui.innerHTML = req.text;
            } else {
                text_ui.innerText = req.text;
            }
            dialog.appendChild(text_ui);
        }
        let input = document.createElement('input');
        input.setAttribute('type', 'text');

        if (settings.valueClass) {
            input.setAttribute('class', settings.valueClass);
        } else {
            input.setAttribute('style', `width:90%;font-size:${settings.valueSize};font-family:${settings.valueFontFamily};font-weight:${settings.valueFontWeight};`);
        }
        input.onkeyup = (e) => {
            console.log(e)
            if (e.code === 'Enter') {
                AsyncPrompt._closeUI();
                req.resolve(input.value);
            } else if (e.code === 'Escape') {
                AsyncPrompt._closeUI();
                req.resolve(null);
            }
        };
        if (req.value) {
            input.value = req.value;
        }
        dialog.appendChild(input);
        dialog.appendChild(document.createElement('br'));
        if (settings.no) {
            let no = document.createElement('button');
            no.innerText = settings.no;
            no.onclick = () => {
                AsyncPrompt._closeUI();
                req.resolve(null);
            };
            no.setAttribute('style', settings.buttonStyle);
            dialog.append(no);
        }
        let yes = document.createElement('button');
        yes.innerText = settings.yes;
        yes.setAttribute('style', settings.buttonStyle);
        yes.onclick = () => {
            AsyncPrompt._closeUI();
            req.resolve(input.value);
        };
        dialog.append(yes);
        ui.appendChild(dialog);
        document.body.appendChild(ui);
        input.focus();
        AsyncPrompt.ui = ui;
    }
    static _closeUI() {
        if (AsyncPrompt.ui) {
            AsyncPrompt.ui.remove();
            AsyncPrompt.ui = null;
        }
    }
}