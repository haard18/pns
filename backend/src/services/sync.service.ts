import { JsonRpcProvider } from 'ethers';
import { Config } from '../config';
import logger from '../utils/logger';

export class SyncService {
  private polygonProvider: JsonRpcProvider;
  private pollingInterval: NodeJS.Timeout | null = null;
  private reconcileInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.polygonProvider = new JsonRpcProvider(Config.polygon.rpcUrl);
  }

  start(): void {
    this.startPolygonWatcher();
    this.startReconciliationLoop();
  }

  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.reconcileInterval) {
      clearInterval(this.reconcileInterval);
    }
  }

  private startPolygonWatcher(): void {
    this.pollingInterval = setInterval(async () => {
      try {
        const block = await this.polygonProvider.getBlockNumber();
        logger.debug('Polygon watcher heartbeat', { block });
      } catch (error) {
        logger.error('Polygon watcher error', { error });
      }
    }, 15_000);
  }

  private startReconciliationLoop(): void {
    this.reconcileInterval = setInterval(async () => {
      try {
        logger.debug('Running periodic reconciliation');
        // Future work: compare Postgres mirrorData vs on-chain
      } catch (error) {
        logger.error('Reconciliation loop failed', { error });
      }
    }, 60_000);
  }
}

