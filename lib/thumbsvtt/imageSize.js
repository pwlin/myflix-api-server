/*jslint nomen:true, node:true, plusplus:true */
/*global */
//https://github.com/image-size/image-size
var fs = require('fs'),
    MaxBufferSize = 128 * 1024;

function validateBuffer(buffer, i) {
    'use strict';
    // index should be within buffer limits
    if (i > buffer.length) {
        throw new TypeError('Corrupt JPG, exceeded buffer limits');
    }
    // Every JPEG block must begin with a 0xFF
    if (buffer[i] !== 0xFF) {
        throw new TypeError('Invalid JPG, marker table corrupted');
    }
}

function extractSize(buffer, i) {
    'use strict';
    return {
        'height': buffer.readUInt16BE(i),
        'width': buffer.readUInt16BE(i + 2)
    };
}

function calculate(buffer) {
    'use strict';
    // Skip 5 chars, they are for signature
    buffer = buffer.slice(4);
    var i, next;
    while (buffer.length) {
        // read length of the next block
        i = buffer.readUInt16BE(0);
        // ensure correct format
        validateBuffer(buffer, i);
        // 0xFFC0 is baseline(SOF)
        // 0xFFC2 is progressive(SOF2)
        next = buffer[i + 1];
        if (next === 0xC0 || next === 0xC2) {
            return extractSize(buffer, i + 5);
        }
        // move to the next block
        buffer = buffer.slice(i + 2);
    }
    throw new TypeError('Invalid JPG, no size found');
}

function syncFileToBuffer(filepath) {
    'use strict';
    // read from the file, synchronously
    var descriptor = fs.openSync(filepath, 'r'),
        size = fs.fstatSync(descriptor).size,
        bufferSize = Math.min(size, MaxBufferSize),
        buffer = new Buffer(bufferSize);
    fs.readSync(descriptor, buffer, 0, bufferSize, 0);
    fs.closeSync(descriptor);
    return buffer;
}

function lookup(buffer, filepath) {
    'use strict';
    var size = calculate(buffer, filepath);
    if (size !== false) {
        size.type = 'JPG';
        return size;
    }
}

function getDimensions(filepath) {
    'use strict';
    var buffer = syncFileToBuffer(filepath);
    return lookup(buffer, filepath);
}

exports.getDimensions = getDimensions;