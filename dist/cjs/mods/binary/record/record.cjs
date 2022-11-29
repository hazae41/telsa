'use strict';

var binary = require('../../../libs/binary.cjs');

class RecordHeader {
    constructor(type, version, length) {
        this.type = type;
        this.version = version;
        this.length = length;
    }
    size() {
        return 1 + 2 + 2;
    }
    write(binary) {
        binary.writeUint8(this.type);
        binary.writeUint16(this.version);
        binary.writeUint16(this.length);
    }
    static tryRead(binary) {
        const start = binary.offset;
        try {
            return this.read(binary);
        }
        catch (e) {
            binary.offset = start;
        }
    }
    static read(binary) {
        const type = binary.readUint8();
        const version = binary.readUint16();
        const length = binary.readUint16();
        return new this(type, version, length);
    }
}
class Record {
    constructor(subtype, version, fragment) {
        this.subtype = subtype;
        this.version = version;
        this.fragment = fragment;
        this.class = Record;
    }
    static from(record, version) {
        return new this(record.type, version, record);
    }
    size() {
        return 1 + 2 + 2 + this.fragment.size();
    }
    write(binary) {
        binary.writeUint8(this.subtype);
        binary.writeUint16(this.version);
        binary.writeUint16(this.fragment.size());
        this.fragment.write(binary);
    }
    export() {
        const binary$1 = binary.Binary.allocUnsafe(this.size());
        this.write(binary$1);
        return binary$1;
    }
}
Record.types = {
    invalid: 0,
    change_cipher_spec: 20,
    alert: 21,
    handshake: 22,
    application_data: 23
};

exports.Record = Record;
exports.RecordHeader = RecordHeader;
//# sourceMappingURL=record.cjs.map
