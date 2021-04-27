
export abstract class EmbeddingController {
    worker: Worker
    stepper: any

    notifier: any

    startingRoutine: () => void

    start() {
        if (this.startingRoutine) {
            this.startingRoutine()
        }
        
    }

    abstract step()

    terminate() {
        this.worker.terminate()
    }
}