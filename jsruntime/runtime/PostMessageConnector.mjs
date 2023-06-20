import { DebuggerBroker } from './debugger.mjs';
class PostMessageConnector extends DebuggerBroker {
    constructor() {
        super();
    }
    onEvent(name, block, args, level, stack) {
        super.onEvent(name, block, args, level, stack);
        try {
            window.parent.postMessage({
                cmd: 'debug',
                name, args,
                level, stack, block
            }, '*');
        } catch (e) {
            console.error(e);
            debugger
            throw e;
        }
    }
}
export { PostMessageConnector }