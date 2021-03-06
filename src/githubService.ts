"use strict";

import * as envir from './environmentPath';
import * as fileManager from './fileManager';


var GitHubApi = require("github4");

var github = new GitHubApi({
    version: "3.0.0"
});


export class GithubService {


    private GIST_JSON_EMPTY: any = {
        "description": "Visual Studio Code Sync Settings GIST",
        "public": false,
        "files": {
            "settings.json": {
                "content": "// Empty"
            },
            "launch.json": {
                "content": "// Empty"
            },
            "keybindings.json": {
                "content": "// Empty"
            },
            "extensions.json": {
                "content": "// Empty"
            },
            "locale.json": {
                "content": "// Empty"
            },
            "keybindingsMac.json": {
                "content": "// Empty"
            },
            "cloudSettings": {
                "content": "// Empty"
            }
        }
    };

    private GIST_JSON: any = null;

    constructor(private TOKEN: string) {
        github.authenticate({
            type: "oauth",
            token: TOKEN
        });
    }

    public AddFile(list: Array<fileManager.File>, GIST_JSON_b: any) {
        for (var i = 0; i < list.length; i++) {
            var file = list[i];
            GIST_JSON_b.files[file.fileName] = {};
            GIST_JSON_b.files[file.fileName].content = file.content;
        }
        return GIST_JSON_b;
    }

    public CreateNewGist(files: Array<fileManager.File>): Promise<string> {

        var me = this;
        return new Promise<string>((resolve, reject) => {

            me.GIST_JSON_EMPTY = me.AddFile(files, me.GIST_JSON_EMPTY);
            github.getGistsApi().create(me.GIST_JSON_EMPTY
                , function (err, res) {
                    if (err != null) {
                        console.error(err);
                        reject(false);
                    }
                    resolve(res.id);
                });
        });
    }

    public CreateEmptyGIST(): Promise<string> {
        var me = this;
        return new Promise<string>((resolve, reject) => {
            github.getGistsApi().create(me.GIST_JSON_EMPTY
                , function (err, res) {
                    if (err) {
                        console.error(err);
                        reject(false);
                    }
                    resolve(res.id);
                });
        });
    }

    public async ReadGist(GIST: string): Promise<any> {
        var me = this;
        return new Promise<any>(async (resolve, reject) => {
            await github.getGistsApi().get({ id: GIST }, async function (er, res) {
                if (er) {
                    console.error(er);
                    reject(er);
                }
                resolve(res);
            });
        });
    }

    public UpdateGIST(gistObject: any, files: Array<fileManager.File>): any {

        var me = this;
        var allFiles: string[] = Object.keys(gistObject.files);
        for (var fileIndex = 0; fileIndex < allFiles.length; fileIndex++) {
            var fileName = allFiles[fileIndex];
            // if (fileName.indexOf(".") < 0) {
            //     gistObject.files[fileName] = null;
            // }
            var exists = false;

            files.forEach((settingFile) => {
                if (settingFile.fileName == fileName) {
                    exists = true;
                }
            });

            if (!exists && !fileName.startsWith("keybindings")) {
                gistObject.files[fileName] = null;
            }

        }

        gistObject = me.AddFile(files, gistObject);
        return gistObject;
    }

    public async SaveGIST(gistObject: any): Promise<boolean> {
        var me = this;
        return new Promise<boolean>(async (resolve, reject) => {
            await github.getGistsApi().edit(gistObject, function (ere, ress) {
                if (ere) {
                    console.error(ere);
                    reject(false);
                }
                resolve(true);
            });
        });
    }

    public async ExistingGist(GIST: string, files: Array<fileManager.File>): Promise<boolean> {
        var me = this;
        return new Promise<boolean>(async (resolve, reject) => {
            await github.getGistsApi().get({ id: GIST }, async function (er, res) {

                if (er) {
                    console.error(er);
                    reject(false);
                }
                else {

                    var allFiles: string[] = Object.keys(res.files);
                    for (var fileIndex = 0; fileIndex < allFiles.length; fileIndex++) {
                        var fileName = allFiles[fileIndex];
                        if (fileName.indexOf(".") < 0) {
                            res.files[fileName] = null;
                        }
                        var exists = false;

                        files.forEach((settingFile) => {
                            if (settingFile.fileName == fileName) {
                                exists = true;
                            }
                        });

                        if (!exists && !fileName.startsWith("keybindings")) {
                            res.files[fileName] = null;
                        }

                    }

                    res = me.AddFile(files, res);
                    await github.getGistsApi().edit(res, function (ere, ress) {
                        if (ere) {
                            console.error(er);
                            reject(false);
                        }
                        resolve(true);
                    });
                }
            });
        });
    }
}