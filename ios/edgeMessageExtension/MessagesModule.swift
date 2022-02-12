//
//  MessagesModule.swift
//  MessagesExtension
//

import Foundation
import Messages

@objc(MessagesModule)
class MessagesModule: NSObject {
  let viewController: MessagesViewController

  static func moduleName() -> String! {
    "RCTMessages"
  }

  static func requiresMainQueueSetup() -> Bool {
    false
  }

  init(viewController: MessagesViewController) {
    self.viewController = viewController
  }

  /**
   Insert a sticker into the active conversation.
   */
  @objc func insertSticker(
    _ stickerUrl: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejector reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let conversation = viewController.activeConversation else {
      return reject("ERROR", "No active conversation", nil)
    }

    guard let url = URL.init(string: stickerUrl) else {
      return reject("ERROR", "Invalid sticker URL", nil)
    }

    // This will be called when the sticker URL is resolved (in dev mode the
    // URLs will be http://, which MSSticker can't handle)
    func insertSticker(_ url: URL) {
      guard let sticker = try? MSSticker.init(
              contentsOfFileURL: url,
              localizedDescription: "sticker") else
      {
        return reject("ERROR", "Could not load sticker", nil)
      }

      conversation.insert(sticker) { error in
        if error != nil {
          reject("ERROR", "Could not insert sticker \(url)", error)
        } else {
          resolve(nil)
        }
      }

      // After inserting a sticker, request that the extension collapse back to
      // compact mode
      viewController.requestPresentationStyle(.compact)
    }

    if !url.isFileURL {
      // If the URL isn't a file URL, download it to a temp file and insert that
      URLSession.shared.downloadTask(with: url) { (tempFileUrl, response, error) in
        if let tmpFile = tempFileUrl {
          guard let data = try? Data(contentsOf: tmpFile) else {
            return reject("ERROR", "Could not read downloaded sticker", nil)
          }
          let documents = FileManager.default.urls(for: .documentDirectory,
                                                           in: .userDomainMask)[0]
          let fileUrl = documents.appendingPathComponent("temp.png")
          do {
            try data.write(to: fileUrl)
            insertSticker(fileUrl)
          } catch {
            reject("ERROR", "Could not save downloaded sticker", nil)
          }
        }
      }.resume()
    } else {
      // For file URLs, just insert them
      insertSticker(url)
    }
  }
}
