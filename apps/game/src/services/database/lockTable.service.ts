import { Injectable } from "@nestjs/common";
import _ from "underscore";
import async from "async";

// import keyValidator from "../../../../../shared/keysDictionary";
// import mongodb from "../../../../../shared/mongodbConnection";
import { systemConfig, stateOfX, popupTextManager } from "shared/common";
import { validateKeySets } from "shared/common/utils/activity";
import { ImdbDatabaseService } from "shared/common/utils/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/utils/pokerdatabase.service";
import { PerformActionService } from "./performAction.service";
import { LinkedListService } from "shared/common/utils/linkedList.service";


@Injectable()
export class LockTableService {



  private taskLists: Record<string, any> = {};

  constructor(
    private readonly imdb: ImdbDatabaseService,
    private readonly db: PokerDatabaseService,
    private readonly performAction: PerformActionService,
    private readonly TaskList:LinkedListService
  ) { }


  /**
   * The actual work that needs to be done
   * for every request that comes to this file
   * @param params request params; normally channelId, playerId, actionName, other args if needed
   */
  async actualTask(params: any): Promise<any> {
    try {
      const actionResponse = await new Promise<any>((resolve, reject) => {
        async.retry(
          {
            times: parseInt(`${systemConfig.lockTableRetryAttempts}`),
            interval: parseInt(`${systemConfig.lockTableRetryInterval}`)
          },
          async (rcb) => {
            try {
              const table = await this.imdb.updateTableImdb3(params);

              if (!table.value) {
                rcb({
                  success: false,
                  channelId: params.channelId,
                  info: "No table found in cache database!",
                  isRetry: false,
                  isDisplay: false
                }, null);
                return;
              }


              params.table = table.value;

              const performActionResponse = await this.performAction.divert(params);


              if (performActionResponse.success) {
                if (performActionResponse.table) {
                  performActionResponse.table.isOperationOn = false;
                  performActionResponse.table._v = performActionResponse.table._v + 1;
                  performActionResponse.table.operationEndTime = new Date();
                  rcb(null, performActionResponse);
                } else {

                  const tableRecord: any = await this.imdb.findTable({ channelId: params.channelId });

                  if (tableRecord) {
                    await this.db.insertingTable({
                      table: tableRecord,
                      createdAt: new Date(),
                      channelId: params.channelId,
                      type: "TABLEOBJECTMISSING",
                      response: performActionResponse,
                      request: _.omit(params, 'self', 'session', 'channel')
                    });
                  } else {
                  }

                  throw {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: params.channelId || "",
                    info: popupTextManager.dbQyeryInfo.DBFINDONE_PERFORMACTIONDIVERT_DBFINDANDMODIFY_ASYNCRETRY_ASYNCWATERFALL_KEYVALIDATORS_VALIDATEKEYSETS_LOCKTABLELOCK_LOCKTABLE + params.actionName
                  };
                }
              } else {
                // Release table object in case of failure

                const releasedTable = await this.imdb.updateTableImdb2(params);

                if (releasedTable) {
                  performActionResponse.table = _.omit(performActionResponse.table, 'deck');
                  throw performActionResponse;
                } else {
                  throw `Error while releasing table update, false response for - ${params.methodName}`;
                }
              }
            } catch (err) {
              if (err instanceof Error) {
                rcb({
                  success: false,
                  isRetry: false,
                  isDisplay: false,
                  channelId: params.channelId || "",
                  info: popupTextManager.dbQyeryInfo.DBFINDANDMODIFY_ASYNCRETRY_ASYNCWATERFALL_KEYVALIDATORS_VALIDATEKEYSETS_LOCKTABLELOCK_LOCKTABLE2 + JSON.stringify(err)
                }, null);
              } else {
                throw err;
              }
            }
          },
          (err, result) => {
            if (!err && result) {
              resolve(result);
            } else {
              reject(err);
            }
          }
        );
      });

      // Update current values of table inmemory database
      // const updatedTable = await mongodb.inMemoryDb.collection("tables").findAndModify(
      //   { 
      //     channelId: params.channelId, 
      //     isOperationOn: true, 
      //     actionName: params.actionName 
      //   },
      //   [],
      //   { $set: actionResponse.table },
      //   { upsert: false, new: true }
      // );

      const updatedTable: any = await this.imdb.updateTableImdb(params, actionResponse.table);

      if (!updatedTable) {
        throw new Error("Failed to update table in memory");
      }

      updatedTable.value = _.omit(updatedTable.value, 'deck');

      return {
        success: true,
        table: updatedTable.value,
        data: actionResponse.data
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * this function locks database to perform operation and then unlocks it
   * @param params request json object
   * @param cb callback function
   */
  async lock(params: any): Promise<any> {
    try {
      params.serverType = "database";

      const validated = await validateKeySets("Request", "database", "lockTableObject", params);

      if (!params.channelId) {
        return {
          success: false,
          channelId: params.channelId || "",
          info: popupTextManager.dbQyeryInfo.KEYVALIDATORS_VALIDATEKEYSETS_LOCKTABLELOCK_LOCKTABLE,
          isRetry: false,
          isDisplay: true
        };
      }

      if (validated.success) {
        this.taskLists[params.channelId] = this.taskLists[params.channelId] ;
        this.taskLists[params.channelId].push({ params });

        if (this.taskLists[params.channelId].length <= 1) {
          this.doFirstTask(this.taskLists[params.channelId]);
        }
      } else {
        return validated;
      }
    } catch (error) {
      return {
        success: false,
        info: "Error in lockTable.lock",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * as the list of channelId gets a task
   * execute the first request
   * recursively calls for next request if found
   * @param list linked list to store request task for each channelId
   */
  async doFirstTask(list: any): Promise<void> {
    const task = list.firstElm();
    if (task) {
      try {
        const res = await this.actualTask(task.params);
        task.cb(res);
        list.shift();

        if (list.length > 0) {
          await this.doFirstTask(list);
        }
      } catch (error) {
        task.cb({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        list.shift();

        if (list.length > 0) {
          await this.doFirstTask(list);
        }
      }
    }
  }

}
