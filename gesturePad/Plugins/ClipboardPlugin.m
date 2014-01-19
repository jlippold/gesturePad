//
//  ClipboardPlugin.m
//  Clipboard plugin for PhoneGap
//
//  Copyright 2010 Michel Weimerskirch.
//


#import "ClipboardPlugin.h"

@implementation ClipboardPlugin

-(void)setText:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options {
	UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
	NSString     *text       = [arguments objectAtIndex:0];

	[pasteboard setValue:text forPasteboardType:@"public.text"];
}

-(void)getText:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options {
    NSString* callbackID = [arguments pop];
	UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];

	NSString *text = [pasteboard valueForPasteboardType:@"public.text"];
    
    
    CDVPluginResult* result = nil;
    NSString* jsString = nil;
    
    //PluginResult* pluginResult = [PluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:text];
  
    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:text];
    jsString = [result toSuccessCallbackString:callbackID];
    
    [self writeJavascript:jsString];

}

@end
