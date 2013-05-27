//
//  ProgressHud.m
//
// Created by Olivier Louvignes on 04/25/2012.
//
// Copyright 2011 Olivier Louvignes. All rights reserved.
// MIT Licensed


#import <CORDOVA/CDVPlugin.h>
#import "MBProgressHUD.h"

@interface ProgressHud : CDVPlugin {

	NSString* callbackID;
	MBProgressHUD* progressHUD;

}

@property (nonatomic, copy) NSString* callbackID;
@property (nonatomic, assign) MBProgressHUD* progressHUD;

//Instance Method
- (void) show:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
- (void) set:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
- (void) hide:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

@end
