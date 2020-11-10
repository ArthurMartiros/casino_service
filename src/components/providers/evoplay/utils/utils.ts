import * as md5 from "js-md5";
import { forEach } from "lodash";

export class EvoplayUtilities {
    // tslint:disable-next-line:no-any
    public static generateSignature(apiProject: number, apiVersion: number, args: object | any, apiKey: string): string {
        const parts = [this.compact(apiProject), this.compact(apiVersion)];
        for (const val in args) {
            parts.push(this.compact(val));
        }
        parts.push(this.compact(apiKey));
        return md5(parts.join("*"));
    }

    public static compact(arg): string {
        try {
            if ("object" === typeof arg) {
                let result: string[] = [];
                forEach(arg, val => {
                    result.push(this.compact(val));
                });
                return result.join(":");
            } else {
                return "" + arg;
            }
        } catch (error) {
            console.error(error);
            return "";
        }
    }
}


import * as request from "request";
import { stringify } from "querystring";

export class RequestUtilities {
    public static request = request;

    private static parseQuery(options): string {
        return options && options.query ? "?" + stringify(options.query) : "";
    }

    // tslint:disable-next-line:no-any
    public static async get(url, options): Promise<any> {
        // tslint:disable-next-line:no-any
        return await new Promise<any>((resolve: Function, reject: Function) => {
            this.request.get(url + this.parseQuery(options), options, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        response,
                        body
                    });
                }
            });
        });
    }

    // tslint:disable-next-line:no-any
    public static async post(url, options): Promise<any> {
        // tslint:disable-next-line:no-any
        return await new Promise<any>((resolve: Function, reject: Function) => {
            this.request.post(url + this.parseQuery(options), options, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        response,
                        body
                    });
                }
            });
        });
    }
}
