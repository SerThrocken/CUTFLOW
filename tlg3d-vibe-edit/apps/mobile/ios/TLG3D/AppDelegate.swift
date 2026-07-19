// AppDelegate.swift — CutFlow iOS
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return true
  }

  // MARK: - Remote notifications (APNs)

  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    NotificationCenter.default.post(name: .cutflowAPNSToken, object: token)
  }

  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("[CutFlow] APNs registration failed: \(error)")
  }

  // MARK: - Deep link handling

  func application(
    _ application: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    // Handle cutflow:// deep links
    if url.scheme == "cutflow" {
      NotificationCenter.default.post(name: .cutflowDeepLink, object: url)
      return true
    }
    return false
  }

  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return true
  }
}

extension Notification.Name {
  static let cutflowAPNSToken = Notification.Name("cutflow.apns.token")
  static let cutflowDeepLink  = Notification.Name("cutflow.deeplink")
}
