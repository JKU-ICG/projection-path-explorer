import { Vect } from "../../../Utility/Data/Vect"
import { Dataset } from "../../../Utility/Data/Dataset"
import { EmbeddingController } from "./EmbeddingController"

export class UMAPEmbeddingController extends EmbeddingController {
    targetBounds: any
    
    init(dataset: Dataset, selection: any, params: any, samples?) {
        this.worker = new Worker('dist/umap.js')
        this.worker.postMessage({
            messageType: 'init',
            input: dataset.asTensor(selection.filter(e => e.checked), samples),
            seed: dataset.vectors.map(sample => [sample.x, sample.y]),
            params: params
        })

        this.worker.addEventListener('message', (e) => {
            var Y = e.data
            this.stepper(Y)
            this.notifier()
        }, false);

        if (samples) {
            this.targetBounds = this.bounds(samples)
        }
    }

    boundsY(Y) {
         // Get rectangle that fits around data set
         var minX = 1000, maxX = -1000, minY = 1000, maxY = -1000;
         Y.forEach(sample => {
           minX = Math.min(minX, sample[0])
           maxX = Math.max(maxX, sample[0])
           minY = Math.min(minY, sample[1])
           maxY = Math.max(maxY, sample[1])
         })
       
         return {
             x: minX,
             y: minY,
             width: maxX - minX,
             height: maxY - minY,
             left: minX,
             top: minY,
             right: maxX,
             bottom: maxY
         }
    }



    bounds(samples: Vect[]) {
        // Get rectangle that fits around data set
        var minX = 1000, maxX = -1000, minY = 1000, maxY = -1000;
        samples.forEach(sample => {
          minX = Math.min(minX, sample.x)
          maxX = Math.max(maxX, sample.x)
          minY = Math.min(minY, sample.y)
          maxY = Math.max(maxY, sample.y)
        })
      
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            left: minX,
            top: minY,
            right: maxX,
            bottom: maxY
        }
    }

    step() {
        this.worker.postMessage({
            messageType: 'step'
        })
    }
}