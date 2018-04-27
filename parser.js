const fs = require('fs');

module.exports = (filename, hasHeader = true, sep = '-') => {
    this.filename = filename;
    this.hasHeader = hasHeader;
    this.sep = sep;
    var data = [];
    var isFirstElement = true;
    var parseData = (filename) => {
        var element = {};
        var currentField = null;
        var lines = fs.readFileSync(filename).toString().split(/\r?\n/);
        for (var i in lines) {
            if (lines[i].startsWith('//') || lines[i] == "") {
                continue;
            } else if (lines[i].startsWith(this.sep)) {
                if (this.hasHeader && isFirstElement) {
                    isFirstElement = false;
                    continue;
                }
                var kindElement = element['kind'];
                if (kindElement != "Ref") {
                    var docElement = element['doc'];
                    if (docElement) {
                        element['doc'] = docElement.split('`').join('').trim();
                    }
                    data.push(element);
                }
                element = {};
            } else if (lines[i].startsWith("  ") || lines[i].startsWith("\t")) {
                element[currentField] += lines[i];
            } else if (lines[i].indexOf(':') != -1) {
                var fields = lines[i].split(":")
                var key = fields[0].trim();
                var value = fields[1].trim();
                currentField = key;
                element[key] = value;
            }

        }
        return data;
    }
    var parse = () => {
        return new Promise((resolve, reject) => {
            try {
                resolve(parseData(this.filename));
            } catch (error) {
                reject(error);
            }
        });
    }
    return {
        parse: parse
    }
}