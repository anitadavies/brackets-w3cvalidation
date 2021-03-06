/* MIT License
 *
 * Copyright (c) 2016 schreiben
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

/* eslint-disable indent */
const execFile = require('child_process').execFile,
      os = require('os'),
      path = require('path'),
      request = require('request'),
      tar = require('tar-fs'),
      zlib = require('zlib');
/* eslint-enable indent */

const JRE = require('./dependency.json').JRE;

let platform,
    javaBinDir = 'bin';
switch (os.platform()) {
    case 'darwin':
        platform = 'macosx';
        javaBinDir = 'Contents/Home/bin';
        break;
    case 'win32':
        platform = 'windows';
        break;
    case 'linux':
        platform = 'linux';
        break;
}

const jreDir = path.join(__dirname, 'jre');

process.env.PATH += path.join(path.delimiter, jreDir, javaBinDir);

function check() {
    return new Promise((resolve, reject) => {
        execFile('java', ['-version'], (error, stdout, stderr) => {
            const currentVersion = stderr.substring(14, stderr.lastIndexOf('"'));

            (currentVersion >= JRE.version) ? resolve() : reject();
        });
    }).catch(() => install());
}//check

/*
 * Set the JRE download URL
 */
const option = () => {
    let arch = os.arch();
    switch (arch) {
        case 'x64':
            break;
        case 'x86':
        case 'ia32':
            arch = 'i586';
            break;
    }

    return {
        url: `https://download.oracle.com/otn-pub/java/jdk/${JRE.product_version}-b${JRE.build_number}/${JRE.hash}/jre-${JRE.product_version}-${platform}-${arch}.tar.gz`,
        rejectUnauthorized: false,
        agent: false,
        headers: {
            connection: 'keep-alive',
            'Cookie': 'gpw_e24=http://www.oracle.com/; oraclelicense=accept-securebackup-cookie'
        }
    };
};

function install() {
    return new Promise((resolve, reject) => {
        request.get(option())
            .pipe(zlib.createUnzip())
            .pipe(tar.extract(jreDir, {
                map: header => {
                    header.name = header.name.replace(/.*?\//, '');
                    return header;
                },
                readable: true,
                writable: true
            }))
            .on('finish', () => resolve())
            .on('error', err => reject(err));
    });
}//install

module.exports.checkJRE = check;
