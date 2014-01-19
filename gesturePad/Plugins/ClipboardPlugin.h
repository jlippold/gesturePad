//
//  ClipboardPlugin.h
//  Clipboard plugin for PhoneGap
//
//  Copyright 2010 Michel Weimerskirch.
//

#import <Cordova/CDVPlugin.h>

@interface ClipboardPlugin : CDVPlugin <UITabBarDelegate> {

}

-(void)setText:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

-(void)getText:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

@end
