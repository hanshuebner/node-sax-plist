var sax = require('sax');
var fs = require('fs');
var util = require('util');

function Parser()
{
    sax.SAXParser.call(this, false, { lowercasetags: true, trim: true });
}

util.inherits(Parser, sax.SAXParser);

Parser.prototype.getInteger = function (string) {
    this.value = parseInt(string, 10);
}
Parser.prototype.getString = function (string) {
    this.value = string;
}
Parser.prototype.getData = function(string) {
    // todo: parse base64 encoded data
    this.value = string;
}
Parser.prototype.getDate = function (string) {
    this.value = new Date(string);
}

Parser.prototype.addToDict = function (value) {
    this.dict[this.key] = value;
}
Parser.prototype.addToArray = function (value) {
    this.array.push(value);
}

Parser.prototype.onopentag = function (tag) {
    switch (tag.name) {
    case 'plist':
        break;
    case 'dict':
        this.stack.push(this.context);
        this.context = {
            value: function() {
                return this.dict;
            },
            dict: {},
            setKey: function(key) {
                this.key = key;
            },
            setValue: function(value) {
                this.dict[this.key] = value;
            }
        }
        break;
    case 'array':
        this.stack.push(this.context);
        this.context = {
            value: function() {
                return this.array;
            },
            array: [],
            setKey: function(key) {
                console.log('unexpected <key> element in array');
            },
            setValue: function(value) {
                this.array.push(value);
            }
        }
        break;
    case 'key':
        this.ontext = function (text) {
            this.context.setKey(text);
        }
        break;
    case 'integer':
        this.ontext = this.getInteger;
        break;
    case 'string':
        this.ontext = this.getString;
        break;
    case 'data':
        this.ontext = this.getData;
        break;
    case 'true':
        this.value = true;
        break;
    case 'false':
        this.value = false;
        break;
    case 'date':
        this.ontext = this.getDate;
        break;
    default:
        console.log('ignored tag', tag.name);
        break;
    }
}
Parser.prototype.onclosetag = function (tag) {
    var value;
    switch (tag) {
    case 'dict':
    case 'array':
        var value = this.context.value();
        this.context = this.stack.pop();
        this.context.setValue(value);
        break;
    case 'true':
    case 'false':
    case 'string':
    case 'integer':
    case 'date':
    case 'data':
        this.context.setValue(this.value);
        break;
    case 'key':
    case 'plist':
        break;
    default:
        console.log('closing', tag, 'tag ignored');
    }

}
Parser.prototype.oncdata = function (data) {
    console.log('cdata not recognized');
}
Parser.prototype.oncomment = function (comment) {
}
Parser.prototype.onerror = function (error) {
    console.log(error);
    throw error;
}

Parser.prototype.parse = function (xmlfile, callback) {
    var parser = this;
    fs.open(xmlfile, "r", 0666, function (err, fd) {
        if (err) callback(err);
        parser.stack = [ ];
        parser.context = {
            callback: callback,
            value: function() {},
            setKey: function(key) {},
            setValue: function(value) {
                this.callback(null, value);
            },
        }
        function readMore () {
            fs.read(fd, 32 * 1024, null, "utf8", function (er, data, bytesRead) {
                if (er) throw er;
                if (data) {
                    parser.write(data);
                    readMore();
                } else {
                    fs.close(fd);
                    parser.close();
                }
            });
        }
        readMore();
    });
}

exports.Parser = Parser;
