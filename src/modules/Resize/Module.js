/*
 * Resize the image by given percentage value
 */
module.exports = function Resize(options, UI) {

    var output;

    function draw(input, callback, progressObj) {

        options.resize = options.resize || "125%";
        options.resizeWidth = options.resizeWidth || "125%";
        options.resizeHeight = options.resizeHeight || "125%";

        progressObj.stop(true);
        progressObj.overrideFlag = true;

        var step = this;

        var imagejs = require('imagejs');

        function changePixel(r, g, b, a) {
            return [r, g, b, a]
        }

        function extraManipulation(pixels) {
            // value above 100% scales up, and below 100% scales down
            var custom = (options.resizeWidth != "125%" && options.resizeHeight != "125%") ? true : false

            var resize_value = parseInt(options.resize.slice(0, -1));

            var resize_width = parseInt(options.resizeWidth.slice(0, -1));
            var resize_height = parseInt(options.resizeHeight.slice(0, -1));

            var new_width,
                new_height;

            if (!custom) {
              new_width = Math.round(pixels.shape[0] * (resize_value / 100));
              new_height = Math.round(pixels.shape[1] * (resize_value / 100));
            } else if (custom) {
              new_width = Math.round(pixels.shape[0] * (resize_width / 100));
              new_height = Math.round(pixels.shape[1] * (resize_height / 100));
            }

            var bitmap = new imagejs.Bitmap({width: pixels.shape[0], height: pixels.shape[1]});
            bitmap._data.data = pixels.data;

            var resized = bitmap.resize({
                width: new_width, height: new_height,
                algorithm: "bicubicInterpolation"
            });

            pixels.data = resized._data.data;
            pixels.shape = [new_width,new_height,4];
            pixels.stride[1] = 4 * new_width;

            return pixels;
        }

        function output(image, datauri, mimetype) {
            // This output is accesible by Image Sequencer
            step.output = { src: datauri, format: mimetype };
        }

        return require('../_nomodule/PixelManipulation.js')(input, {
            output: output,
            changePixel: changePixel,
            extraManipulation: extraManipulation,
            format: input.format,
            image: options.image,
            inBrowser: options.inBrowser,
            callback: callback
        });
    }

    return {
        options: options,
        draw: draw,
        output: output,
        UI: UI
    }
}
