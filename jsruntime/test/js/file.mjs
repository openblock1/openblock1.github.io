
import * as obvm from '../../runtime/vm.mjs'
class OSFile {
    install(script) {
        script.InstallLib("sys_file", "sys_file", [
            script.NativeUtil.closureVoid(this.select_open_as_string.bind(this),
                ['StringRegister', 'StringRegister'], true),
            script.NativeUtil.closureVoid(this.select_open_as_struct_data.bind(this),
                ['StringRegister', 'StringRegister'], true),
            script.NativeUtil.closureVoid(this.select_open_as_bin.bind(this),
                ['StringRegister', 'StringRegister'], true),
            (builder, args) => {
                let fileNameArg = args[1];
                let fileNameIdx = fileNameArg & 0xFFF;
                let arg = args[2];
                let argtype = arg >> 12;
                let argIdx = arg & 0xFFF;
                let fileNameReg = builder['StringRegister'](fileNameIdx);
                let argRegType;
                switch (argtype) {
                    case 0:
                        argRegType = 'LongRegister';
                        break;
                    case 1:
                        argRegType = 'DoubleRegister';
                        break;
                    case 2:
                        argRegType = 'StringRegister';
                        break;
                    case 3:
                        argRegType = 'StructRegister';
                        break;
                    default:
                        throw Error("Unknown type:" + argRegType);
                }
                let argReg = builder[argRegType](argIdx);
                builder.PushAction((st, f, local, pos) => {
                    let fileName = fileNameReg(st, f, local);
                    let arg = argReg(st, f, local);
                    let vm = st.fsm.VM;
                    let msgtype;
                    switch (argtype) {
                        case 0:
                            msgtype = 'Integer';
                            break;
                        case 1:
                            msgtype = 'Number';
                            break;
                        case 2:
                            msgtype = 'String';
                            break;
                        case 3:
                            msgtype = arg.Def.Name;
                            break;
                    }
                    let msg = new obvm.UserMessage('saveFile', msgtype, arg, null);
                    let buf = vm.messageToBuffer(msg, st, f, local);
                    this.save(fileName, buf);
                    return pos + 1;
                });
            },
            script.NativeUtil.closureVoid(this.saveTxt.bind(this),
                ['StringRegister', 'StringRegister'], false),
        ]);
    }
    save(fileName, arg) {
        let fileOD = window.FileOD;
        fileOD.Save(fileName, new Blob([arg]));
    }
    saveTxt(fileName, arg) {
        let fileOD = window.FileOD;
        fileOD.Save(fileName, arg);
    }
    select_open_as_string(extensions, title, state) {
        let fileOD = window.FileOD;
        fileOD.Open(extensions, 'text', (file) => {
            if (file) {
                state.fsm.PostMessage(new obvm.UserMessage(title, 'String', file.content, null));
            }
        });
    }
    select_open_as_struct_data(extensions, title, state, uf, locals) {
        let fileOD = window.FileOD;
        fileOD.Open(extensions, 'ArrayBuffer', (file) => {
            if (file) {
                try {
                    let vm = state.fsm.VM;
                    let content = file.content;
                    let uint8arr = new Uint8Array(content);
                    let msg = vm.u8arrayToMessage(uint8arr, null);
                    msg.name = title;
                    state.fsm.PostMessage(msg);
                } catch (e) {
                    console.error(e);
                    throw obvm.VM.makeError('read message error.\n' + e.message, state, uf, locals);
                }
            }
        });
    }
    select_open_as_bin(extensions, title, state) {
        let fileOD = window.FileOD;
        fileOD.Open(extensions, 'ArrayBuffer', (file) => {
            if (file) {
                let buf = file.content;
                state.fsm.PostMessage(new obvm.UserMessage(title, 'ArrayBuffer', buf, null));
            }
        });
    }
}
export { OSFile };