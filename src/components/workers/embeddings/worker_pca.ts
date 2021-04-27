const { PCA } = require('ml-pca');

/**
 * Worker thread that computes a stepwise projection
 */
self.addEventListener('message', function (e) {
    let context = self as any
    if (e.data.messageType == 'init') {
        context.raw = e.data
        context.input = e.data.input
        context.postMessage(null)
    } else {
        const pca = new PCA(context.input)
        const projected = pca.predict(context.input)

        context.postMessage(projected.data)
    }
}, false);