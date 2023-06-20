/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

OpenBlock.BlocklyParser.BlockToAST = (function () {
    function BlocktoStatementDef(block) {
        let def = new StatementDef();
        if (block) {
            for (let cur = block; cur; cur = cur.next) {
                try {
                    let ast = cur.AST();
                    if (ast instanceof VariableDeclaration) {
                        def.addVarDecl(ast);
                        let setAST = ast.makeSetLocalVariableValue();
                        def.addInstruction(setAST); // 声明包含初始化指令
                    } else if ((ast instanceof Instruction)) {
                        def.addInstruction(ast);
                    } else if (ast instanceof ErrorAST) {
                        console.warn(ast);
                    } else {
                        // console.debug(ast);
                    }
                } catch (e) {
                    console.error(e);
                }
                // else {
                //     throw Error('Unknown AST:', ast);
                // }
            }
        }
        return def;
    }

    function BlocktoStatementDefSafe(statements, name) {
        if (!(statements && statements[name])) {
            return new StatementDef();
        } else {
            return BlocktoStatementDef(statements[name]);
        }
    }

    function BlocktoExpr(block, errMsg) {
        if (!block) {
            throw Error(errMsg || '需要条件');
        }
        let ast = block.AST();
        if (!(ast instanceof Expr)) {
            throw Error('not expr', ast);
        }
        return ast;
    }
    function BlocktoExpr2(blockValues, key, errMsg) {
        if (!blockValues) {
            throw Error(errMsg || '需要条件');
        }
        let block = blockValues[key];
        if (!block) {
            throw Error(errMsg || '需要条件');
        }
        let ast = block.AST();
        if (!(ast instanceof Expr)) {
            throw Error('not expr', ast);
        }
        return ast;
    }

    function toTextExpr(block) {
        let expr = BlocktoExpr(block);
        if (expr instanceof TextExpr) {
            return expr;
        } else {
            return new ToString(expr);
        }
    }
    return {
        dummy(block) {
            return new Dummy();
        },
        text_join(block) {
            if (!block.values) {
                return new TextConstExpr("");
            }
            let items = parseInt(block.mutation.items);
            let stack;
            for (let i = 0; i < items; i++) {
                let key = "ADD" + i;
                let value = block.values[key];
                if (value) {
                    if (!stack) {
                        stack = toTextExpr(value);
                    } else {
                        stack = new TextJoin(stack, toTextExpr(value));
                    }
                }
            }
            stack.setBlockId(block.id);
            return stack;
        },
        math_round(block) {
            let op = block.fields.OP.text;
            let value = BlocktoExpr(block.values.NUM);
            let ast = new MathSingle();
            ast.setOP(op);
            ast.setValue(value);
            let f2i = new F2I(ast);
            f2i.setBlockId(block.id);
            return f2i;
        },
        math_modulo(block) {
            let DIVIDEND = BlocktoExpr(block.values.DIVIDEND);
            let DIVISOR = BlocktoExpr(block.values.DIVISOR);
            let m = new Modulo();
            m.dividend = DIVIDEND;
            m.divisor = DIVISOR;
            m.setBlockId(block.id);
            return m;
        },
        math_number_property(block) {
            let prop = block.fields.PROPERTY.text;
            if (prop === 'PRIME') {
                throw Error("功能未实现");
            }
            let value1 = BlocktoExpr(block.values.NUMBER_TO_CHECK);
            switch (prop) {
                case 'EVEN':
                    // code = number_to_check + ' % 2 == 0';
                    {
                        let m = new Modulo(value1, new FloatConstExpr(2));
                        let c = new Compare();
                        c.setOP("EQ");
                        c.setLeft(m);
                        c.setRight(new FloatConstExpr(0));
                        c.setBlockId(block.id);
                        return c;
                    }
                    break;
                case 'ODD':
                    // code = number_to_check + ' % 2 == 1';
                    {
                        let m = new Modulo(value1, new FloatConstExpr(2));
                        let c = new Compare();
                        c.setOP("EQ");
                        c.setLeft(m);
                        c.setRight(new FloatConstExpr(1));
                        c.setBlockId(block.id);
                        return c;
                    }
                    break;
                case 'WHOLE':
                    // code = number_to_check + ' % 1 == 0';
                    {
                        let m = new Modulo(value1, new FloatConstExpr(1));
                        let c = new Compare();
                        c.setOP("EQ");
                        c.setLeft(m);
                        c.setRight(new FloatConstExpr(0));
                        c.setBlockId(block.id);
                        return c;
                    }
                    break;
                case 'POSITIVE':
                    // code = number_to_check + ' > 0';
                    {
                        let c = new Compare();
                        c.setOP("GT");
                        c.setLeft(value1);
                        c.setRight(new FloatConstExpr(0));
                        c.setBlockId(block.id);
                        return c;
                    }
                    break;
                case 'NEGATIVE':
                    // code = number_to_check + ' < 0';
                    {
                        let c = new Compare();
                        c.setOP("LT");
                        c.setLeft(value1);
                        c.setRight(new FloatConstExpr(0));
                        c.setBlockId(block.id);
                        return c;
                    }
                    break;
                case 'DIVISIBLE_BY':
                    // var divisor = Blockly.JavaScript.valueToCode(block, 'DIVISOR',
                    //     Blockly.JavaScript.ORDER_MODULUS) || '0';
                    // code = number_to_check + ' % ' + divisor + ' == 0';
                    {
                        let d = BlocktoExpr(block.values.DIVISOR);
                        let m = new Modulo(value1, d);
                        let c = new Compare();
                        c.setOP("EQ");
                        c.setLeft(m);
                        c.setRight(new FloatConstExpr(0));
                        c.setBlockId(block.id);
                        return c;
                    }
                    break;
            }
        },
        math_random_int(block) {
            let r = new RandomInt();
            r.From = (BlocktoExpr(block.values.FROM));
            r.To = (BlocktoExpr(block.values.TO));
            r.setBlockId(block.id);
            return r;
        },
        math_random_float(block) {
            let r = new Random();
            r.setBlockId(block.id);
            return r;
        },
        math_constant(block) {
            let ast = new FloatConstExpr();
            let txt = block.fields.CONSTANT.text;
            switch (txt) {
                case "PI":
                    ast.number = Math.PI;
                    break;
                case "e":
                    ast.number = Math.E;
                    break;
                case "GOLDEN_RATIO":
                    ast.number = 1.6180339887498948482;
                    break;
                case "SQRT2":
                    ast.number = Math.SQRT2;
                    break;
                case "SQRT1_2":
                    ast.number = Math.SQRT1_2;
                    break;
                case "INFINITY":
                    ast.number = Number.POSITIVE_INFINITY;
                    ast.special = "POSITIVE_INFINITY";
                    break;
            }
            ast.setBlockId(block.id);
            return ast;
        },
        math_trig(block) {
            let op = block.fields.OP.text;
            let value = BlocktoExpr(block.values.NUM);
            let ast = new MathSingle();
            ast.setOP(op);
            ast.setValue(value);
            ast.setBlockId(block.id);
            return ast;
        },
        math_trig_atan2(m) {
            let op = 'ATAN2';
            let ast = new ARITH();
            ast.setOP(op);
            ast.setLeft(BlocktoExpr(m.values.X, "必须提供值"));
            ast.setRight(BlocktoExpr(m.values.Y, "必须提供值"));
            ast.setBlockId(m.id);
            return ast;
        },
        math_single(block) {
            let op = block.fields.OP.text;
            let value = BlocktoExpr(block.values.NUM);
            let ast = new MathSingle();
            ast.setOP(op);
            ast.setValue(value);
            ast.setBlockId(block.id);
            return ast;
        },
        native_call(block) {
            let mutationData;
            if (block.mutation) {
                mutationData = JSON.parse(decodeURI(block.mutation.text), Deserializer);
            } else {
                throw Error('没有函数信息');
            }
            // {
            //     "func": {
            //         "args": [],
            //         "returnType": {
            //             "name": "test.MainClass",
            //             "$__type": "StructFieldTypeStruct"
            //         },
            //         "name": "test.MainClass.ctor",
            //         "signature": "test.MainClass.ctor()Stest.MainClass;",
            //         "fullname": "test.MainClass.ctor",
            //         "scope": "global",
            //         "libHash": "qeIBnqtCRvMiD40tEynZSA==",
            //         "libIndex": 5,
            //         "libName": "Test",
            //         "$__type": "FunctionDef"
            //     },
            //     "skip": false
            // }
            let func = OpenBlock.nativefunctions.check(mutationData.func, true);
            let ast;
            if ((!mutationData.ignoreReturnValue) && mutationData.func.returnType) {
                ast = new ValueNativeCall();
            } else {
                ast = new VoidNativeCall();
            }
            ast.setFunc(func);
            if (block.values) {
                func.args.forEach(arg => {
                    let value = block.values[arg.name];
                    if (value) {
                        let expr = BlocktoExpr(value);
                        ast.setArg(arg.name, expr);
                    } else {
                        throw Error("请设置参数 " + OpenBlock.i(arg.name));
                    }
                });
            } else if (func.args.length > 0) {
                throw Error("请设置参数");
            }
            ast.setBlockId(block.id);
            return ast;
        },
        variables_self(block) {
            let ast = new Self();
            ast.setBlockId(block.id);
            return ast;
        },
        method_return(block) {
            let expr = null;
            if (block.values && block.values.VALUE) {
                expr = BlocktoExpr(block.values.VALUE, "必须提供值");
            }
            let ast = new Return();
            ast.setValue(expr);
            ast.setBlockId(block.id);
            return ast;
        },
        local_variable_get(block) {
            let ast = new GetLocalVariableValue();
            ast.setName(block.fields.VAR.text);
            ast.setBlockId(block.id);
            return ast;
        },
        local_variable_set(block) {
            let ast = new SetLocalVariableValue();
            ast.setName(block.fields.VAR.text);
            let value = BlocktoExpr(block.values && block.values.VALUE, "必须提供值");
            ast.setValue(value);
            ast.setBlockId(block.id);
            return ast;
        },
        local_variable_create(block) {
            if (!block.fields.NAME.text) {
                throw Error('未指定名称');
            }
            if (!block.values) {
                throw Error('未指定值');
            }
            if (!block.values.VALUE) {
                throw Error('未指定初始值');
            }
            let ast = new VariableDeclaration();
            let varInfo = JSON.parse(decodeURI(block.mutation.text), Deserializer);
            if (!varInfo) {
                throw Error('未获得变量信息');
            }
            varInfo = varInfo[0];
            if (!varInfo) {
                throw Error('未获得变量信息');
            }
            ast.name = block.fields.NAME.text;
            ast.type = varInfo.type;
            ast.value = BlocktoExpr(block.values.VALUE);
            ast.setBlockId(block.id);
            return ast;
        },
        typed_procedure_call(block) {
            let mutationData;
            if (block.mutation) {
                mutationData = JSON.parse(decodeURI(block.mutation.text), Deserializer);
            } else {
                mutationData = {
                    returnType: null,
                    args: []
                }
            }
            let methodName = block.fields.METHOD.text;
            if (methodName == null || methodName.length == 0) {
                throw Error(OpenBlock.i('请选择要调用的函数'));
            }
            let moduleName = block.fields.MODULE.text;
            let fullName = moduleName ? methodName : '.' + methodName;
            let ast;
            if (mutationData.returnType && !mutationData.ignoreReturnValue) {
                ast = new ValueMethodCall();
                ast.setReturnType(mutationData.returnType.toCodeText());
            } else {
                ast = new VoidMethodCall();
            }
            ast.MethodName = fullName;
            if (block.values) {
                for (let i = 0; i < mutationData.args.length; i++) {
                    let arg = block.values['ARG' + i];
                    if (!arg) {
                        throw Error('没有设置第' + (i + 1) + "个参数");
                    }
                    let expr = BlocktoExpr(arg);
                    ast.addArg(expr);
                }
            } else if (mutationData.args.length > 0) {
                throw Error(OpenBlock.i("没有设置参数"));
            }
            ast.setBlockId(block.id);
            return ast;
        },
        typed_procedures(block) {
            let ast = new FunctionDef();
            let name = block.fields.NAME.text;
            if (!name) {
                throw new Error("没有设定函数名称");
            }
            ast.setName(name);
            if (block.statements && block.statements.ARGS) {
                for (let field = block.statements.ARGS; field; field = field.next) {
                    ast.addArg(field.AST());
                }
            }
            if (block.values && block.values.RETURN) {
                ast.setReturnType(BlocktoExpr(block.values.RETURN));
            }
            try {
                ast.setBody(BlocktoStatementDef(block.next));
            } catch (e) {
                e.func = name;
            }
            ast.setBlockId(block.id);
            return ast;
        },
        logic_boolean(block) {
            let ast = new IntegerConstExpr();
            if (block.fields.BOOL.text === 'TRUE') {
                ast.number = 1;
            } else {
                ast.number = 0;
            }
            ast.setBlockId(block.id);
            return ast;
        },
        controls_if(block) {
            let ast = new IfControl();
            if (!block.values) {
                return ast;
            }
            if (!block.statements) {
                return ast;
            }
            let ifthen = 1;
            if (block.mutation) {
                if (block.mutation.elseif) {
                    ifthen += parseInt(block.mutation.elseif);
                }
            }
            for (let i = 0; i < ifthen; i++) {
                if (block.values['IF' + i]) {
                    let _if = BlocktoExpr(block.values['IF' + i]);
                    let _then = BlocktoStatementDefSafe(block.statements, 'DO' + i);
                    ast.addPair(_if, _then);
                }
            }
            if (block.statements.ELSE) {
                let _if = new IntegerConstExpr();
                _if.number = 1;
                let _then = BlocktoStatementDef(block.statements.ELSE);
                ast.addPair(_if, _then);
            }
            ast.setBlockId(block.id);
            return ast;
        },
        controls_flow_statements(block) {
            let type = block.fields.FLOW.text;
            let ast;
            switch (type) {
                case "BREAK":
                    ast = new Break();
                    ast.setBlockId(block.id);
                    return ast;
                case "CONTINUE":
                    ast = new Continue();
                    ast.setBlockId(block.id);
                    return ast;
                default:
                    throw Error(type);
            }
        },
        controls_whileUntil(block) {
            let mode = block.fields.MODE.text === 'WHILE';
            if (!(block.values && block.values.BOOL)) {
                throw Error('必须指定条件');
            }
            let bool = BlocktoExpr(block.values.BOOL);
            let statment = BlocktoStatementDefSafe(block.statements, 'DO');
            let ast = new WhileUntil(mode, bool, statment);
            ast.setBlockId(block.id);
            return ast;
        },
        controls_repeat_ext(block) {
            if (!(block.values && block.values.TIMES)) {
                throw Error('必须指定次数');
            }
            let timesExpr = BlocktoExpr(block.values.TIMES);
            let statement = BlocktoStatementDefSafe(block.statements, 'DO');
            let ast = new RepeatTimes(timesExpr, statement);
            ast.setBlockId(block.id);
            return ast;
        },
        controls_for(block) {
            let varName = block.fields.VAR.text;
            let stmt = BlocktoStatementDefSafe(block.statements, 'DO');
            let fromExpr;
            let toExpr;
            let byExpr;
            if (block.values) {
                if (block.values.FROM) {
                    fromExpr = BlocktoExpr(block.values.FROM);
                }
                if (block.values.TO) {
                    toExpr = BlocktoExpr(block.values.TO);
                }
                if (block.values.BY) {
                    byExpr = BlocktoExpr(block.values.BY);
                }
                let ast = new ForLoop();
                ast.setVarName(varName);
                ast.setFromExpr(fromExpr);
                ast.setToExpr(toExpr);
                ast.setByExpr(byExpr);
                ast.setStmt(stmt);
                ast.setBlockId(block.id);
                return ast;
            }
        },
        struct_set_field(block) {
            if (!(block.values && block.values.DATA)) {
                throw Error('必须指定数据');
            }
            if (!(block.values && block.values.VALUE)) {
                throw Error('必须指定值');
            }
            let stvalue = BlocktoExpr(block.values.DATA);
            let typefield = block.fields.FIELD.text;
            let idx = typefield.lastIndexOf('/');
            let fieldtype = typefield.substr(idx + 1);
            let idx1 = typefield.lastIndexOf(':');
            let type = typefield.substr(0, idx1);
            let fieldName = typefield.substr(idx1 + 1, idx - idx1 - 1);
            // let structDef = OpenBlock.BlocklyParser.getStructDefByName(type);

            let value = BlocktoExpr(block.values.VALUE);
            let ast = new SetStructField(stvalue, type, fieldName, fieldtype, value);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_clone(block) {
            if (!(block.values && block.values.DATA)) {
                throw Error('必须指定数据');
            }
            if (!(block.mutation && block.mutation.text)) {
                throw Error('必须指定类型');
            }
            let value = BlocktoExpr(block.values.DATA);
            let type = decodeURI(block.mutation.text);
            let ast = new Clone(value, type);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_get_field(block) {
            if (!(block.values && block.values.DATA)) {
                throw Error('必须指定数据');
            }
            let value = BlocktoExpr(block.values.DATA);
            let typefield = block.fields.FIELD.text;
            let idx = typefield.lastIndexOf('/');
            let fieldtype = typefield.substr(idx + 1);
            let idx1 = typefield.lastIndexOf(':');
            let type = typefield.substr(0, idx1);
            let fieldName = typefield.substr(idx1 + 1, idx - idx1 - 1);
            // let structDef = OpenBlock.BlocklyParser.getStructDefByName(type);

            let ast = new GetStructField(value, type, fieldName, fieldtype);
            ast.setBlockId(block.id);
            return ast;
        },
        received_message_arg(block) {
            let ast = new ReceivedMessage(block.fields.TYPE.text);
            ast.setBlockId(block.id);
            return ast;
        },
        recived_message_arg(block) {
            // 早期拼写错误处理
            let ast = new ReceivedMessage(block.fields.TYPE.text);
            ast.setBlockId(block.id);
            return ast;
        },
        received_message_sender(block) {
            let ast = new SenderOfReceivedMessage();
            ast.setBlockId(block.id);
            return ast;
        },
        recived_message_sender(block) {
            // 早期拼写错误处理
            let ast = new SenderOfReceivedMessage();
            ast.setBlockId(block.id);
            return ast;
        },
        fsm_send_message(block) {
            if (!(block.values && block.values.FSM)) {
                throw Error('必须指定发送目标');
            }
            if (block.fields.TITLE.text.length === 0) {
                throw Error('必须指定消息标题');
            }
            let ast = new FSMSendMessage();
            let value = BlocktoExpr(block.values.FSM);
            ast.setTargetExpr(value);
            ast.setTitle(new TextConstExpr(block.fields.TITLE.text));
            if (block.values.ARG) {
                ast.setBodyExpr(BlocktoExpr(block.values.ARG));
            }
            ast.setBlockId(block.id);
            return ast;
        },

        fsm_send_dynamic_message(block) {
            if (!(block.values && block.values.FSM)) {
                throw Error('必须指定发送目标');
            }
            if (!block.values.TITLE) {
                throw Error('必须指定消息标题');
            }
            let ast = new FSMSendDynamicMessage();
            let value = BlocktoExpr(block.values.FSM);
            ast.setTargetExpr(value);
            let tvalue = BlocktoExpr(block.values.TITLE);
            ast.setTitle(tvalue);
            if (block.values.ARG) {
                ast.setBodyExpr(BlocktoExpr(block.values.ARG));
            }
            ast.setBlockId(block.id);
            return ast;
        },

        fsm_send_message_after_millisecond(block) {
            if (!(block.values && block.values.FSM)) {
                throw Error('必须指定发送目标');
            }
            if (!block.values.WAIT_MILLISECOND) {
                return OpenBlock.BlocklyParser.BlockToAST.fsm_send_message(block);
            }
            if (block.fields.TITLE.text.length === 0) {
                throw Error('必须指定消息标题');
            }
            let ast = new FSMSendMessageWait();
            let value = BlocktoExpr(block.values.FSM);
            ast.setTargetExpr(value);
            ast.setTitle(new TextConstExpr(block.fields.TITLE.text));
            ast.setWaitSecond(BlocktoExpr(block.values.WAIT_MILLISECOND));
            if (block.values.ARG) {
                ast.setBodyExpr(BlocktoExpr(block.values.ARG));
            }
            ast.setBlockId(block.id);
            return ast;
        },
        fsm_broadcast_message_after_millisecond(block) {
            if (!(block.values && block.values.WAIT_MILLISECOND)) {
                return OpenBlock.BlocklyParser.BlockToAST.fsm_broadcast_message(block);
            }
            if (block.fields.TITLE.text.length === 0) {
                throw Error('必须指定消息标题');
            }
            let ast = new FSMBroadcastMessageWait();
            ast.setTitle(new TextConstExpr(block.fields.TITLE.text));
            ast.setWaitSecond(BlocktoExpr(block.values.WAIT_MILLISECOND));
            if (block.values.ARG) {
                ast.setBodyExpr(BlocktoExpr(block.values.ARG));
            }
            ast.sendToSelf = block.fields.SEND_SELF ? block.fields.SEND_SELF.text === 'TRUE' : false;
            ast.setBlockId(block.id);
            return ast;
        },
        fsm_broadcast_message(block) {
            if (block.fields.TITLE.text.length === 0) {
                throw Error('必须指定消息标题');
            }
            let ast = new FSMBroadcastMessage();
            ast.setTitle(new TextConstExpr(block.fields.TITLE.text));
            if (block.values && block.values.ARG) {
                ast.setBodyExpr(BlocktoExpr(block.values.ARG));
            }
            ast.sendToSelf = block.fields.SEND_SELF ? block.fields.SEND_SELF.text === 'TRUE' : false;
            ast.setBlockId(block.id);
            return ast;
        },
        struct_load_from_dataset(block) {
            if (!(block.values && block.values.ID)) {
                throw Error('必须指定ID');
            }
            let methodName = 'Struct_loadStructFromDataset';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let id = BlocktoExpr(block.values.ID, "必须提供值");
            let typename = block.fields.TYPE.text;
            let textExpr = new TextConstExpr(typename);
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('type', textExpr);
            ast.setArg('id', id);
            ast.setBlockId(block.id);
            return ast;
        },
        math_text_to_integer(block) {
            if (!(block.values && block.values.TEXT)) {
                throw Error('必须指定文本内容');
            }
            let methodName = 'math_text_to_integer';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let text = BlocktoExpr(block.values.TEXT, "必须提供值");
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('text', text);
            ast.setBlockId(block.id);
            return ast;
        },
        math_text_to_number(block) {
            if (!(block.values && block.values.TEXT)) {
                throw Error('必须指定文本内容');
            }
            let methodName = 'math_text_to_number';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let text = BlocktoExpr(block.values.TEXT, "必须提供值");
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('text', text);
            ast.setBlockId(block.id);
            return ast;
        },
        struct(block) {
            let name = block.fields.NAME.text;
            if (!name || name.length === 0) {
                throw Error('必须设置名称');
            }
            let ast = new StructDef();
            ast.setName(name);
            if (block.statements && block.statements.FIELDS) {
                for (let field = block.statements.FIELDS; field; field = field.next) {
                    ast.addField(field.AST());
                }
            }
            ast.setBlockId(block.id);
            return ast;
        },
        struct_field(block) {
            let name = block.fields.NAME.text;
            let ast = new StructField();
            if (!(block.values && block.values.TYPE)) {
                throw Error('必须指定类型');
            }
            let type = block.values.TYPE.AST();
            ast.setType(type);
            ast.setName(name);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_structs(block) {
            if (!(block.fields && block.fields.TYPE)) {
                throw Error('必须指定类型');
            }
            let typename = block.fields.TYPE.text;
            if (typename.length <= 0) {
                throw Error('必须指定类型');
            }
            let ast = new StructFieldTypeStruct();
            ast.setName(typename);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_native(block) {
            if (!(block.fields && block.fields.TYPE)) {
                throw Error('必须指定类型');
            }
            let typename = block.fields.TYPE.text;
            if (typename.length <= 0) {
                throw Error('必须指定类型');
            }
            let ast = new StructFieldTypeNative();
            ast.setName(typename);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_list(block) {
            if (!(block.values && block.values.TYPE)) {
                throw Error('必须指定元素类型');
            }
            let ast = new StructFieldTypeList();
            ast.setElementType(block.values.TYPE.AST());
            ast.setBlockId(block.id);
            return ast;
        },
        struct_string_map(block) {
            if (!(block.values && block.values.TYPE)) {
                throw Error('必须指定元素类型');
            }
            let ast = new StructFieldTypeStringMap();
            ast.setElementType(block.values.TYPE.AST());
            ast.setBlockId(block.id);
            return ast;
        },
        struct_integer_map(block) {
            if (!(block.values && block.values.TYPE)) {
                throw Error('必须指定元素类型');
            }
            let ast = new StructFieldTypeIntegerMap();
            ast.setElementType(block.values.TYPE.AST());
            ast.setBlockId(block.id);
            return ast;
        },
        struct_base_type(block) {
            if (!(block.fields && block.fields.TYPE)) {
                throw Error('必须指定类型');
            }
            let typename = block.fields.TYPE.text;
            if (typename.length <= 0) {
                throw Error('必须指定类型');
            }
            let ast = new StructFieldType();
            ast.setName(typename);
            ast.setBlockId(block.id);
            return ast;
        },
        fsm_create(block) {
            let fsmtype = block.fields.FSM.text;
            let textExpr = new TextConstExpr(fsmtype);
            let createFSM = new CreateFSM(textExpr);
            createFSM.setBlockId(block.id);
            return createFSM;
        },
        find_fsm_by_type(block) {
            if (!(block.fields && block.fields.FSM)) {
                throw Error('必须指定名称');
            }
            let methodName = 'FSM_findFsmByType';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let fsmtype = block.fields.FSM.text;
            let textExpr = new TextConstExpr(fsmtype);
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('typeName', textExpr);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_count_in_dataset(block) {
            let methodName = 'Struct_countInDataset';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let typename = block.fields.TYPE.text;
            let textExpr = new TextConstExpr(typename);
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('type', textExpr);
            ast.setBlockId(block.id);
            return ast;
        },
        fsm_variables_get(block) {
            let variableName = block.fields.VAR.text;
            let ast = new GetFSMVariableValue();
            ast.setName(variableName);
            ast.setBlockId(block.id);
            return ast;
        },
        fsm_variables_set(block) {
            if (!(block.values && block.values.VALUE)) {
                throw Error('必须提供值');
            }
            let value = BlocktoExpr(block.values.VALUE, "必须提供值");
            let variableName = block.fields.VAR.text;
            let ast = new SetFSMVariableValue();
            ast.setName(variableName);
            ast.setValue(value);
            ast.setBlockId(block.id);
            return ast;
        },
        state_variables_get(block) {
            let variableName = block.fields.VAR.text;
            let ast = new GetStateVariableValue();
            ast.setName(variableName);
            ast.setBlockId(block.id);
            return ast;
        },
        state_variables_set(block) {
            if (!(block.values && block.values.VALUE)) {
                throw Error('必须提供值');
            }
            let value = BlocktoExpr(block.values.VALUE, "必须提供值");
            let variableName = block.fields.VAR.text;
            let ast = new SetStateVariableValue();
            ast.setName(variableName);
            ast.setValue(value);
            ast.setBlockId(block.id);
            return ast;
        },
        change_state(block) {
            let ast = new ChangeState();
            ast.setTargetStateName(block.fields.VALUE.text);
            ast.setBlockId(block.id);
            return ast;
        },
        push_state(block) {
            let ast = new PushState();
            ast.setTargetStateName(block.fields.VALUE.text);
            ast.setBlockId(block.id);
            return ast;
        },
        pop_state(block) {
            let ast = new PopState();
            ast.setBlockId(block.id);
            return ast;
        },
        destroy_fsm(block) {
            let ast = new DFSM();
            ast.setBlockId(block.id);
            return ast;
        },
        on_event(block) {
            let ast = new EventHandlerDef();
            ast.setEventName(block.mutation.eventname);
            ast.setBody(BlocktoStatementDef(block.next));
            ast.setBlockId(block.id);
            return ast;
        },
        on_message(block) {
            let ast = new MessageHandlerDef();
            ast.setTitle(block.fields.VALUE.text);
            ast.setBody(BlocktoStatementDef(block.next));
            ast.setBlockId(block.id);
            return ast;
        },
        on_message_struct(block) {
            let ast = new MessageHandlerDef();
            ast.setTitle(block.fields.VALUE.text);
            ast.setMessageType(block.fields.TYPE.text);
            ast.setBody(BlocktoStatementDef(block.next));
            ast.setBlockId(block.id);
            return ast;
        },
        on_message_primary(block) {
            let ast = new MessageHandlerDef();
            ast.setTitle(block.fields.VALUE.text);
            ast.setMessageType(block.fields.TYPE.text);
            ast.setBody(BlocktoStatementDef(block.next));
            ast.setBlockId(block.id);
            return ast;
        },
        on_message_with_arg(block) {
            let ast = new MessageHandlerDef();
            ast.setTitle(block.fields.VALUE.text);
            ast.setMessageType(block.fields.TYPE.text);
            ast.setBody(BlocktoStatementDef(block.next));
            ast.setBlockId(block.id);
            return ast;
        },
        logic_compare(m) {
            let op = m.fields.OP.text;
            let ast = new Compare();
            ast.setOP(op);
            let l = BlocktoExpr(m.values.A, "必须提供值");
            let r = BlocktoExpr(m.values.B, "必须提供值");

            ast.setLeft(l);
            ast.setRight(r);
            ast.setBlockId(m.id);
            return ast;
        },
        math_arithmetic(m) {
            let op = m.fields.OP.text;
            let ast = new ARITH();
            ast.setOP(op);
            ast.setLeft(BlocktoExpr(m.values.A, "必须提供值"));
            ast.setRight(BlocktoExpr(m.values.B, "必须提供值"));
            ast.setBlockId(m.id);
            return ast;
        },
        ub_math_arithmetic(m) {
            let op = m.fields.OP.text;
            let ast = new ARITH();
            ast.setOP(op);
            ast.setLeft(BlocktoExpr(m.values.A, "必须提供值"));
            ast.setRight(BlocktoExpr(m.values.B, "必须提供值"));
            ast.setBlockId(m.id);
            return ast;
        },
        math_number(block) {
            let ast = new FloatConstExpr();
            let txt = block.fields.NUM.text;
            ast.number = parseFloat(txt);
            ast.setBlockId(block.id);
            return ast;
        },
        math_integer(block) {
            let ast = new IntegerConstExpr();
            let txt = block.fields.NUM.text;
            ast.number = parseInt(txt);
            ast.setBlockId(block.id);
            return ast;
        },
        text(m) {
            let ast = new TextConstExpr();
            ast.setText(m.fields.TEXT.text);
            ast.setBlockId(m.id);
            return ast;
        },
        text_multiline(b) {
            let ast = new TextConstExpr();
            let str = b.fields.TEXT.text;
            // let html = $("<div/>").html(str).text();
            let div = document.createElement('dev');
            div.innerHTML = str;
            let html = div.innerText;
            ast.setBlockId(b.id);
            ast.setText(html);
            return ast;
        },
        text_print(block) {
            if (!(block.values && block.values.TEXT)) {
                throw Error('必须提供值');
            }
            let ast = new LOG();
            ast.expr = BlocktoExpr(block.values.TEXT, "必须提供值");
            ast.setBlockId(block.id);
            return ast;
        },
        colour_picker(block) {
            let colorValue = block.fields.COLOUR.text;
            colorValue = colorValue.substr(1);
            colorValue = colorValue + "FF";
            let intValue = parseInt(colorValue, 16)
            let ast = new IntegerConstExpr();
            ast.setBlockId(block.id);
            ast.number = intValue;
            return ast;
        },
        struct_map_get_value_of_key(block) {
            if (!(block.values && block.values.MAP)) {
                throw Error('必须提供字符串映射');
            }
            if (!(block.values && block.values.KEY)) {
                throw Error('必须提供字符串');
            }
            let key = BlocktoExpr(block.values.KEY);
            let map = BlocktoExpr(block.values.MAP);
            let ast = new ValueOfMap(map, key);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_imap_get_value_of_key(block) {
            if (!(block.values && block.values.MAP)) {
                throw Error('必须提供整数映射');
            }
            if (!(block.values && block.values.KEY)) {
                throw Error('必须提供整数');
            }
            let key = BlocktoExpr(block.values.KEY);
            let map = BlocktoExpr(block.values.MAP);
            let ast = new ValueOfIMap(map, key);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_container_size(block) {
            if (!(block.values && block.values.MAP)) {
                throw Error('必须提供映射');
            }
            let map = BlocktoExpr(block.values.MAP);
            let ast = new SizeOfMap(map);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_map_remove_value_of_key(block) {
            if (!(block.values && block.values.MAP)) {
                throw Error('必须提供字符串映射');
            }
            if (!(block.values && block.values.KEY)) {
                throw Error('必须提供字符串');
            }
            let key = BlocktoExpr(block.values.KEY);
            let map = BlocktoExpr(block.values.MAP);
            let ast = new RKOM(map, key);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_smap_exist(block) {
            if (!(block.values && block.values.MAP)) {
                throw Error('必须提供字符串映射');
            }
            if (!(block.values && block.values.KEY)) {
                throw Error('必须提供字符串');
            }
            let key = BlocktoExpr(block.values.KEY);
            let map = BlocktoExpr(block.values.MAP);
            let ast = new SME(map, key);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_imap_exist(block) {
            if (!(block.values && block.values.MAP)) {
                throw Error('必须提供字符串映射');
            }
            if (!(block.values && block.values.KEY)) {
                throw Error('必须提供整数');
            }
            let key = BlocktoExpr(block.values.KEY);
            let map = BlocktoExpr(block.values.MAP);
            let ast = new IME(map, key);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_smap_all_key(block) {
            if (!(block.values && block.values.MAP)) {
                throw Error('必须提供字符串映射');
            }
            let map = BlocktoExpr(block.values.MAP);
            let ast = new SMA(map);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_imap_all_key(block) {
            if (!(block.values && block.values.MAP)) {
                throw Error('必须提供整数映射');
            }
            let map = BlocktoExpr(block.values.MAP);
            let ast = new IMA(map);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_imap_delete_value_of_key(block) {
            if (!(block.values && block.values.MAP)) {
                throw Error('必须提供整数映射');
            }
            if (!(block.values && block.values.KEY)) {
                throw Error('必须提供整数');
            }
            let key = BlocktoExpr(block.values.KEY);
            let map = BlocktoExpr(block.values.MAP);
            let ast = new RKOIM(map, key);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_map_set_value_of_key(block) {
            if (!(block.values && block.values.MAP)) {
                throw Error('必须提供字符串映射');
            }
            if (!(block.values && block.values.KEY)) {
                throw Error('必须提供字符串');
            }
            if (!(block.values && block.values.VALUE)) {
                throw Error('必须提供值');
            }
            let value = BlocktoExpr(block.values.VALUE);
            let key = BlocktoExpr(block.values.KEY);
            let map = BlocktoExpr(block.values.MAP);
            let ast = new STKV(map, key, value);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_imap_set_value_of_key(block) {
            if (!(block.values && block.values.MAP)) {
                throw Error('必须提供整数映射');
            }
            if (!(block.values && block.values.KEY)) {
                throw Error('必须提供整数');
            }
            if (!(block.values && block.values.VALUE)) {
                throw Error('必须提供值');
            }
            let value = BlocktoExpr(block.values.VALUE);
            let key = BlocktoExpr(block.values.KEY);
            let map = BlocktoExpr(block.values.MAP);
            let ast = new STIKV(map, key, value);
            ast.setBlockId(block.id);
            return ast;
        },
        text_length(block) {
            if (!(block.values && block.values.VALUE)) {
                throw Error('必须提供字符串');
            }
            let value = BlocktoExpr(block.values.VALUE);
            let methodName = 'Text_Length';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('str', value);
            ast.setBlockId(block.id);
            return ast;
        },
        text_isEmpty(block) {
            if (!(block.values && block.values.VALUE)) {
                throw Error('必须提供字符串');
            }
            let value = BlocktoExpr(block.values.VALUE);
            let methodName = 'Text_IsEmpty';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('str', value);
            ast.setBlockId(block.id);
            return ast;
        },
        text_indexOf(block) {
            if (!(block.values && block.values.VALUE)) {
                throw Error('必须提供字符串');
            }
            let value = BlocktoExpr(block.values.VALUE);
            if (!(block.values && block.values.FIND)) {
                throw Error('必须提供字符串');
            }
            let FIND = BlocktoExpr(block.values.FIND);
            if (!(block.fields && block.fields.END)) {
                throw Error('必须提供字符串');
            }
            let END = new IntegerConstExpr();
            END.number = block.fields.END.text === 'FIRST' ? 1 : 0;
            let methodName = 'Text_IndexOf';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('str', value);
            ast.setArg('sub', FIND);
            ast.setArg('forward', END);
            ast.setBlockId(block.id);
            return ast;
        },
        text_charAt(block) {
            if (!(block.fields && block.fields.WHERE)) {
                throw Error('必须提搜索方式');
            }

            if (!(block.values && block.values.VALUE)) {
                throw Error('必须提供字符串');
            }
            let value = BlocktoExpr(block.values.VALUE);
            let AT;
            switch (block.fields.WHERE.text) {
                case 'FROM_START':
                    let s_AT = BlocktoExpr(block.values.AT);
                    if (!(s_AT instanceof IntegerExpr)) {
                        let s__AT = new MathSingle();
                        s__AT.setOP('ROUNDDOWN');
                        s__AT.setValue(s_AT);
                        AT = new F2I(s__AT);
                    } else {
                        AT = s_AT;
                    }
                    break;
                case 'FROM_END':
                    let e_AT = BlocktoExpr(block.values.AT);
                    let e__AT = new MathSingle();
                    e__AT.setOP('NEG');
                    e__AT.setValue(e_AT);
                    AT = new F2I(e__AT);
                    break;
                case 'FIRST':
                    AT = new IntegerConstExpr();
                    AT.number = 1;
                    break;
                case 'LAST':
                    AT = new IntegerConstExpr();
                    AT.number = -1;
                    break;
                case 'RANDOM':
                    AT = new RandomInt();
                    AT.From = new FloatConstExpr();
                    AT.From.number = 1;
                    let methodName = 'Text_Length';
                    let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
                    let l = new ValueNativeCall();
                    l.setFunc(func);
                    l.setArg('str', value);
                    AT.To = new I2F(l);
                    break;
                default:
                    throw Error('未知操作 ' + block.fields.WHERE.text);
            }
            let methodName = 'Text_CharAt';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('str', value);
            ast.setArg('at', AT);
            ast.setBlockId(block.id);
            return ast;
        },
        text_getSubstring(block) {
            if (!(block.values && block.values.STRING)) {
                throw Error('必须提供字符串');
            }
            let str = BlocktoExpr(block.values.STRING);
            let at = [];
            for (let i = 0; i <= 1; i++) {
                let j = i + 1;
                let where = block.fields['WHERE' + j].text;
                switch (where) {
                    case 'FROM_START':
                        let f_at = BlocktoExpr(block.values['AT' + j]);
                        if (!(f_at instanceof IntegerExpr)) {
                            let f__AT = new MathSingle();
                            f__AT.setOP('ROUNDDOWN');
                            f__AT.setValue(f_at);
                            at[i] = new F2I(f__AT);
                        } else {
                            at[i] = f_at;
                        }
                        break;
                    case 'FROM_END':
                        let e_AT = BlocktoExpr(block.values['AT' + j]);
                        let e__AT = new MathSingle();
                        e__AT.setOP('NEG');
                        e__AT.setValue(e_AT);
                        at[i] = new F2I(e__AT);
                        break;
                    case 'FIRST':
                        at[i] = new IntegerConstExpr();
                        at[i].number = 1;
                        break;
                    case 'LAST':
                        at[i] = new IntegerConstExpr();
                        at[i].number = -1;
                        break;
                    default:
                        throw Error('不支持的操作 ' + where);
                }
            }
            let methodName = 'Text_GetSubstring';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('str', str);
            ast.setArg('from', at[0]);
            ast.setArg('to', at[1]);
            ast.setBlockId(block.id);
            return ast;
        },
        text_changeCase(block) {
            if (!(block.values && block.values.TEXT)) {
                throw Error('必须提供字符串');
            }
            let str = BlocktoExpr(block.values.TEXT);
            let _case = block.fields.CASE.text;
            let methodName;
            switch (_case) {
                case 'UPPERCASE':
                    methodName = "Text_ToUpperCase";
                    break;
                case 'LOWERCASE':
                    methodName = "Text_ToLowerCase";
                    break;
                case 'TITLECASE':
                    methodName = "Text_ToTitleCase";
                    break;
                default:
                    throw Error('不支持的操作 ' + _case);
            }
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('str', str);
            ast.setBlockId(block.id);
            return ast;
        },
        text_count(block) {
            if (!(block.values && block.values.TEXT)) {
                throw Error('必须提供字符串');
            }
            let str = BlocktoExpr(block.values.TEXT);
            if (!(block.values && block.values.SUB)) {
                throw Error('必须提供字符串');
            }
            let sub = BlocktoExpr(block.values.SUB);
            let methodName = 'Text_Count';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('str', str);
            ast.setArg('sub', sub);
            ast.setBlockId(block.id);
            return ast;
        },
        text_replace(block) {
            if (!(block.values && block.values.FROM)) {
                throw Error('必须提供字符串');
            }
            let FROM = BlocktoExpr(block.values.FROM);
            if (!(block.values && block.values.TO)) {
                throw Error('必须提供字符串');
            }
            let TO = BlocktoExpr(block.values.TO);
            if (!(block.values && block.values.TEXT)) {
                throw Error('必须提供字符串');
            }
            let TEXT = BlocktoExpr(block.values.TEXT);

            let methodName = 'Text_Replace';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('from', FROM);
            ast.setArg('to', TO);
            ast.setArg('text', TEXT);
            ast.setBlockId(block.id);
            return ast;
        },
        text_reverse(block) {
            if (!(block.values && block.values.TEXT)) {
                throw Error('必须提供字符串');
            }
            let TEXT = BlocktoExpr(block.values.TEXT);
            let methodName = 'Text_Reverse';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let ast = new ValueNativeCall();
            ast.setFunc(func);
            ast.setArg('str', TEXT);
            ast.setBlockId(block.id);
            return ast;
        },
        colour_rgb(block) {
            if (!(block.values && block.values.RED)) {
                throw Error('必须提供颜色');
            }
            let R1 = BlocktoExpr(block.values.RED);
            if (!(block.values && block.values.GREEN)) {
                throw Error('必须提供颜色');
            }
            let G1 = BlocktoExpr(block.values.GREEN);
            if (!(block.values && block.values.BLUE)) {
                throw Error('必须提供颜色');
            }
            let B1 = BlocktoExpr(block.values.BLUE);
            let R24 = new IntegerConstExpr();
            R24.number = 1 << 24;

            let R16 = new IntegerConstExpr();
            R16.number = 1 << 16;

            let R8 = new IntegerConstExpr();
            R8.number = 1 << 8;

            let R = new ARITH();
            R.setOP('MULTIPLY');
            R.setLeft(R1);
            R.setRight(R24);

            let G = new ARITH();
            G.setOP('MULTIPLY');
            G.setLeft(G1);
            G.setRight(R16);

            let B = new ARITH();
            B.setOP('MULTIPLY');
            B.setLeft(B1);
            B.setRight(R8);

            let A1 = new ARITH();
            A1.setOP('ADD');
            A1.setLeft(R);
            A1.setRight(G);

            let A2 = new ARITH();
            A2.setOP('ADD');
            A2.setLeft(A1);
            A2.setRight(B);

            let I0xFF = new IntegerConstExpr();
            I0xFF.number = 0xFF;

            let A3 = new ARITH();
            A3.setOP('ADD');
            A3.setLeft(A2);
            A3.setRight(I0xFF);

            A3.setBlockId(block.id);
            return A3;
        },
        colour_blend(block) {
            if (!(block.values && block.values.COLOUR1)) {
                throw Error('必须提供颜色');
            }
            let C1 = new FixRegister(BlocktoExpr(block.values.COLOUR1));
            if (!(block.values && block.values.COLOUR2)) {
                throw Error('必须提供颜色');
            }
            let C2 = new FixRegister(BlocktoExpr(block.values.COLOUR2));
            if (!(block.values && block.values.RATIO)) {
                throw Error('必须提供颜色');
            }
            let RATIO2 = BlocktoExpr(block.values.RATIO);
            let solidifyRATIO2 = new FixRegister(RATIO2);
            let RATIO1 = new ARITH();
            RATIO1.setOP('MINUS');
            RATIO1.setLeft(new IntegerConstExpr(1));
            RATIO1.setRight(solidifyRATIO2);
            let solidifyRATIO1 = new FixRegister(RATIO1);

            let R1 = new SHL(new BitAnd(new IntegerConstExpr(0xFF000000), C1), new IntegerConstExpr(-24));
            let G1 = new SHL(new BitAnd(new IntegerConstExpr(0xFF0000), C1), new IntegerConstExpr(-16));
            let B1 = new SHL(new BitAnd(new IntegerConstExpr(0xFF00), C1), new IntegerConstExpr(-8));
            let T1 = new BitAnd(C1.unfix(), new IntegerConstExpr(0xFF));
            let R2 = new SHL(new BitAnd(new IntegerConstExpr(0xFF000000), C2), new IntegerConstExpr(-24));
            let G2 = new SHL(new BitAnd(new IntegerConstExpr(0xFF0000), C2), new IntegerConstExpr(-16));
            let B2 = new SHL(new BitAnd(new IntegerConstExpr(0xFF00), C2), new IntegerConstExpr(-8));
            let T2 = new BitAnd(C2.unfix(), new IntegerConstExpr(0xFF));

            let SR1 = new ARITH();
            SR1.setOP('MULTIPLY');
            SR1.setLeft(R1);
            SR1.setRight(solidifyRATIO1);
            let SR2 = new ARITH();
            SR2.setOP('MULTIPLY');
            SR2.setLeft(R2);
            SR2.setRight(solidifyRATIO2);
            let RR = new ARITH();
            RR.setOP('ADD');
            RR.setLeft(SR1);
            RR.setRight(SR2);
            RR = new F2I(RR);

            let SG1 = new ARITH();
            SG1.setOP('MULTIPLY');
            SG1.setLeft(G1);
            SG1.setRight(solidifyRATIO1);
            let SG2 = new ARITH();
            SG2.setOP('MULTIPLY');
            SG2.setLeft(G2);
            SG2.setRight(solidifyRATIO2);
            let RG = new ARITH();
            RG.setOP('ADD');
            RG.setLeft(SG1);
            RG.setRight(SG2);
            RG = new F2I(RG);

            let SB1 = new ARITH();
            SB1.setOP('MULTIPLY');
            SB1.setLeft(B1);
            SB1.setRight(solidifyRATIO1);
            let SB2 = new ARITH();
            SB2.setOP('MULTIPLY');
            SB2.setLeft(B2);
            SB2.setRight(solidifyRATIO2);
            let RB = new ARITH();
            RB.setOP('ADD');
            RB.setLeft(SB1);
            RB.setRight(SB2);
            RB = new F2I(RB);

            let ST1 = new ARITH();
            ST1.setOP('MULTIPLY');
            ST1.setLeft(T1);
            ST1.setRight(solidifyRATIO1.unfix());
            let ST2 = new ARITH();
            ST2.setOP('MULTIPLY');
            ST2.setLeft(T2);
            ST2.setRight(solidifyRATIO2.unfix());
            let RT = new ARITH();
            RT.setOP('ADD');
            RT.setLeft(ST1);
            RT.setRight(ST2);
            RT = new F2I(RT);


            let SR = new SHL(new BitAnd(RR, new IntegerConstExpr(0xFF)), new IntegerConstExpr(24));
            let SG = new SHL(new BitAnd(RG, new IntegerConstExpr(0xFF)), new IntegerConstExpr(16));
            let SB = new SHL(new BitAnd(RB, new IntegerConstExpr(0xFF)), new IntegerConstExpr(8));
            let ST = new BitAnd(RT, new IntegerConstExpr(0xFF));

            let fRG = new ARITH();
            fRG.setOP('ADD');
            fRG.setLeft(SR);
            fRG.setRight(SG);

            let RGB = new ARITH();
            RGB.setOP('ADD');
            RGB.setLeft(fRG);
            RGB.setRight(SB);

            let RGBT = new ARITH();
            RGBT.setOP('ADD');
            RGBT.setLeft(RGB);
            RGBT.setRight(ST);

            RGBT.setBlockId(block.id);
            return RGBT;
        },
        colour_random(block) {
            let F0xFF = new FloatConstExpr();
            F0xFF.number = 0xFF;

            let R24 = new IntegerConstExpr();
            R24.number = 1 << 24;

            let R16 = new IntegerConstExpr();
            R16.number = 1 << 16;

            let R8 = new IntegerConstExpr();
            R8.number = 1 << 8;

            let randInt = new RandomInt();
            randInt.From = new FloatConstExpr();
            randInt.From.number = 0;
            randInt.To = F0xFF;

            let R = new ARITH();
            R.setOP('MULTIPLY');
            R.setLeft(randInt);
            R.setRight(R24);

            let G = new ARITH();
            G.setOP('MULTIPLY');
            G.setLeft(randInt);
            G.setRight(R16);

            let B = new ARITH();
            B.setOP('MULTIPLY');
            B.setLeft(randInt);
            B.setRight(R8);

            let A1 = new ARITH();
            A1.setOP('ADD');
            A1.setLeft(R);
            A1.setRight(G);

            let A2 = new ARITH();
            A2.setOP('ADD');
            A2.setLeft(A1);
            A2.setRight(B);

            let I0xFF = new IntegerConstExpr();
            I0xFF.number = 0xFF;

            let A3 = new ARITH();
            A3.setOP('ADD');
            A3.setLeft(A2);
            A3.setRight(I0xFF);

            A3.setBlockId(block.id);
            return A3;
        },
        logic_operation(block) {
            if (!(block.values && block.values.A)) {
                throw Error('必须提供条件');
            }
            let A = (BlocktoExpr(block.values.A));
            if (!(block.values && block.values.B)) {
                throw Error('必须提供条件');
            }
            let B = (BlocktoExpr(block.values.B));
            if (block.fields.OP.text === 'AND') {
                let ast = new LogicAnd(A, B);
                ast.setBlockId(block.id);
                return ast;
            } else {
                let ast = new LogicOr(A, B);
                ast.setBlockId(block.id);
                return ast;
            }
        },
        logic_negate(block) {
            if (!(block.values && block.values.BOOL)) {
                throw Error('必须提供条件');
            }
            let A = (BlocktoExpr(block.values.BOOL));
            let ast = new LogicNot(A);
            ast.setBlockId(block.id);
            return ast;
        },
        math_constrain(block) {
            let VALUE = (BlocktoExpr2(block.values, 'VALUE'));
            let LOW = (BlocktoExpr2(block.values, 'LOW'));
            let HIGH = (BlocktoExpr2(block.values, 'HIGH'));
            let c = new ConstrainNumber();
            c.setValue(VALUE);
            c.setMax(HIGH);
            c.setMin(LOW);
            c.setBlockId(block.id);
            return c;
        },
        logic_ternary(block) {
            let IF = BlocktoExpr2(block.values, 'IF');
            let THEN = BlocktoExpr2(block.values, 'THEN');
            let ELSE = BlocktoExpr2(block.values, 'ELSE');
            let ast = new Conditional(IF, THEN, ELSE);
            ast.setBlockId(block.id);
            return ast;
        },
        fsm_provider(block) {
            let fsmtype = block.fields.FSM.text;
            let textExpr = new TextConstExpr(fsmtype);
            textExpr.setBlockId(block.id);
            return textExpr;
        },
        empty_provider(block) {
            let value = block.fields.VALUE.text;
            let textExpr = new TextConstExpr(value);
            textExpr.setBlockId(block.id);
            return textExpr;
        },
        text_comment(block) {
            let ast = new Comment(block.fields.TEXT.text);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_new(block) {
            let t = block.fields.TYPE.text;
            if (t.length == 0) {
                throw Error(OpenBlock.i('需要设置类型'));
            }
            let ast = new NewStruct(t);
            ast.setBlockId(block.id);
            return ast;
        },
        text_key_value(m) {
            let ast = new TextConstExpr();
            ast.setText(m.fields.VALUE.text);
            ast.setBlockId(m.id);
            return ast;
        },
        struct_new_collection(block) {
            let ast;
            switch (block.fields.TYPE.text) {
                case 'list':
                    ast = new CreateList();
                    break;
                case 'string_map':
                    ast = new CreateStringMap();
                    break;
                case 'integer_map':
                    ast = new CreateIntMap();
                    break;
            }
            ast.setElementType(block.fields.ELEMENT_TYPE.text);
            return ast;
        },

        struct_list_get_value_at_index(block) {
            if (!(block.values && block.values.LIST)) {
                throw Error('必须提供列表');
            }
            if (!(block.values && block.values.INDEX)) {
                throw Error('必须提供索引');
            }
            let list = BlocktoExpr(block.values.LIST);
            let index = BlocktoExpr(block.values.INDEX);
            let ast = new ValueAt(list, index);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_list_set_value_at_index(block) {
            if (!(block.values && block.values.LIST)) {
                throw Error('必须提供列表');
            }
            if (!(block.values && block.values.INDEX)) {
                throw Error('必须提供索引');
            }
            if (!(block.values && block.values.VALUE)) {
                throw Error('必须提供值');
            }
            let value = BlocktoExpr(block.values.VALUE);
            let idx = BlocktoExpr(block.values.INDEX);
            let list = BlocktoExpr(block.values.LIST);
            let ast = new SVAT(list, idx, value);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_list_insert_value_at_index(block) {
            if (!(block.values && block.values.LIST)) {
                throw Error('必须提供列表');
            }
            if (!(block.values && block.values.INDEX)) {
                throw Error('必须提供索引');
            }
            if (!(block.values && block.values.VALUE)) {
                throw Error('必须提供值');
            }
            let value = BlocktoExpr(block.values.VALUE);
            let idx = BlocktoExpr(block.values.INDEX);
            let list = BlocktoExpr(block.values.LIST);
            let ast = new IVAT(list, idx, value);
            ast.setBlockId(block.id);
            return ast;
        },
        struct_list_delete_value_at_index(block) {
            if (!(block.values && block.values.LIST)) {
                throw Error('必须提供列表');
            }
            if (!(block.values && block.values.INDEX)) {
                throw Error('必须提供索引');
            }
            let idx = BlocktoExpr(block.values.INDEX);
            let list = BlocktoExpr(block.values.LIST);
            let ast = new RVAT(list, idx);
            ast.setBlockId(block.id);
            return ast;
        },
        /**
         * openblock变量必须初始化，此命令不再有意义
         */
        logic_var_assigned(block) {
            if (!(block.values && block.values.VALUE)) {
                throw Error('必须提供变量');
            }
            let value = BlocktoExpr(block.values.VALUE);
            let ast = new VarAssigned();
            ast.setValue(value);
            ast.setBlockId(block.id);
            return ast;
        },
        text_log(block) {
            if (!(block.values && block.values.MSG)) {
                throw Error('必须指定消息');
            }
            let methodName = 'SYS_LOG';
            let func = OpenBlock.nativefunctions.findBuildInFunction(methodName);
            let msg = BlocktoExpr(block.values.MSG, "必须提供值");
            let level = parseInt(block.fields.LEVEL.text);
            let a_level = new IntegerConstExpr();
            a_level.number = level;
            let ast = new VoidNativeCall();
            ast.setFunc(func);
            ast.setArg('msg', msg);
            ast.setArg('level', a_level);
            ast.setBlockId(block.id);
            return ast;
        },
    };
})();