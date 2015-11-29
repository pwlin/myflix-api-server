/*jslint nomen:true, node:true, plusplus:true */
/*global */
var sh = require('child_process'),
    fs = require('fs'),
	debug = require('debug')('MyFlix-API-ThumbsVTT'),
	utils = require('../utils'),
    imageSize = require('./imageSize'),
    path = require('path'),
    mtn = path.join(__dirname, 'mtn', 'mtn.exe'),
    thumbsJPGFileSuffix = 'vtt-thumbs.jpg',
    thumbsVTTFileSuffix = '-thumbs.vtt';

function isFile(filePath) {
    'use strict';
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}

function isDirectory(dirPath) {
    'use strict';
    try {
        return fs.statSync(dirPath).isDirectory();
    } catch (err) {
        return false;
    }
}

function copyFile(sourceFile, targetFile) {
    'use strict';
    fs.writeFileSync(targetFile, fs.readFileSync(sourceFile));
}

function rmFile(sourcefile) {
    'use strict';
    if (isFile(sourcefile)) {
        fs.unlinkSync(sourcefile);
    }
}

function writeFile(path, data) {
    'use strict';
    fs.writeFileSync(path, data);
}

function shellSpawnSync(cmd, args) {
    'use strict';
    args = args || [];
    //sh.execSync
    var output = sh.spawnSync(cmd, args, {
        encoding: 'utf8',
        stdio: [0, 1, 2]
    });
    //process.stdout.write(output);
    return output;
}

function dirWalk(dir, files_) {
    'use strict';
    if (!isDirectory(dir)) {
        return {};
    }
    files_ = files_ || {};
    var files = fs.readdirSync(dir),
        i,
        name;
    for (i in files) {
        if (files.hasOwnProperty(i)) {
            name = path.join(dir, files[i]);
            if (isDirectory(name)) {
                dirWalk(name, files_);
            } else {
                if (files_[path.dirname(name)]) {
                    files_[path.dirname(name)].push(name);
                } else {
                    files_[path.dirname(name)] = [];
                    files_[path.dirname(name)].push(name);
                }
            }
        }
    }
    return files_;
}

function rmDir(pathDir) {
    'use strict';
    var files = [];
    if (fs.existsSync(pathDir)) {
        files = fs.readdirSync(pathDir);
        files.forEach(function (file, index) {
            var curPath = path.join(pathDir, file);
            if (isDirectory(curPath)) { // recurse
                rmDir(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(pathDir);
    }
}

function forEach(obj, cb) {
    'use strict';
    var i,
        l,
        k;
    if (/String|Array/.test(Object.prototype.toString.call(obj))) {
        for (i = 0, l = obj.length; i < l; i++) {
            if (cb) {
                cb(i, obj[i]);
            }
        }
    } else {
        for (k in obj) {
            if (obj.hasOwnProperty(k)) {
                if (cb) {
                    cb(k, obj[k]);
                }
            }
        }
    }
}

function removeArrayItem(array, itemToRemove) {
    'use strict';
    // Count of removed items
    var removeCounter = 0,
        index;

    // Iterate every array item
    for (index = 0; index < array.length; index++) {
        // If current array item equals itemToRemove then
        if (array[index] === itemToRemove) {
            // Remove array item at current index
            array.splice(index, 1);

            // Increment count of removed items
            removeCounter++;

            // Decrement index to iterate current position 
            // one more time, because we just removed item 
            // that occupies it, and next item took it place
            index--;
        }
    }

    // Return count of removed items
    return removeCounter;
}

function generateJPGThumbs(movieName, movieFolder, thumbsVTTFile, thumbsJPGFile) {
    'use strict';
    if (!isFile(path.join(movieFolder, movieName + '.mp4'))) {
        return;
    }
    var thumbsDir = path.join(movieFolder, 'thumbs'),
        currentItem,
        nextItem,
        dimensions = null,
        vttContent = "WEBVTT\n",
        allThumbs;
    rmDir(thumbsDir);
    rmFile(thumbsVTTFile);
    rmFile(thumbsJPGFile);
    debug(utils.logd() + ' Generating thumbnails for: ' + path.join(movieFolder, movieName + '.mp4'));
    shellSpawnSync(mtn, ['-P', '-c 1', '-s 120', '-w 200', '-h 50', '-t', '-i', '-o', thumbsJPGFileSuffix, '-O', thumbsDir, '-I', path.join(movieFolder, movieName + '.mp4')]);
    allThumbs = dirWalk(thumbsDir);
    if (allThumbs[thumbsDir]) {
        copyFile(path.join(thumbsDir, movieName + thumbsJPGFileSuffix), thumbsJPGFile);
        removeArrayItem(allThumbs[thumbsDir], path.join(thumbsDir, movieName + thumbsJPGFileSuffix));
        forEach(allThumbs[thumbsDir], function (key, item) {
            if (!allThumbs[thumbsDir][key + 1]) {
                return true;
            } else {

                if (dimensions === null) {
                    dimensions = imageSize.getDimensions(item);
                }

                currentItem = item.replace(path.join(thumbsDir, movieName + '_'), '');
                currentItem = currentItem.split('_');
                currentItem = currentItem[0] + ':' + currentItem[1] + ':' + currentItem[2];

                nextItem = allThumbs[thumbsDir][key + 1];
                nextItem = nextItem.replace(path.join(thumbsDir, movieName + '_'), '');
                nextItem = nextItem.split('_');
                nextItem = nextItem[0] + ':' + nextItem[1] + ':' + nextItem[2];

                vttContent += "\n" + currentItem + ".000 --> " + nextItem + ".000\n";
                vttContent += thumbsJPGFileSuffix + '#xywh=' + (dimensions.width * key) + ',' + (dimensions.height * key) + ',' + dimensions.width + ',' + dimensions.height + "\n";

            }

        });

    }

    rmDir(thumbsDir);
    if (vttContent !== "WEBVTT\n") {
        writeFile(thumbsVTTFile, vttContent);
    }

}

function initGenerateThumbs(moviesDir) {
    'use strict';
    if (!isDirectory(moviesDir)) {
        debug(utils.logd() + ' ' + moviesDir + ' is not a directory. Exiting.');
        return;
    }
	debug(utils.logd() + ' Processing ' + moviesDir + '...');
    var movies = dirWalk(moviesDir),
        movieName,
        thumbsVTTFile,
        thumbsJPGFile;

    forEach(movies, function (key, items) {
        if (key.match(/thumbs$/ig)) {
            return true;
        }
        movieName = path.basename(key);
        thumbsVTTFile = path.join(key, movieName + thumbsVTTFileSuffix);
        thumbsJPGFile = path.join(key, thumbsJPGFileSuffix);
        if (!isFile(thumbsVTTFile) || !isFile(thumbsJPGFile)) {
            generateJPGThumbs(movieName, key, thumbsVTTFile, thumbsJPGFile);
        } else {
            //debug(utils.logd() +  ' ' + movieName + ' already has a thumbnail vtt file.');
        }
    });
	
	debug(utils.logd() + ' Done processing ' + moviesDir);

}

exports.initGenerateThumbs = initGenerateThumbs;