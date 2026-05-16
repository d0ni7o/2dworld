//**NET_GAMES_UNIVERSALS**
const files = '(html|js|css|map|png|jpeg|jpg|json|mp3|wav|xlsx|csv)';

const FileSystemController = require('./file-system-controller.js');

const Router = {
    route: function (Req, Res) {
        if (this.routeMatch('GET', `^\/readFolderContents*`, FileSystemController, 'readFolderContents', Req, Res)) { return };
        if (this.routeMatch('GET', `.${files}$`, FileSystemController, 'serve', Req, Res)) { return };

        //NO ROUTE MATCH
        FileSystemController.serve({ ...Req, url: '/index.html' }, Res);
        // Res.end(/*`No routes matched ${Req.method} ${Req.url}`*/);

        // console.log(`ROUTER '${Req.method}' ${Req.url} NO MATCH`);
    },
    routeMatch: function (method, url, Controller, action, Req, Res) {
        if (Req.method != method) { return false };
        if (!RegExp(url).test(Req.url)) { return false };

        // console.log(`${Req.url} MATCH ROUTE: ${method} ${url} ${Controller.name}.${action}`);

        this.parse(method, Req);
        Controller[action](Req, Res);

        return true;
    },
    parse(method, Req) {
        Req.Params = {};
        switch (method) {
            case 'GET':
                if (Req.url.indexOf('?') != -1) { Req.url.split('?')[1].split('&').forEach((urlPairString) => { Req.Params[urlPairString.split('=')[0]] = urlPairString.split('=')[1] }) };
                break;
            case 'POST':
                break;
            default:
                break;
        };
    }
};

module.exports = Router;