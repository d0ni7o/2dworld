const http = require('http');
const Router = require('./router');

const httpServer = http.createServer((Req, Res) => {
    console.log(Req.method, Req.url);
    switch (Req.method) {
        case 'GET':
            Router.route(Req, Res);
            break;
        case 'POST':
            let data = '';
            Req.on('data', (chunk) => { data += chunk });
            Req.on('end', () => {
                try {
                    console.log(`[HTTP-SERVER] Parsed POST data`, data);
                    Req.body = JSON.parse(data || {});
                    Res.end();
                } catch (error) {
                    console.log(`[HTTP-SERVER] Error parsing POST data`, error);
                    Res.end();
                };
            });
            break;
        default:
            const error = `ERROR: UNEXPECTED REQUEST METHOD`;
            console.log(`[HTTP-SERVER] Error`, error);
            Res.end(error);
            break;
    };
});

const port = process.env.PORT || 8081;

httpServer.listen(port, async () => {
    console.log(`[HTTP-SERVER] Listening on PORT:${port}`);
});