const fs = require('fs');

const MIMES = {
    'html': 'text/html',
    'js': 'text/javascript',
    'map': 'text/javascript',
    'css': 'text/css',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'svg': 'image/svg+xml',
    'json': 'application/json',
    'mp3': 'audio/mpeg',
    'wav': 'audio/vnd.wave',
    'xlsx': 'application/vnd.ms-excel',
    'csv': 'text/csv'
};

module.exports = {
    name: 'FileSystemController',
    serve: function (Req, Res) {
        const path = (Req.url.slice(0, 3) == '/nm') ? `./node_modules${Req.url.replace('/nm', '')}` : `./client${Req.url}`;
        const fileType = Req.url.split('.')[Req.url.split('.').length - 1];

        console.log(path, fileType);

        fs.readFile(path, function (err, fileData) {
            if (err) {
                console.log(`[FILESYSTEM-CONTROLLER]`, err);
                Res.end();
                return;
            };
            Res.writeHead(200, { 'Content-Type': MIMES[fileType] });
            Res.write(fileData);
            Res.end();
        });
    }
}