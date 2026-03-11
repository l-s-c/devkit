// ============================================================
// Web Worker Manager — 大文件处理不阻塞主线程
// ============================================================

class WorkerManager {
  constructor() {
    this.worker = null;
    this.pending = new Map();
    this.nextId = 0;
    this._initWorker();
  }

  _initWorker() {
    this.worker = new Worker(new URL('./json-worker.js', import.meta.url));
    this.worker.onmessage = (e) => {
      const { id, result, error } = e.data;
      const handler = this.pending.get(id);
      if (handler) {
        this.pending.delete(id);
        if (error) handler.reject(new Error(error));
        else handler.resolve(result);
      }
    };
  }

  run(type, payload) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, payload });
    });
  }
}

// ES module export + window fallback for non-module scripts
const workerManager = new WorkerManager();
export default workerManager;
window.workerManager = workerManager;
