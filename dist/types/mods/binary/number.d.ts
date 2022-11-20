import { Binary } from '../../libs/binary.js';

type NumberX = Number8 | Number16;
declare class Number8 {
    readonly value: number;
    readonly class: typeof Number8;
    static size: 1;
    constructor(value: number);
    size(): 1;
    write(binary: Binary): void;
    static read(binary: Binary): Number8;
}
declare class Number16 {
    readonly value: number;
    readonly class: typeof Number16;
    static size: 2;
    constructor(value: number);
    size(): 2;
    write(binary: Binary): void;
    static read(binary: Binary): Number16;
}

export { Number16, Number8, NumberX };
