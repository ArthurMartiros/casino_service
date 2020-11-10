import { createHmac } from "crypto";
import { array_merge, ksort } from "locutus/php/array";
import { v4 } from "uuid";
import { time } from "locutus/php/datetime";
import { OK } from "http-status-codes";
import { http_build_query } from "locutus/php/url";
import { queueRequest } from "../../../../../../CommonJS/src/utils/http.util";
import request = require("request");
import { isString } from "util";

export async function getRequest<T>(link, params, api_id, api_key) {
    const headers = {
        "X-Merchant-Id": api_id,
        "X-Timestamp": time(),
        "X-Nonce": v4()
    };
    headers["X-Sign"] = getXSign(params, headers, api_key);
    const resp = await queueRequest(link, headers);
    return resp as T;
}

export function postFormDataRequest<T>(link, params, api_id, api_key) {
    const headers = {
        "X-Merchant-Id": api_id,
        "X-Timestamp": time(),
        "X-Nonce": v4()
    };
    headers["X-Sign"] = getXSign(params, headers, api_key);
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    return new Promise<T>((res, rej) => {
        request(
            {
                headers,
                uri: link,
                formData: params,
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
                    const resp = JSON.parse(body);
                    return res(resp);
                }
            }
        );
    });
}

export function getXSign(params, headers, api_key) {
    const merged = array_merge(headers, params);
    ksort(merged);
    const query = http_build_query(merged);
    return createHmac("sha1", api_key)
        .update(query)
        .digest("hex");
}

export function isSameSign(body, api_id) {
    const headers = {
        "X-Timestamp": body.timestamp,
        "X-Nonce": body.nonce,
        "X-Merchant-Id": body.merchant
    };
    const sign = body.sign;
    delete body.sign;
    delete body.timestamp;
    delete body.nonce;
    delete body.merchant;
    const newSign = getXSign(body, headers, api_id);
    return sign === newSign;
}
