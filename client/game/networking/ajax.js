export const Ajax = {
    send(method, url, data, callback, responseType) {
        // console.log(`Ajax.send`,method,url,data);

        const req = new XMLHttpRequest();
        req.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                if (callback) { callback(this.response) };
            };
        };
        req.open(method, url, true);
        if (method == 'POST') { req.setRequestHeader('Content-Type', 'application/json') };
        if (responseType) { req.responseType = responseType };

        if (method == 'POST') {
            req.send(JSON.stringify(data));
        } else {
            req.send();
        };
    },
    request: async function (method, url, data, responseType) {
        return new Promise((resolve, reject) => {
            this.send(method, url, data, (response) => {
                resolve(response);
            }, responseType);
        });
    }
};