import * as md5 from "js-md5";

export const generateHash = (data, key: string) => {
    const str = generateQueryStr(data) + key;
    return md5(str);
};

export const generateQueryStr = (data: Object) => {
    const parameters = Object.entries(data);
    // const sortedParams = parameters.filter(i => i[1]).sort(this.compareFunction);
    return parameters.map(i => `${i[0]}=${i[1]}`).join("&");
};

export const compareFunction = (a: any, b: any) => {
    if (a[1] < b[1]) {
        return -1;
    }
    if (a[1] > b[1]) {
        return 1;
    }
    return 0;
};

export const gameUrlForFinPlay = (
    domain: string,
    token: string,
    symbol: string,
    technology: string,
    platform: string,
    language: string,
    cashierUrl: string,
    lobbyURL: string
) => {
    var key = encodeURIComponent(
        [
            "token=" + token,
            "&symbol=" + symbol,
            "&technology=" + technology,
            "&platform=" + platform,
            "&language=" + language,
            "&cashierUrl=" + cashierUrl,
            "&lobbyUrl=" + lobbyURL
        ].join("")
    );
    return ["https://" + domain, "/gs2c/playGame.do?key=" + key].join("");
};

export const gameUrl = (
    domain: string,
    token: string,
    symbol: string,
    technology: string,
    platform: string,
    language: string,
    cashierUrl: string,
    lobbyURL: string,
    secureLogin: string
) => {
    var key = encodeURIComponent(
        [
            "token=" + token,
            "&symbol=" + symbol,
            "&technology=" + technology,
            "&platform=" + platform,
            "&language=" + language,
            "&cashierUrl=" + cashierUrl,
            "&lobbyUrl=" + lobbyURL
        ].join("")
    );
    if (secureLogin) {
        return ["https://" + domain, "/gs2c/playGame.do?key=" + key + "&stylename=" + secureLogin].join("");
    } else {
        return ["https://" + domain, "/gs2c/playGame.do?key=" + key].join("");
    }
};

export const demoGameUrl = (demoGameDomail: string, symbol: string) => {
    return `https://${demoGameDomail}/gs2c/openGame.do?lang=en&cur=USD&gameSymbol=${symbol}&lobbyURL=https://www.pragmaticplay.com`;
};
