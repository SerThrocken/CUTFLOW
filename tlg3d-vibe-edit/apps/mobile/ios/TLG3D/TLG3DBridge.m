// TLG3D Objective-C Bridge Header
// TLG3DBridge.m
// Required to expose the Swift class to React Native's bridge.

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(TLG3DModule, RCTEventEmitter)

RCT_EXTERN_METHOD(
  registerForPushNotifications:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  sendSMS:(NSArray *)recipients
  body:(NSString *)body
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  shareFile:(NSString *)filePath
  title:(NSString *)title
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  saveVideoToCameraRoll:(NSString *)filePath
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  authenticateWithBiometrics:(NSString *)reason
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  startDesktopDiscovery:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(stopDesktopDiscovery)

RCT_EXTERN_METHOD(
  sendFileToDesktop:(NSString *)filePath
  desktopHost:(NSString *)desktopHost
  desktopPort:(NSNumber *)desktopPort
  metadata:(NSDictionary *)metadata
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
