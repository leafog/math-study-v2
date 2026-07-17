import {
  AttachmentQueue,
  IndexDBFileSystemStorageAdapter,
  type RemoteStorageAdapter,
} from "@powersync/web";
import { db } from "./pw-db";
import { PowerSyncFileStore } from "./storage/ps-file-store";

const localStorage = new IndexDBFileSystemStorageAdapter("math-study-file");

// 不需要远程存储，所有操作直接成功
const noopRemoteStorage: RemoteStorageAdapter = {
  uploadFile: async () => {},
  downloadFile: async () => new ArrayBuffer(0),
  deleteFile: async () => {},
};

const attachmentQueue = new AttachmentQueue({
  db,
  remoteStorage: noopRemoteStorage,
  localStorage,
  watchAttachments: () => {},
  downloadAttachments: false,
});

// IndexedDB 初始化 + 附件队列启动
await localStorage.initialize();
// attachmentQueue.startSync(); // 需要时取消注释
export const fileStore = new PowerSyncFileStore(attachmentQueue);

export { attachmentQueue, localStorage };
