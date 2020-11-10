import { OK } from "http-status-codes";
import request = require("request");
import { isString } from "util";

export async function getRequest<T>(link, api_id, api_key) {
    const headers = {
        Authorization: "Basic " + Buffer.from(api_id + ":" + api_key).toString("base64"),
        "cache-control": "no-cache"
    };
    return new Promise<T>((res, rej) => {
        request(
            {
                headers,
                uri: link,
                method: "GET"
            },
            async (err, _res, body) => {
                if (err) {
                    console.error(err);
                    rej(err);
                } else {
                    if (_res.statusCode !== OK) {
                        console.error(body);
                        return rej(body);
                    }
                    if (isString(body) && !body.length) return res();
                    return res(body);
                }
            }
        );
    });
}

export function postBodyRequest<T>(link, params, api_id, api_key) {
    const headers = {
        Authorization: "Basic " + Buffer.from(api_id + ":" + api_key).toString("base64"),
        "Content-Type": "application/json"
    };
    return new Promise<T>((res, rej) => {
        request(
            {
                headers,
                uri: link,
                body: params,
                json: true,
                method: "POST"
            },
            // tslint:disable-next-line:variable-name
            async (err, _res, body) => {
                if (err) {
                    console.error(err);
                    rej(err);
                } else {
                    if (_res.statusCode !== OK) {
                        console.error(body);
                        return rej(body);
                    }
                    if (isString(body) && !body.length) return res();
                    delete Object.assign(body, { ["url"]: body["uri"] })["uri"];
                    return res(body);
                }
            }
        );
    });
}
