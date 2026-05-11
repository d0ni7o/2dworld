const AssetManager = {
    async loadImage(id, source, loadDimensions = false) {
        return new Promise(async (resolve, reject) => {
            if (document.getElementById(id)) {
                resolve(document.getElementById(id));
                return;
            };

            if (!source) {
                // console.error(`Image ${id} not found and passed with no source`);
                resolve(undefined);
                return;
            };

            const imgHtml = document.createElement("img");
            imgHtml.id = id;
            document.getElementById('images').appendChild(imgHtml);

            const img = new Image();
            // img.setAttribute('crossOrigin', '')
            // img.crossOrigin = 'Anonymous'
            img.onload = function () {
                imgHtml.src = img.src;
                if (loadDimensions) {
                    imgHtml.width = Number(img.width);
                    imgHtml.height = Number(img.height);
                    resolve(img);
                    return
                };
                resolve(imgHtml);
            };
            img.src = source;
        });
    }
}