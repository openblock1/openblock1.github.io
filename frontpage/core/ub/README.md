            Parser              Linker                        Compiler    
blockly      parse               link                          compile to exe
blocks --------------> AST --------------> single AST -------------------------------> bytecode
                                                         |
                                                         |
                                                         |     compile to static lib
                                                         |---------------------------> ?
                                                         |
                                                         |     compile to dymic lib
                                                         |---------------------------> ?